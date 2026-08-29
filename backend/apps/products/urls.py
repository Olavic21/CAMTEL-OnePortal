from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    ProductFAQViewSet,
    ProductImageDetailView,
    ProductImageListCreateView,
    ProductViewSet,
    SegmentViewSet,
    ServiceViewSet,
)

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'product-faqs', ProductFAQViewSet, basename='product-faq')
router.register(r'services', ServiceViewSet, basename='service')
router.register(r'segments', SegmentViewSet, basename='segment')

urlpatterns = [
    # Sous-ressources images d'un produit (declarees avant le router pour eviter
    # que la route detail /products/<slug>/ ne les capture).
    path('products/<int:product_id>/images/<int:pk>/', ProductImageDetailView.as_view(), name='product-image-detail'),
    path('products/<int:product_id>/images/', ProductImageListCreateView.as_view(), name='product-image-list'),
    path('', include(router.urls)),
]
