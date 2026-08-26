from django.contrib import admin

from .models import Product, ProductFAQ, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductFAQInline(admin.TabularInline):
    model = ProductFAQ
    extra = 0


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Back-office catalogue avec tracabilite des sources (#33)."""

    list_display = (
        'name', 'brand', 'category', 'service_type',
        'price_display', 'pricing_type', 'status', 'data_origin',
        'source_name', 'last_verified_at', 'verification_flag',
        'is_published', 'is_active',
    )
    list_filter = (
        'brand', 'category', 'service_type', 'offer_type', 'segment',
        'pricing_type', 'status', 'data_origin', 'is_published', 'is_active',
        'subscription_method',
    )
    search_fields = ('name', 'name_en', 'slug', 'description', 'source_name')
    readonly_fields = ('views_count', 'created_at', 'updated_at')
    inlines = [ProductImageInline, ProductFAQInline]
    fieldsets = (
        ('Identification', {
            'fields': ('name', 'name_en', 'slug', 'brand', 'subcategory', 'category',
                       'service_type', 'product_type', 'offer_type', 'segment'),
        }),
        ('Description', {
            'fields': ('short_description', 'short_description_en',
                       'description', 'description_en'),
        }),
        ('Tarification', {
            'fields': ('price', 'yearly_price', 'price_unit', 'currency',
                       'pricing_type', 'billing_period', 'activation_fee',
                       'installation_fee', 'contract_duration'),
        }),
        ('Caracteristiques commerciales', {
            'fields': ('validity', 'data_volume', 'voice_volume', 'sms_volume',
                       'speed', 'coverage', 'technology', 'availability',
                       'eligibility', 'subscription_method', 'ussd_code',
                       'features', 'benefits', 'terms', 'specs'),
        }),
        ('Source officielle (tracabilite)', {
            'fields': ('data_origin', 'source_name', 'source_url',
                       'source_checked_at', 'last_verified_at', 'source_version'),
        }),
        ('Cycle de vie', {
            'fields': ('status', 'stock', 'is_active', 'is_published',
                       'views_count', 'created_at', 'updated_at'),
        }),
    )
    actions = ['mark_verified', 'archive_offers']

    @admin.display(description='Prix')
    def price_display(self, obj):
        if obj.price_on_request:
            return 'Prix sur demande'
        return f'{obj.price} {obj.currency or "XAF"}'

    @admin.display(description='Verification')
    def verification_flag(self, obj):
        if obj.data_origin != Product.DataOrigin.OFFICIAL:
            return '-'
        if not obj.last_verified_at:
            return 'NON VERIFIE'
        return 'STALE' if obj.is_stale else 'OK'

    @admin.action(description='Marquer comme verifie aujourd\'hui')
    def mark_verified(self, request, queryset):
        import datetime

        updated = queryset.update(
            last_verified_at=datetime.date.today(),
            source_checked_at=datetime.date.today(),
            status=Product.Status.VALID,
        )
        self.message_user(request, f'{updated} offre(s) marquee(s) comme verifiee(s).')

    @admin.action(description='Archiver (depublier + statut EXPIRED)')
    def archive_offers(self, request, queryset):
        updated = queryset.update(is_published=False, status=Product.Status.EXPIRED)
        self.message_user(request, f'{updated} offre(s) archivee(s).')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'alt_text', 'is_primary', 'order')
    list_filter = ('is_primary',)
    search_fields = ('product__name', 'alt_text')


@admin.register(ProductFAQ)
class ProductFAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'product')
    search_fields = ('question', 'answer', 'product__name')

