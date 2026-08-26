from django.contrib import admin

from .models import Promotion


@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    """Promotions separees des offres permanentes (#18)."""

    list_display = (
        'title', 'offer', 'status', 'discount_percent',
        'starts_at', 'ends_at', 'is_active', 'source_name', 'last_verified_at',
    )
    list_filter = ('status', 'is_active')
    search_fields = ('title', 'description', 'conditions', 'source_name')
    actions = ['mark_expired']

    @admin.action(description='Marquer comme expiree (depublier)')
    def mark_expired(self, request, queryset):
        updated = queryset.update(status=Promotion.Status.EXPIRED, is_active=False)
        self.message_user(request, f'{updated} promotion(s) marquee(s) expiree(s).')

