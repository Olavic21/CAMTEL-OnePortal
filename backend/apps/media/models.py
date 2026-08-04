from django.db import models


class MediaFile(models.Model):
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to='media/')
    file_type = models.CharField(max_length=50, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title
