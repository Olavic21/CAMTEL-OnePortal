from django.contrib import admin

from .models import PartnerAPIKey


@admin.register(PartnerAPIKey)
class PartnerAPIKeyAdmin(admin.ModelAdmin):
    list_display = ('name', 'key_prefix', 'is_active', 'expires_at', 'last_used_at', 'created_at')
    readonly_fields = ('key_prefix', 'key_hash', 'created_at', 'last_used_at')
