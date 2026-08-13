from rest_framework import serializers

from apps.core.mixins import TranslatableModelSerializer

from .models import Product, ProductFAQ, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text')


class ProductFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFAQ
        fields = ('id', 'product', 'question', 'answer', 'created_at', 'updated_at')


class ProductSerializer(TranslatableModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    faqs = ProductFAQSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    translatable_fields = ('name', 'description', 'short_description')

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'name_en',
            'slug',
            'description',
            'description_en',
            'short_description',
            'short_description_en',
            'price',
            'price_unit',
            'category',
            'category_name',
            'stock',
            'is_active',
            'is_published',
            'views_count',
            'images',
            'faqs',
            'created_at',
            'updated_at',
        )


class ProductCompareSerializer(TranslatableModelSerializer):
    category = serializers.SerializerMethodField()
    features = serializers.SerializerMethodField()
    translatable_fields = ('name', 'description', 'short_description')

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'category',
            'price',
            'price_unit',
            'short_description',
            'description',
            'features',
            'faqs',
        )

    def get_category(self, obj):
        from apps.categories.serializers import CategorySerializer
        return CategorySerializer(obj.category, context=self.context).data

    def get_features(self, obj):
        return {
            'stock': obj.stock,
            'is_active': obj.is_active,
            'views_count': obj.views_count,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['faqs'] = ProductFAQSerializer(instance.faqs.all(), many=True).data
        return data
