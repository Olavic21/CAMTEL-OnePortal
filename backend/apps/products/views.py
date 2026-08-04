from django.db.models import Count, Q
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Product, ProductFAQ
from .serializers import ProductFAQSerializer, ProductSerializer


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category')
    serializer_class = ProductSerializer
    search_fields = ('name', 'description', 'category__name')
    filterset_fields = ('category', 'is_active', 'is_published')

    def get_queryset(self):
        queryset = super().get_queryset()
        query = self.request.query_params.get('q')
        if query:
            queryset = queryset.filter(
                Q(name__icontains=query) |
                Q(description__icontains=query) |
                Q(category__name__icontains=query)
            )
        return queryset

    @action(detail=True, methods=['get'])
    def stats(self, request, *args, **kwargs):
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


class ProductFAQViewSet(viewsets.ModelViewSet):
    queryset = ProductFAQ.objects.select_related('product').all()
    serializer_class = ProductFAQSerializer
    search_fields = ('question', 'answer')

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset
