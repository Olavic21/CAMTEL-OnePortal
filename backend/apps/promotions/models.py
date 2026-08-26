from django.db import models


class Promotion(models.Model):
    class Status(models.TextChoices):
        VALID = 'VALID', 'Valid'
        EXPIRED = 'EXPIRED', 'Expired'
        UPCOMING = 'UPCOMING', 'Upcoming'
        REQUIRES_VERIFICATION = 'REQUIRES_VERIFICATION', 'Requires verification'

    title = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True, default='')
    discount_percent = models.PositiveIntegerField(default=0)
    # Offre concernee (optionnel : une promo peut porter sur le catalogue entier).
    offer = models.ForeignKey(
        'products.Product', related_name='promotions', on_delete=models.SET_NULL,
        null=True, blank=True,
    )
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.VALID)
    conditions = models.TextField(blank=True, default='')
    source_url = models.URLField(blank=True, default='')
    source_name = models.CharField(max_length=255, blank=True, default='')
    last_verified_at = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    starts_at = models.DateTimeField(null=True, blank=True)
    ends_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    @property
    def is_currently_active(self) -> bool:
        """Une promotion expiree ne doit jamais apparaitre comme active (#18)."""
        import datetime

        from django.utils import timezone

        if not self.is_active or self.status != self.Status.VALID:
            return False
        now = timezone.now()
        if self.starts_at and now < self.starts_at:
            return False
        if self.ends_at and now > self.ends_at:
            return False
        return True

