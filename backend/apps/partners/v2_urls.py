from django.urls import include, path

from .v2_views import (
    PartnerV2CategoryListView,
    PartnerV2NewsListView,
    PartnerV2ProductDetailView,
    PartnerV2ProductListView,
    PartnerV2SearchView,
)

urlpatterns = [
    path('products/', PartnerV2ProductListView.as_view(), name='partner-v2-products'),
    path('products/<slug:slug>/', PartnerV2ProductDetailView.as_view(), name='partner-v2-product'),
    path('categories/', PartnerV2CategoryListView.as_view(), name='partner-v2-categories'),
    path('news/', PartnerV2NewsListView.as_view(), name='partner-v2-news'),
    path('search/', PartnerV2SearchView.as_view(), name='partner-v2-search'),
]
