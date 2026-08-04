from rest_framework import serializers

from .models import ActivityLog


class ActivityLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActivityLog
        fields = (
            'id',
            'user',
            'action',
            'target_model',
            'target_id',
            'details',
            'created_at',
        )
