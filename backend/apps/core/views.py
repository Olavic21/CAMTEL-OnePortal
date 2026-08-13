from django.db.models import Q
from django.http import HttpResponse
from io import BytesIO
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.contacts.models import ContactMessage
from apps.news.models import News
from apps.news.serializers import NewsSerializer
from apps.products.models import Product
from apps.products.serializers import ProductSerializer
from apps.promotions.models import Promotion

from .models import ActivityLog, Notification
from .permissions import AdminOnly, IsAdminOrEditor
from .serializers import ActivityLogSerializer, NotificationSerializer


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        checks = {
            'status': 'ok',
            'database': 'ok',
            'storage': 'ok',
            'version': '1.0.0',
        }
        try:
            from django.db import connection
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
        except Exception:
            checks['database'] = 'error'
            checks['status'] = 'degraded'

        try:
            from django.conf import settings
            import os
            media_root = getattr(settings, 'MEDIA_ROOT', None)
            if media_root:
                os.makedirs(media_root, exist_ok=True)
                if not os.access(media_root, os.W_OK):
                    checks['storage'] = 'error'
                    checks['status'] = 'degraded'
        except Exception:
            checks['storage'] = 'error'
            checks['status'] = 'degraded'

        http_status = status.HTTP_200_OK if checks['status'] == 'ok' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(checks, status=http_status)


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminOrEditor]

    def get(self, request):
        return Response({
            'products_published': Product.objects.filter(is_published=True).count(),
            'products_draft': Product.objects.filter(is_published=False).count(),
            'news_recent': NewsSerializer(
                News.objects.filter(is_published=True).order_by('-published_at')[:5],
                many=True,
                context={'request': request},
            ).data,
            'promotions_active': Promotion.objects.filter(is_active=True).count(),
            'contact_messages_new': ContactMessage.objects.filter(is_read=False).count(),
        })


class ChatbotView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        question = (request.data.get('question') or '').strip().lower()
        if not question:
            return Response({'answer': 'Posez une question sur nos produits ou services.'})

        from apps.products.models import ProductFAQ
        faq = ProductFAQ.objects.filter(
            Q(question__icontains=question) | Q(answer__icontains=question)
        ).select_related('product').first()
        if faq:
            return Response({
                'answer': faq.answer,
                'source': 'faq',
                'product': faq.product.name,
            })

        product = Product.objects.filter(
            Q(name__icontains=question) | Q(description__icontains=question),
            is_published=True,
        ).first()
        if product:
            return Response({
                'answer': f'{product.name}: {product.description[:300]}',
                'source': 'product',
            })

        return Response({
            'answer': 'Je n\'ai pas trouvé de réponse précise. Contactez-nous via le formulaire de contact.',
            'source': 'fallback',
        })


class SearchAutocompleteView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        query = (request.query_params.get('q') or '').strip()
        if len(query) < 2:
            return Response([])
        products = Product.objects.filter(
            Q(name__icontains=query) | Q(slug__icontains=query),
            is_published=True,
        ).values('id', 'name', 'slug')[:10]
        return Response([{'type': 'product', **item} for item in products])


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [AdminOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        target_model = self.request.query_params.get('target_model')
        user_id = self.request.query_params.get('user')
        if target_model:
            queryset = queryset.filter(target_model=target_model)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset


class NotificationViewSet(viewsets.ModelViewSet):
    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminOrEditor]

    def get_queryset(self):
        queryset = super().get_queryset()
        if self.request.query_params.get('unread') == 'true':
            queryset = queryset.filter(is_read=False)
        return queryset

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        notification.save(update_fields=['is_read'])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(is_read=True)
        return Response({'updated': updated})
