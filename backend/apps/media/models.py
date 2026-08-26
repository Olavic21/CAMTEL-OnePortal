from django.db import models


class MediaFile(models.Model):
    """Fichier uploade (image ou document) pour la bibliotheque media."""

    class Type(models.TextChoices):
        IMAGE = 'image', 'Image'
        DOCUMENT = 'document', 'Document'

    file = models.FileField(upload_to='media/')
    file_type = models.CharField(
        max_length=20,
        choices=Type.choices,
        default=Type.IMAGE,
    )
    uploaded_by = models.ForeignKey(
        'users.User',
        related_name='media_files',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return self.file.name