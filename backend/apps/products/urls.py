from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProductFAQViewSet, ProductViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-faqs', ProductFAQViewSet, basename='product-faq')

urlpatterns = [
    path('', include(router.urls)),
]
