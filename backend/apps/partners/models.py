import hashlib
import secrets

from django.db import models
from django.utils import timezone


class PartnerAPIKey(models.Model):
    SCOPE_PRODUCTS_READ = 'products:read'
    SCOPE_CATEGORIES_READ = 'categories:read'
    SCOPE_NEWS_READ = 'news:read'

    SCOPE_CHOICES = [
        (SCOPE_PRODUCTS_READ, 'Lecture produits'),
        (SCOPE_CATEGORIES_READ, 'Lecture catégories'),
        (SCOPE_NEWS_READ, 'Lecture actualités'),
    ]

    name = models.CharField(max_length=128)
    key_prefix = models.CharField(max_length=8, editable=False)
    key_hash = models.CharField(max_length=64, unique=True, editable=False)
    scopes = models.JSONField(default=list)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} ({self.key_prefix}***)'

    @classmethod
    def generate(cls, name: str, scopes: list[str], expires_at=None):
        raw_key = f'camtel_{secrets.token_urlsafe(32)}'
        prefix = raw_key[:8]
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        obj = cls.objects.create(
            name=name,
            key_prefix=prefix,
            key_hash=key_hash,
            scopes=scopes,
            expires_at=expires_at,
        )
        return obj, raw_key

    @classmethod
    def hash_key(cls, raw_key: str) -> str:
        return hashlib.sha256(raw_key.encode()).hexdigest()

    def is_valid(self) -> bool:
        if not self.is_active:
            return False
        if self.expires_at and self.expires_at < timezone.now():
            return False
        return True

    def has_scope(self, scope: str) -> bool:
        return scope in (self.scopes or [])

    def touch(self):
        self.last_used_at = timezone.now()
        self.save(update_fields=['last_used_at'])
