from django.shortcuts import get_object_or_404
from rest_framework import viewsets

from apps.core.permissions import ReadPublicWriteAdminOrEditor

from .models import Category
from .serializers import CategorySerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]
    lookup_field = 'slug'
    lookup_value_regex = '[^/]+'

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if lookup.isdigit():
            return get_object_or_404(self.get_queryset(), pk=lookup)
        return get_object_or_404(self.get_queryset(), slug=lookup)
