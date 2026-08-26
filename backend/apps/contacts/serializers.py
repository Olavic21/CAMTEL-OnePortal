from rest_framework import serializers

from .models import ContactMessage


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = (
            'id',
            'full_name',
            'email',
            'subject',
            'message',
            'is_read',
            'created_at',
        )
