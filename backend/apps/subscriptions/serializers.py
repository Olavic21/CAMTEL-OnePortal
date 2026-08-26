from rest_framework import serializers

from .models import ClientProfile, SubscriptionRequest, SubscriptionStatusHistory


class SubscriptionStatusHistorySerializer(serializers.ModelSerializer):
    changed_by = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = SubscriptionStatusHistory
        fields = ('id', 'old_status', 'new_status', 'changed_by', 'reason', 'comment', 'created_at')
        read_only_fields = fields


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ('id', 'user', 'phone', 'company', 'address', 'created_at', 'updated_at')
        read_only_fields = ('user', 'created_at', 'updated_at')


class SubscriptionRequestSerializer(serializers.ModelSerializer):
    status_history = SubscriptionStatusHistorySerializer(many=True, read_only=True)
    product_name = serializers.CharField(source='product.name', read_only=True)

    class Meta:
        model = SubscriptionRequest
        fields = (
            'id',
            'request_number',
            'user',
            'product',
            'product_name',
            'full_name',
            'email',
            'phone',
            'address',
            'message',
            'status',
            'status_history',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('user', 'request_number', 'status', 'status_history', 'created_at', 'updated_at')
