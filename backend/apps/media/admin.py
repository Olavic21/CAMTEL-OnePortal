from django.contrib import admin

from .models import MediaFile


@admin.register(MediaFile)
class MediaFileAdmin(admin.ModelAdmin):
    list_display = ('id', 'file', 'file_type', 'uploaded_by', 'uploaded_at')
    list_filter = ('file_type',)