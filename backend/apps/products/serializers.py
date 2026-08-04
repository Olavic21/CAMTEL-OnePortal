from rest_framework import serializers

from .models import Product, ProductFAQ, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'image', 'alt_text')


class ProductFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFAQ
        fields = ('id', 'product', 'question', 'answer', 'created_at', 'updated_at')


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    faqs = ProductFAQSerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = (
            'id',
            'name',
            'slug',
            'description',
            'price',
            'category',
            'stock',
            'is_active',
            'is_published',
            'views_count',
            'images',
            'faqs',
            'created_at',
            'updated_at',
        )
