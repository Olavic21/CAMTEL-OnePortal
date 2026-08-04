from rest_framework import viewsets

from .models import ActivityLog
from .serializers import ActivityLogSerializer


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        target_model = self.request.query_params.get('target_model')
        if target_model:
            queryset = queryset.filter(target_model=target_model)
        return queryset
