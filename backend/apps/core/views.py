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

from .models import ActivityLog, AnalyticsEvent, Notification, SupportTicket, TicketMessage
from .permissions import AdminOnly, IsAdminOrEditor
from .serializers import (
    ActivityLogSerializer,
    AnalyticsEventSerializer,
    NotificationSerializer,
    SupportTicketSerializer,
    TicketMessageSerializer,
)
from .throttling import ChatbotRateThrottle, SearchRateThrottle


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
    throttle_classes = [ChatbotRateThrottle]

    def post(self, request):
        # Robustesse : un corps JSON mal forme (string, liste, null) doit produire
        # une 400 explicite et non une 500 AttributeError. Le frontend envoie
        # toujours { question } (dict), mais un appel exterieur ou un provider LLM
        # retournant un body inattendu doit etre gere sans faire planter le
        # process. Le fallback search reste disponible pour question vide.
        if not isinstance(request.data, dict):
            return Response(
                {'answer': 'Posez une question sur nos produits ou services.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        question = (request.data.get('question') or '').strip()
        if not question:
            return Response({'answer': 'Posez une question sur nos produits ou services.'})
        from apps.core.chatbot_service import ask_chatbot
        return Response(ask_chatbot(question.lower()))



class SearchAutocompleteView(APIView):
    """Recherche globale (section 12 mission) : produits/offres, actualites,
    promotions et FAQ. Portait uniquement sur les produits auparavant —
    etendu pour couvrir les 4 sources demandees par le cahier des charges."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchRateThrottle]

    def get(self, request):
        from apps.products.models import ProductFAQ

        query = (request.query_params.get('q') or '').strip()
        if len(query) < 2:
            return Response([])

        results = []

        products = Product.objects.filter(
            Q(name__icontains=query) | Q(slug__icontains=query),
            is_published=True,
        ).values('id', 'name', 'slug')[:5]
        results += [{'type': 'product', 'id': p['id'], 'title': p['name'], 'slug': p['slug']} for p in products]

        news = News.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query),
            is_published=True,
        ).values('id', 'title', 'slug')[:5]
        results += [{'type': 'news', 'id': n['id'], 'title': n['title'], 'slug': n['slug']} for n in news]

        promotions = Promotion.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query),
            is_active=True,
        ).values('id', 'title', 'slug')[:5]
        results += [{'type': 'promotion', 'id': pr['id'], 'title': pr['title'], 'slug': pr['slug']} for pr in promotions]

        faqs = ProductFAQ.objects.filter(
            Q(question__icontains=query) | Q(answer__icontains=query),
        ).select_related('product').values('id', 'question', 'product__slug')[:5]
        results += [
            {'type': 'faq', 'id': f['id'], 'title': f['question'], 'slug': f['product__slug']} for f in faqs
        ]

        return Response(results[:15])


class EligibilityCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        product_id = request.data.get('product_id')
        slug = request.data.get('slug')
        if not product_id and not slug:
            return Response({'detail': 'product_id ou slug est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        lookup = {'pk': product_id} if product_id else {'slug': slug}
        try:
            product = Product.objects.get(**lookup)
        except Product.DoesNotExist:
            return Response({'detail': 'Offre introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.core.v2_services import get_eligibility_provider
        provider = get_eligibility_provider()
        result = provider.check(
            product,
            address=(request.data.get('address') or '').strip(),
            phone=(request.data.get('phone') or '').strip(),
        )
        data = result.as_dict()
        data['provider'] = provider.name
        return Response(data)


class PaymentInitiateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        product_id = request.data.get('product_id')
        amount = request.data.get('amount')
        if not amount and product_id:
            try:
                amount = Product.objects.get(pk=product_id).price
            except Product.DoesNotExist:
                return Response({'detail': 'Offre introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        if amount in (None, ''):
            return Response({'detail': 'amount est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        from decimal import Decimal, InvalidOperation
        try:
            amount_decimal = Decimal(str(amount))
        except (InvalidOperation, TypeError):
            return Response({'detail': 'amount invalide.'}, status=status.HTTP_400_BAD_REQUEST)
        if amount_decimal <= 0:
            return Response({'detail': 'amount doit être positif.'}, status=status.HTTP_400_BAD_REQUEST)

        from apps.core.v2_services import generate_reference, get_payment_provider
        provider = get_payment_provider()
        result = provider.initiate_payment(
            amount=amount_decimal,
            currency=request.data.get('currency') or 'XAF',
            customer={
                'id': request.user.pk,
                'email': request.user.email,
                'username': request.user.username,
            },
            reference=request.data.get('reference') or generate_reference('PAY'),
            metadata={'product_id': product_id, **(request.data.get('metadata') or {})},
        )
        return Response(result, status=status.HTTP_201_CREATED)


class DocumentSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.core.v2_services import DocumentStore
        store = DocumentStore()
        query = request.query_params.get('q', '')
        kind = request.query_params.get('kind')
        product_id = request.query_params.get('product_id')
        if query:
            documents = store.search(query)
        else:
            documents = store.list_documents(
                product_id=int(product_id) if product_id else None,
                kind=kind,
            )
        return Response({'count': len(documents), 'results': documents})


class RecommendationView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.core.v2_services import recommend_products
        product = None
        slug = request.query_params.get('product') or request.query_params.get('slug')
        if slug:
            try:
                product = Product.objects.get(slug=slug)
            except Product.DoesNotExist:
                return Response({'detail': 'Offre introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            limit = int(request.query_params.get('limit', 3))
        except ValueError:
            limit = 3
        recommendations = recommend_products(
            product,
            segment=request.query_params.get('segment', ''),
            limit=max(1, min(limit, 10)),
        )
        return Response({'count': len(recommendations), 'results': recommendations})


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


class AnalyticsEventCreateView(APIView):
    """Collecte d'un evenement analytique public (offer_view, search, faq...)."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchRateThrottle]

    def post(self, request):
        from apps.core.analytics import record_event

        event_type = (request.data.get('event_type') or '').strip()
        product = None
        product_id = request.data.get('product_id')
        if product_id:
            product = Product.objects.filter(pk=product_id).first()
        event = record_event(
            event_type=event_type,
            user=request.user,
            product=product,
            payload=request.data.get('payload') or {},
        )
        if event is None:
            return Response(
                {'detail': 'Type d\'evenement inconnu.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(AnalyticsEventSerializer(event).data, status=status.HTTP_201_CREATED)


class AnalyticsSummaryView(APIView):
    """Resume analytique admin : KPIs, top offres, top categories, recherches."""

    permission_classes = [IsAdminOrEditor]

    def get(self, request):
        from apps.core.analytics import analytics_summary

        days = request.query_params.get('days', '30')
        return Response(analytics_summary(days=days))


class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.select_related('client', 'assigned_agent').prefetch_related('messages')
    serializer_class = SupportTicketSerializer

    def get_permissions(self):
        if self.action in {'create', 'my_tickets', 'reply'}:
            return [permissions.IsAuthenticated()]
        if self.action in {'list', 'retrieve', 'update', 'partial_update', 'destroy'}:
            return [AdminOnly()]
        return [AdminOnly()]

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-tickets')
    def my_tickets(self, request):
        queryset = self.get_queryset().filter(client=request.user)
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        ticket = self.get_object()
        is_staff = getattr(request.user, 'role', '') in {'SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'EDITOR'}
        if not is_staff and ticket.client_id != request.user.id:
            return Response({'detail': 'Accès interdit à ce ticket.'}, status=status.HTTP_403_FORBIDDEN)

        message_text = (request.data.get('message') or '').strip()
        if not message_text:
            return Response({'detail': 'message est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        message = TicketMessage.objects.create(
            ticket=ticket,
            author=request.user if request.user.is_authenticated else None,
            message=message_text,
        )
        ticket.save(update_fields=['updated_at'])
        return Response(TicketMessageSerializer(message, context={'request': request}).data, status=status.HTTP_201_CREATED)
