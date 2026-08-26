from django.urls import path

from .views import PartnerCategoryListView, PartnerNewsListView, PartnerProductListView

urlpatterns = [
    path('products/', PartnerProductListView.as_view(), name='partner-products'),
    path('categories/', PartnerCategoryListView.as_view(), name='partner-categories'),
    path('news/', PartnerNewsListView.as_view(), name='partner-news'),
]
