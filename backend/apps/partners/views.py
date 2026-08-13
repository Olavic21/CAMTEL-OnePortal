from rest_framework import generics

from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.news.models import News
from apps.news.serializers import NewsSerializer
from apps.products.models import Product
from apps.products.serializers import ProductSerializer

from .authentication import PartnerAPIKeyAuthentication
from .models import PartnerAPIKey
from .permissions import IsPartnerAuthenticated, PartnerScopePermission


class PartnerProductListView(generics.ListAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    required_scope = PartnerAPIKey.SCOPE_PRODUCTS_READ
    serializer_class = ProductSerializer
    queryset = Product.objects.filter(is_published=True).select_related('category')


class PartnerCategoryListView(generics.ListAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    required_scope = PartnerAPIKey.SCOPE_CATEGORIES_READ
    serializer_class = CategorySerializer
    queryset = Category.objects.filter(is_active=True)


class PartnerNewsListView(generics.ListAPIView):
    authentication_classes = [PartnerAPIKeyAuthentication]
    permission_classes = [IsPartnerAuthenticated, PartnerScopePermission]
    required_scope = PartnerAPIKey.SCOPE_NEWS_READ
    serializer_class = NewsSerializer
    queryset = News.objects.filter(is_published=True)
