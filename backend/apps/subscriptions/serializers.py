from rest_framework import serializers

from .models import ClientProfile, SubscriptionRequest


class ClientProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClientProfile
        fields = ('id', 'user', 'phone', 'company', 'address', 'created_at', 'updated_at')
        read_only_fields = ('user', 'created_at', 'updated_at')


class SubscriptionRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SubscriptionRequest
        fields = (
            'id',
            'user',
            'product',
            'full_name',
            'email',
            'phone',
            'message',
            'status',
            'created_at',
            'updated_at',
        )
        read_only_fields = ('user', 'status', 'created_at', 'updated_at')
