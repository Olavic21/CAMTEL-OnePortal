from rest_framework import serializers

from .models import Promotion


class PromotionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Promotion
        fields = (
            'id',
            'title',
            'slug',
            'description',
            'discount_percent',
            'is_active',
            'starts_at',
            'ends_at',
            'created_at',
            'updated_at',
        )
