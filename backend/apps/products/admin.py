from django.contrib import admin

from .models import (
    Product,
    ProductFAQ,
    ProductImage,
    ProductSource,
    Segment,
    Service,
    SourceVerificationLog,
)


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 0


class ProductFAQInline(admin.TabularInline):
    model = ProductFAQ
    extra = 0


class ProductSourceInline(admin.TabularInline):
    model = ProductSource
    extra = 0
    fields = (
        'source_name', 'source_url', 'source_type', 'verification_status',
        'last_verified_at', 'is_primary', 'notes',
    )
    readonly_fields = ('last_verified_at',)
    show_change_link = True


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    """Back-office catalogue avec tracabilite des sources (#33)."""

    list_display = (
        'name', 'brand', 'category', 'service', 'service_type',
        'price_display', 'pricing_type', 'status', 'data_origin',
        'source_name', 'last_verified_at', 'verification_flag',
        'is_published', 'is_active',
    )
    list_filter = (
        'brand', 'category', 'service', 'service_type', 'offer_type', 'segment',
        'segments', 'pricing_type', 'status', 'data_origin', 'is_published',
        'is_active', 'subscription_method',
    )
    search_fields = ('name', 'name_en', 'slug', 'description', 'source_name')
    readonly_fields = ('views_count', 'created_at', 'updated_at')
    inlines = [ProductImageInline, ProductFAQInline, ProductSourceInline]
    fieldsets = (
        ('Identification', {
            'fields': ('name', 'name_en', 'slug', 'brand', 'subcategory', 'category',
                       'service', 'service_type', 'product_type', 'offer_type',
                       'segment', 'segments'),
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
            'fields': ('data_origin', 'historical_since', 'source_name', 'source_url',
                       'source_checked_at', 'last_verified_at', 'source_version'),
        }),
        ('Cycle de vie', {
            'fields': ('status', 'stock', 'is_active', 'is_published',
                       'views_count', 'created_at', 'updated_at'),
        }),
    )
    actions = ['mark_verified', 'archive_offers', 'publish_offers']

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

    @admin.action(description='Publier (activer + statut VALID)')
    def publish_offers(self, request, queryset):
        updated = queryset.update(is_published=True, is_active=True, status=Product.Status.VALID)
        self.message_user(request, f'{updated} offre(s) publiee(s).')


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'code', 'status', 'display_order')
    list_filter = ('status',)
    search_fields = ('name', 'slug', 'code')
    ordering = ('display_order', 'name')


@admin.register(Segment)
class SegmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'code', 'display_order', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'slug', 'code')
    ordering = ('display_order', 'name')


@admin.register(ProductSource)
class ProductSourceAdmin(admin.ModelAdmin):
    list_display = (
        'source_name', 'product', 'source_type', 'verification_status',
        'last_verified_at', 'is_primary',
    )
    list_filter = ('verification_status', 'source_type', 'is_primary')
    search_fields = ('source_name', 'source_url', 'product__name', 'product__slug')
    readonly_fields = ('created_at', 'updated_at')
    actions = ['verify_sources']

    @admin.action(description='Marquer comme verifie aujourd\'hui')
    def verify_sources(self, request, queryset):
        import datetime

        updated = 0
        for source in queryset:
            source.last_verified_at = datetime.date.today()
            source.verification_status = ProductSource.VerificationStatus.OFFICIAL
            source.save()
            source.log_verification(
                verified_by=request.user,
                result=SourceVerificationLog.Result.VERIFIED,
                notes='Verification manuelle via admin.',
            )
            updated += 1
        self.message_user(request, f'{updated} source(s) verifiee(s) et historisee(s).')


@admin.register(SourceVerificationLog)
class SourceVerificationLogAdmin(admin.ModelAdmin):
    list_display = ('source', 'result', 'verified_at', 'verified_by')
    list_filter = ('result',)
    search_fields = ('source__source_name', 'notes')
    readonly_fields = ('source', 'verified_at', 'verified_by', 'result', 'notes')


@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):
    list_display = ('product', 'alt_text', 'is_primary', 'order')
    list_filter = ('is_primary',)
    search_fields = ('product__name', 'alt_text')


@admin.register(ProductFAQ)
class ProductFAQAdmin(admin.ModelAdmin):
    list_display = ('question', 'product')
    search_fields = ('question', 'answer', 'product__name')

