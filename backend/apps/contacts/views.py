from rest_framework import permissions, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.core.throttling import ContactRateThrottle

from .models import ContactMessage
from .serializers import ContactMessageSerializer


class ContactMessageViewSet(viewsets.ModelViewSet):
    queryset = ContactMessage.objects.all()
    serializer_class = ContactMessageSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        from apps.core.permissions import IsAdminOrEditor
        return [IsAdminOrEditor()]

    def get_throttles(self):
        if self.action == 'create':
            return [ContactRateThrottle()]
        return super().get_throttles()

    @action(detail=True, methods=['post'], url_path='markread')
    def markread(self, request, pk=None):
        message = self.get_object()
        message.is_read = True
        message.save(update_fields=['is_read'])
        return Response(ContactMessageSerializer(message).data)
