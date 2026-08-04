from rest_framework import serializers

from .models import News


class NewsSerializer(serializers.ModelSerializer):
    class Meta:
        model = News
        fields = (
            'id',
            'title',
            'slug',
            'content',
            'image',
            'is_published',
            'published_at',
            'created_at',
            'updated_at',
        )
