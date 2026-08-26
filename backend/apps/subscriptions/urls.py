from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import SubscriptionRequestViewSet

router = DefaultRouter()
router.register(r'subscriptions', SubscriptionRequestViewSet, basename='subscription')

urlpatterns = [
    path('', include(router.urls)),
]
