from django.conf import settings
from django.db import models


class ActivityLog(models.Model):
    ACTION_CHOICES = (
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('view', 'View'),
        ('login', 'Login'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    target_model = models.CharField(max_length=100)
    target_id = models.PositiveIntegerField(null=True, blank=True)
    details = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['target_model']),
            models.Index(fields=['created_at']),
        ]

    def __str__(self):
        return f'{self.user or "System"} - {self.action} - {self.target_model}'


class Notification(models.Model):
    TYPE_CHOICES = (
        ('info', 'Info'),
        ('success', 'Success'),
        ('warning', 'Warning'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='notifications',
        null=True,
        blank=True,
    )
    message = models.CharField(max_length=500)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='info')
    is_read = models.BooleanField(default=False)
    link = models.CharField(max_length=500, blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return self.message[:50]
class AnalyticsEvent(models.Model):
    """Evenement analytique structure (V2) : offer_view, search, faq_view...

    Respecte la confidentialite : aucun PII n'est stocke dans payload.
    """

    EVENT_TYPE_CHOICES = (
        ('offer_view', 'offer_view'),
        ('offer_compare', 'offer_compare'),
        ('subscription_started', 'subscription_started'),
        ('subscription_submitted', 'subscription_submitted'),
        ('subscription_completed', 'subscription_completed'),
        ('search', 'search'),
        ('faq_view', 'faq_view'),
        ('chatbot_question', 'chatbot_question'),
    )

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    event_type = models.CharField(max_length=64, choices=EVENT_TYPE_CHOICES)
    product = models.ForeignKey(
        'products.Product', on_delete=models.SET_NULL, null=True, blank=True
    )
    payload = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['event_type', 'created_at']),
        ]

    def __str__(self):
        return f'{self.event_type} @ {self.created_at:%Y-%m-%d %H:%M}'


class SupportTicket(models.Model):
    """Ticket support client (V2) : OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED."""

    class Status(models.TextChoices):
        OPEN = 'OPEN', 'Ouvert'
        IN_PROGRESS = 'IN_PROGRESS', 'En cours'
        WAITING_CUSTOMER = 'WAITING_CUSTOMER', 'Attente client'
        RESOLVED = 'RESOLVED', 'Resolu'
        CLOSED = 'CLOSED', 'Ferme'

    class Priority(models.TextChoices):
        LOW = 'LOW', 'Faible'
        MEDIUM = 'MEDIUM', 'Moyenne'
        HIGH = 'HIGH', 'Haute'
        URGENT = 'URGENT', 'Urgente'

    client = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_tickets'
    )
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=64, blank=True, default='')
    priority = models.CharField(max_length=32, choices=Priority.choices, default=Priority.MEDIUM)
    status = models.CharField(max_length=40, choices=Status.choices, default=Status.OPEN)
    assigned_agent = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['client']),
        ]

    def __str__(self):
        return f'Ticket #{self.pk} - {self.subject}'


class TicketMessage(models.Model):
    """Message au sein d'un ticket (echange client / agent)."""

    ticket = models.ForeignKey(SupportTicket, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f'Message #{self.pk} sur ticket #{self.ticket_id}'
