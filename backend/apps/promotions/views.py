from django.db.models import Q
from django.utils import timezone
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import ReadPublicWriteAdminOrEditor

from .models import Promotion
from .serializers import PromotionSerializer


class PromotionViewSet(viewsets.ModelViewSet):
    queryset = Promotion.objects.all()
    serializer_class = PromotionSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]

    @action(detail=False, methods=['get'])
    def active(self, request):
        now = timezone.now()
        queryset = self.get_queryset().filter(is_active=True)
        queryset = queryset.filter(
            Q(starts_at__isnull=True) | Q(starts_at__lte=now),
            Q(ends_at__isnull=True) | Q(ends_at__gte=now),
        )
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
