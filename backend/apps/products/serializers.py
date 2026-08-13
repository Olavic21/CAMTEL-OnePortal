from decimal import Decimal

from rest_framework import serializers

from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.core.mixins import TranslatableModelSerializer

from .models import Product, ProductFAQ, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'product_id', 'image', 'alt_text', 'is_primary', 'order')


class ProductFAQSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductFAQ
        fields = ('id', 'product', 'question', 'answer', 'created_at', 'updated_at')


class ProductSerializer(TranslatableModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    faqs = ProductFAQSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    # Sortie : objet imbrique "category" (nom, slug...) pour l'affichage public.
    category = CategorySerializer(read_only=True)
    # Ecriture : le frontend envoie `category_id` (carte d'identite de la categorie).
    category_id = serializers.PrimaryKeyRelatedField(
        source='category', queryset=Category.objects.all(), write_only=True
    )
    # Champ optionnel pour uploader une image de couverture lors de la creation.
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True)
    price = serializers.DecimalField(
        max_digits=10, decimal_places=2, required=False, allow_null=True, default=Decimal('0')
    )
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
            'category_id',
            'category_name',
            'stock',
            'is_active',
            'is_published',
            'views_count',
            'image',
            'images',
            'faqs',
            'created_at',
            'updated_at',
        )

    def validate_price(self, value):
        if value in (None, ''):
            return Decimal('0')
        return value

    def create(self, validated_data):
        image = validated_data.pop('image', None)
        if not validated_data.get('slug'):
            from django.utils.text import slugify

            base = slugify(validated_data['name']) or 'produit'
            slug = base
            counter = 1
            while Product.objects.filter(slug=slug).exists():
                slug = f'{base}-{counter}'
                counter += 1
            validated_data['slug'] = slug
        product = super().create(validated_data)
        if image:
            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=True,
                order=1,
                alt_text=product.name,
            )
        return product


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
