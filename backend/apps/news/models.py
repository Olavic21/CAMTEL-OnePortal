from django.db import models


class News(models.Model):
    title = models.CharField(max_length=255)
    title_en = models.CharField(max_length=255, blank=True, default='')
    slug = models.SlugField(max_length=255, unique=True)
    content = models.TextField()
    content_en = models.TextField(blank=True, default='')
    image = models.ImageField(upload_to='news/', blank=True, null=True)
    is_published = models.BooleanField(default=True)
    published_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-published_at']

    def __str__(self):
        return self.title
