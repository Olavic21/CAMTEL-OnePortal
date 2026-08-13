from rest_framework import serializers

from apps.core.mixins import TranslatableModelSerializer

from .models import Category


class RecursiveCategorySerializer(serializers.Serializer):
    def to_representation(self, value):
        serializer = self.parent.parent.__class__(value, context=self.context)
        return serializer.data


class CategorySerializer(TranslatableModelSerializer):
    children = RecursiveCategorySerializer(many=True, read_only=True)
    translatable_fields = ('name', 'description')

    class Meta:
        model = Category
        fields = (
            'id',
            'name',
            'name_en',
            'slug',
            'parent',
            'description',
            'description_en',
            'children',
            'is_active',
            'created_at',
            'updated_at',
        )
