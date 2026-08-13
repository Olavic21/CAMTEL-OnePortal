from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from io import BytesIO
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import ReadPublicWriteAdminOrEditor

from .models import Product, ProductFAQ
from .serializers import ProductCompareSerializer, ProductFAQSerializer, ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category')
    serializer_class = ProductSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]
    lookup_field = 'slug'
    lookup_value_regex = '[^/]+'

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if lookup.isdigit():
            return get_object_or_404(self.get_queryset(), pk=lookup)
        return get_object_or_404(self.get_queryset(), slug=lookup)

    def get_queryset(self):
        queryset = super().get_queryset()
        from django.db.models import Q
        from apps.core.i18n import get_request_language
        query = self.request.query_params.get('q')
        if query:
            lang = get_request_language(self.request)
            if lang == 'en':
                queryset = queryset.filter(
                    Q(name_en__icontains=query) |
                    Q(name__icontains=query) |
                    Q(description_en__icontains=query) |
                    Q(description__icontains=query) |
                    Q(category__name_en__icontains=query) |
                    Q(category__name__icontains=query)
                )
            else:
                queryset = queryset.filter(
                    Q(name__icontains=query) |
                    Q(description__icontains=query) |
                    Q(category__name__icontains=query)
                )
        return queryset

    @action(detail=False, methods=['get'], url_path='compare')
    def compare(self, request):
        ids_param = request.query_params.get('ids', '')
        id_list = []
        for token in ids_param.split(','):
            token = token.strip()
            if token.isdigit():
                id_list.append(int(token))
        id_list = id_list[:3]
        if not id_list:
            return Response({'detail': 'Fournir ids=1,2,3 (max 3 produits).'}, status=status.HTTP_400_BAD_REQUEST)
        products = (
            self.get_queryset()
            .filter(id__in=id_list, is_published=True)
            .select_related('category')
            .prefetch_related('faqs')
        )
        ordered = sorted(products, key=lambda p: id_list.index(p.id))
        return Response(ProductCompareSerializer(ordered, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, slug=None):
        product = self.get_object()
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except ImportError:
            return Response({'detail': 'reportlab non installé.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        pdf.setTitle(product.name)
        y = 800
        pdf.drawString(50, y, f'Fiche produit: {product.name}')
        y -= 30
        pdf.drawString(50, y, f'Prix: {product.price} FCFA')
        y -= 30
        pdf.drawString(50, y, f'Catégorie: {product.category.name}')
        y -= 30
        for line in product.description.split('\n')[:20]:
            pdf.drawString(50, y, line[:90])
            y -= 20
        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{product.slug}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
        product = self.get_object()
        product.is_published = True
        product.save(update_fields=['is_published', 'updated_at'])
        return Response(ProductSerializer(product, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def stats(self, request, slug=None):
        product = self.get_object()
        product.views_count += 1
        product.save(update_fields=['views_count', 'updated_at'])
        return Response({
            'id': product.id,
            'name': product.name,
            'views_count': product.views_count,
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        return Response({
            'total_products': queryset.count(),
            'active_products': queryset.filter(is_active=True).count(),
            'published_products': queryset.filter(is_published=True).count(),
            'top_products': ProductSerializer(
                queryset.order_by('-views_count')[:5],
                many=True,
                context={'request': request},
            ).data,
        })

    @action(detail=True, methods=['get', 'post'], url_path='faqs')
    def faqs(self, request, slug=None):
        product = self.get_object()
        if request.method == 'GET':
            faqs = product.faqs.all()
            return Response(ProductFAQSerializer(faqs, many=True).data)
        serializer = ProductFAQSerializer(data={**request.data, 'product': product.id})
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductFAQViewSet(viewsets.ModelViewSet):
    queryset = ProductFAQ.objects.select_related('product').all()
    serializer_class = ProductFAQSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
