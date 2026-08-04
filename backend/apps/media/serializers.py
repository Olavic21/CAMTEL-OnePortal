from rest_framework import serializers

from .models import MediaFile


class MediaFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = ('id', 'title', 'file', 'file_type', 'created_at')
