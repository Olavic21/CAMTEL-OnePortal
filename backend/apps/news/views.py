from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import ReadPublicWriteAdminOrEditor

from .models import News
from .serializers import NewsSerializer


class NewsViewSet(viewsets.ModelViewSet):
    queryset = News.objects.all()
    serializer_class = NewsSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]
    lookup_field = 'slug'
    lookup_value_regex = '[^/]+'

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if lookup.isdigit():
            return get_object_or_404(self.get_queryset(), pk=lookup)
        return get_object_or_404(self.get_queryset(), slug=lookup)
