from django.core.exceptions import ValidationError
from rest_framework import serializers

from .models import MediaFile

# Formats autorises et taille maximale (mission : gestion des images).
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf', '.doc', '.docx', '.xls', '.xlsx'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 Mo


class MediaFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaFile
        fields = ('id', 'title', 'file', 'file_type', 'created_at')

    def validate_file(self, value):
        import os

        if value is None:
            return value
        # Taille maximale
        if value.size > MAX_FILE_SIZE:
            raise ValidationError(f"Le fichier dépasse la taille maximale autorisée de {MAX_FILE_SIZE // (1024 * 1024)} Mo.")
        # Extension autorisée
        extension = os.path.splitext(value.name)[1].lower()
        if extension not in ALLOWED_EXTENSIONS:
            raise ValidationError(f"Format de fichier non autorisé : '{extension}'.")
        return value
