from rest_framework import serializers

from .models import ActivityLog, Notification


class ActivityLogSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

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


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = (
            'id',
            'message',
            'type',
            'is_read',
            'link',
            'created_at',
        )
