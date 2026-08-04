from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import MediaFileViewSet

router = DefaultRouter()
router.register(r'media', MediaFileViewSet, basename='mediafile')

urlpatterns = [
    path('', include(router.urls)),
]
