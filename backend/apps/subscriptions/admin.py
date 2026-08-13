from django.contrib import admin

from .models import ClientProfile, SubscriptionRequest

admin.site.register(ClientProfile)
admin.site.register(SubscriptionRequest)
