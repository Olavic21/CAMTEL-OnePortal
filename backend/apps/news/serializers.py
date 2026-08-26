from rest_framework import serializers

from apps.core.mixins import TranslatableModelSerializer

from .models import News


class NewsSerializer(TranslatableModelSerializer):
    translatable_fields = ('title', 'content')

    class Meta:
        model = News
        fields = (
            'id',
            'title',
            'title_en',
            'slug',
            'content',
            'content_en',
            'image',
            'is_published',
            'published_at',
            'created_at',
            'updated_at',
        )
