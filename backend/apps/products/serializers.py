from rest_framework import serializers

from apps.categories.models import Category
from apps.categories.serializers import CategorySerializer
from apps.core.mixins import TranslatableModelSerializer

from .models import Product, ProductFAQ, ProductImage, Segment, Service, ProductSource


class ServiceSerializer(serializers.ModelSerializer):
    """Verticale commerciale (fixes/mobiles/transport/data-center)."""

    class Meta:
        model = Service
        fields = ('id', 'slug', 'code', 'name', 'name_en', 'description',
                  'description_en', 'status', 'display_order')


class SegmentSerializer(serializers.ModelSerializer):
    """Segment client (particulier/professionnel/entreprise/administration)."""

    class Meta:
        model = Segment
        fields = ('id', 'slug', 'code', 'name', 'name_en', 'display_order',
                  'is_active')


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ('id', 'product_id', 'image', 'alt_text', 'is_primary', 'order', 'original_source_url')


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
    # Taxonomie V4 : verticale + segments (lecture) exposes au frontend.
    service = ServiceSerializer(read_only=True)
    segments = SegmentSerializer(many=True, read_only=True)
    segments_codes = serializers.ListField(
        child=serializers.CharField(), write_only=True, required=False,
        help_text='Codes de segments (ex: ["PARTICULIER", "ENTREPRISE"]).',
    )
    # Source de verite structuree.
    sources = serializers.SerializerMethodField()
    # Champ optionnel pour uploader une image de couverture lors de la creation.
    image = serializers.ImageField(required=False, allow_null=True, write_only=True)
    slug = serializers.SlugField(required=False, allow_blank=True)
    price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    yearly_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, required=False, allow_null=True
    )
    # Champs de tracabilite / cycle de vie commercial (donnees reelles CAMTEL).
    price_on_request = serializers.BooleanField(read_only=True)
    is_stale = serializers.BooleanField(read_only=True)
    cta_type = serializers.CharField(read_only=True)
    translatable_fields = ('name', 'description', 'short_description')

    def get_sources(self, obj):
        return [
            {
                'source_name': s.source_name,
                'source_url': s.source_url,
                'source_type': s.source_type,
                'verification_status': s.verification_status,
                'last_verified_at': s.last_verified_at.isoformat() if s.last_verified_at else None,
                'is_primary': s.is_primary,
            }
            for s in obj.sources.all()
        ]

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
            'yearly_price',
            'price_on_request',
            'is_stale',
            'cta_type',
            'price_unit',
            'currency',
            'category',
            'category_id',
            'category_name',
            'product_type',
            'offer_type',
            'segment',
            'service',
            'segments',
            'segments_codes',
            'sources',
            'billing_period',
            'activation_fee',
            'installation_fee',
            'contract_duration',
            'technology',
            'availability',
            'eligibility',
            'features',
            'benefits',
            'terms',
            'brand',
            'subcategory',
            'service_type',
            'status',
            'pricing_type',
            'validity',
            'data_volume',
            'voice_volume',
            'sms_volume',
            'speed',
            'coverage',
            'subscription_method',
            'ussd_code',
            'specs',
            'source_url',
            'source_name',
            'source_checked_at',
            'last_verified_at',
            'source_version',
            'data_origin',
            'stock',
            'manage_stock',
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
        # Regle #29 : prix inconnu -> NULL (jamais 0).
        if value in (None, ''):
            return None
        return value


    def create(self, validated_data):
        image = validated_data.pop('image', None)
        segments_codes = validated_data.pop('segments_codes', None)
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
        if segments_codes:
            product.sync_segments(segments_codes)
        if image:
            ProductImage.objects.create(
                product=product,
                image=image,
                is_primary=True,
                order=1,
                alt_text=product.name,
            )
        return product

    def update(self, instance, validated_data):
        segments_codes = validated_data.pop('segments_codes', None)
        product = super().update(instance, validated_data)
        if segments_codes:
            product.sync_segments(segments_codes)
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
            'currency',
            'short_description',
            'description',
            'product_type',
            'offer_type',
            'segment',
            'billing_period',
            'activation_fee',
            'installation_fee',
            'contract_duration',
            'technology',
            'availability',
            'eligibility',
            'features',
            'benefits',
            'terms',
            'faqs',
        )

    def get_category(self, obj):
        from apps.categories.serializers import CategorySerializer
        return CategorySerializer(obj.category, context=self.context).data

    def get_features(self, obj):
        return {
            'technology': obj.technology,
            'billing_period': obj.billing_period,
            'contract_duration': obj.contract_duration,
            'availability': obj.availability,
            'offer_type': obj.offer_type,
            'segment': obj.segment,
            'stock': obj.stock if obj.manage_stock else None,
            'is_active': obj.is_active,
            'views_count': obj.views_count,
        }

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['faqs'] = ProductFAQSerializer(instance.faqs.all(), many=True).data
        return data
