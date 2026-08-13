from rest_framework import permissions, viewsets

from apps.core.permissions import AdminOnly, ReadPublicWriteAdminOrEditor

from .models import SubscriptionRequest
from .serializers import SubscriptionRequestSerializer


class SubscriptionRequestViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionRequest.objects.select_related('product', 'user').all()
    serializer_class = SubscriptionRequestSerializer

    def get_permissions(self):
        if self.action == 'create':
            return [permissions.AllowAny()]
        if self.action in {'list', 'retrieve', 'update', 'partial_update', 'destroy'}:
            return [AdminOnly()]
        return super().get_permissions()

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        instance = serializer.save(user=user)
        from apps.core.models import Notification
        Notification.objects.create(
            message=f'Nouvelle demande de souscription: {instance.product.name}',
            type='info',
            link=f'/admin/subscriptions',
        )
