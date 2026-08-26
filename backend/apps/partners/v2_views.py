"""API partenaires V2 — catalogue public enrichi, auth par clé API (X-API-Key).

Contrôle d'acces par scope (PartnerScopePermission) + throttle/partenaire.
Chaque endpoint lit le scope requis via `required_scope` sur la vue.
"""
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.core.throttling import PartnerRateThrottle
from apps.news.models import News
from apps.news.serializers import NewsSerializer
from apps.products.models import Product
from apps.products.serializers import ProductSerializer

from .authentication import PartnerAPIKeyAuthentication
from .models import PartnerAPIKey
from .permissions import IsPartnerAuthenticated, PartnerScopePermission


class V2PageNumberPagination(PageNumberPagination):
    """Pagination V2 partenaires : 20 par page par defaut, plafond 100."""

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


def _published_products():
    return Product.objects.filter(is_published=True, is_active=True).select_related('category')


class PartnerV2ProductListView(generics.ListAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    throttle_classes = [PartnerRateThrottle]
    required_scope = PartnerAPIKey.SCOPE_PRODUCTS_READ
    pagination_class = V2PageNumberPagination
    serializer_class = ProductSerializer
    queryset = _published_products()

    def get_queryset(self):
        qs = super().get_queryset()
        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(name__icontains=q)
        segment = self.request.query_params.get('segment')
        if segment:
            qs = qs.filter(category__segment=segment)
        offer_type = self.request.query_params.get('offer_type')
        if offer_type:
            qs = qs.filter(offer_type=offer_type.upper())
        min_price = self.request.query_params.get('min_price')
        max_price = self.request.query_params.get('max_price')
        if min_price:
            qs = qs.filter(price__gte=min_price)
        if max_price:
            qs = qs.filter(price__lte=max_price)
        return qs


class PartnerV2ProductDetailView(generics.RetrieveAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    throttle_classes = [PartnerRateThrottle]
    required_scope = PartnerAPIKey.SCOPE_PRODUCTS_READ
    serializer_class = ProductSerializer
    lookup_field = 'slug'
    queryset = _published_products()


class PartnerV2CategoryListView(generics.ListAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    throttle_classes = [PartnerRateThrottle]
    required_scope = PartnerAPIKey.SCOPE_CATEGORIES_READ
    queryset = Category.objects.filter(is_active=True)
    serializer_class = CategorySerializer
    pagination_class = V2PageNumberPagination


class PartnerV2NewsListView(generics.ListAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    throttle_classes = [PartnerRateThrottle]
    required_scope = PartnerAPIKey.SCOPE_NEWS_READ
    queryset = News.objects.filter(is_published=True)
    serializer_class = NewsSerializer
    pagination_class = V2PageNumberPagination


class PartnerV2SearchView(generics.ListAPIView):
    """Recherche croisee partenaire : produits + categories + actualites."""

    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    throttle_classes = [PartnerRateThrottle]
    required_scope = PartnerAPIKey.SCOPE_PRODUCTS_READ
    pagination_class = None
    serializer_class = ProductSerializer

    def get_queryset(self):
        q = (self.request.query_params.get('q') or '').strip()
        if not q:
            return Product.objects.none()
        return _published_products().filter(name__icontains=q)

    def list(self, request, *args, **kwargs):
        q = (request.query_params.get('q') or '').strip()
        products = self.get_queryset()
        from rest_framework.response import Response

        payload = {
            'query': q,
            'products': ProductSerializer(products, many=True, context={'request': request}).data,
            'categories': CategorySerializer(
                Category.objects.filter(is_active=True, name__icontains=q)[:5],
                many=True, context={'request': request},
            ).data,
            'news': NewsSerializer(
                News.objects.filter(is_published=True, title__icontains=q)[:5],
                many=True, context={'request': request},
            ).data,
        }
        return Response(payload)
