from django.conf import settings
from django.db import models
from django.utils import timezone


class ClientProfile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='client_profile')
    phone = models.CharField(max_length=50, blank=True, default='')
    company = models.CharField(max_length=255, blank=True, default='')
    address = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f'Profile: {self.user.username}'


class SubscriptionRequest(models.Model):
    """Workflow de souscription metier (PHASE 3).

    Statuts definis dans la section 14 du cahier des charges :
    PENDING -> UNDER_REVIEW -> ADDITIONAL_INFO_REQUIRED | APPROVED -> SCHEDULED -> ACTIVATED
    et etats terminaux REJECTED / CANCELLED.
    Chaque transition est tracee dans SubscriptionStatusHistory.
    """

    class Status(models.TextChoices):
        # Statuts legacy (conserves — consommes par le frontend TypeScript).
        PENDING = 'PENDING', 'En attente'
        UNDER_REVIEW = 'UNDER_REVIEW', 'En cours de traitement'
        ADDITIONAL_INFO_REQUIRED = 'ADDITIONAL_INFO_REQUIRED', 'Informations complementaires requises'
        APPROVED = 'APPROVED', 'Approuve'
        SCHEDULED = 'SCHEDULED', 'Planifie'
        ACTIVATED = 'ACTIVATED', 'Active'
        REJECTED = 'REJECTED', 'Rejete'
        CANCELLED = 'CANCELLED', 'Annule'
        # Statuts alignes cahier des charges #24 (ajout, sans retrait).
        DRAFT = 'DRAFT', 'Brouillon'
        ACTIVATING = 'ACTIVATING', 'En cours d activation'
        # ACTIVE est l'etat courant d'un service actif (ACTIVATED en est la
        # version legacy "one-shot"). Map : ACTIVATED == ACTIVE.
        ACTIVE = 'ACTIVE', 'Actif'
        SUSPENDED = 'SUSPENDED', 'Suspendu'
        # COMPLETED (service resilie / termine, fin de vie de la souscription).
        COMPLETED = 'COMPLETED', 'Termine'

# Matrice des transitions autorisees (#24) — chaque valeur liste les
    # nouveaux statuts valides depuis le statut courant. Les transitions
    # "retour arriere" restent autorisees par un admin pour corriger une
    # erreur : la matrice couvre le flux nominal.
    ALLOWED_TRANSITIONS = {
        'PENDING': {'UNDER_REVIEW', 'REJECTED', 'CANCELLED', 'APPROVED', 'ADDITIONAL_INFO_REQUIRED'},
        'UNDER_REVIEW': {'APPROVED', 'REJECTED', 'ADDITIONAL_INFO_REQUIRED', 'PENDING', 'CANCELLED'},
        'ADDITIONAL_INFO_REQUIRED': {'UNDER_REVIEW', 'PENDING', 'CANCELLED'},
        'APPROVED': {'ACTIVATING', 'SCHEDULED', 'ACTIVE', 'ACTIVATED', 'REJECTED', 'CANCELLED'},
        'SCHEDULED': {'ACTIVATING', 'ACTIVE', 'ACTIVATED', 'CANCELLED'},
        'ACTIVATING': {'ACTIVE', 'ACTIVATED', 'SUSPENDED', 'REJECTED', 'CANCELLED'},
        'ACTIVE': {'SUSPENDED', 'COMPLETED', 'CANCELLED'},
        'ACTIVATED': {'SUSPENDED', 'COMPLETED', 'CANCELLED'},
        'SUSPENDED': {'ACTIVE', 'ACTIVATED', 'COMPLETED', 'CANCELLED'},
        'REJECTED': {'PENDING', 'UNDER_REVIEW'},
        'CANCELLED': set(),
        'COMPLETED': set(),
        'DRAFT': {'PENDING', 'CANCELLED'},
    }
    TERMINAL_STATUSES = {'REJECTED', 'CANCELLED', 'COMPLETED'}
    LEGACY_ALIASES = {
        'SUBMITTED': 'PENDING',
    }

    @classmethod
    def normalize(cls, value):
        """Normalise un code de statut (gestion des aliases cahier des charges)."""
        value = (value or '').strip().upper()
        if value in cls.LEGACY_ALIASES:
            return cls.LEGACY_ALIASES[value]
        return value

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='subscription_requests',
    )
    product = models.ForeignKey('products.Product', on_delete=models.CASCADE, related_name='subscription_requests')
    request_number = models.CharField(max_length=32, unique=True, editable=False)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    phone = models.CharField(max_length=50, blank=True, default='')
    address = models.TextField(blank=True, default='')
    message = models.TextField(blank=True, default='')
    status = models.CharField(max_length=40, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['user']),
            models.Index(fields=['request_number']),
        ]

    def __str__(self):
        return f'{self.request_number} - {self.full_name} - {self.product.name}'

    @classmethod
    def generate_request_number(cls) -> str:
        """Genere un numero de demande unique humain, ex: SUB-2026-000001."""
        year = timezone.now().year
        prefix = f'SUB-{year}-'
        last = (
            cls.objects.filter(request_number__startswith=prefix)
            .order_by('-request_number')
            .values_list('request_number', flat=True)
            .first()
        )
        if last:
            try:
                seq = int(last.split('-')[-1]) + 1
            except ValueError:
                seq = 1
        else:
            seq = 1
        return f'{prefix}{seq:06d}'

    def save(self, *args, **kwargs):
        if not self.request_number:
            self.request_number = self.generate_request_number()
        super().save(*args, **kwargs)


class SubscriptionStatusHistory(models.Model):
    """Trace chaque changement de statut d'une demande (audit)."""

    subscription = models.ForeignKey(
        SubscriptionRequest, on_delete=models.CASCADE, related_name='status_history'
    )
    old_status = models.CharField(max_length=40, blank=True, default='')
    new_status = models.CharField(max_length=40)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    reason = models.CharField(max_length=255, blank=True, default='')
    comment = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.subscription.request_number}: {self.old_status or "-"} -> {self.new_status}'
