import os

from rest_framework import serializers

from apps.core.upload_validation import validate_upload_content

from .models import MediaFile

_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}


class MediaFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = ('id', 'file', 'file_type', 'uploaded_by', 'uploaded_at')
        read_only_fields = ('id', 'uploaded_by', 'uploaded_at')

    def validate_file(self, value):
        # Verifie le contenu binaire reel (magic bytes), pas seulement
        # l'extension declaree — voir apps/core/upload_validation.py.
        validate_upload_content(value)
        return value

    def create(self, validated_data):
        uploaded = validated_data.get('file')
        if uploaded is not None:
            extension = os.path.splitext(uploaded.name)[1].lower()
            validated_data['file_type'] = (
                MediaFile.Type.IMAGE if extension in _IMAGE_EXTENSIONS else MediaFile.Type.DOCUMENT
            )
        return super().create(validated_data)