from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.db.models.signals import post_save

from apps.categories.models import Category


class Product(models.Model):
    class ProductType(models.TextChoices):
        SERVICE_OFFER = 'SERVICE_OFFER', 'Service offer'
        PHYSICAL_PRODUCT = 'PHYSICAL_PRODUCT', 'Physical product'

    class OfferType(models.TextChoices):
        INTERNET = 'INTERNET', 'Internet'
        FIBER = 'FIBER', 'Fiber'
        MOBILE = 'MOBILE', 'Mobile'
        VOICE = 'VOICE', 'Voice'
        DATA = 'DATA', 'Data'
        CLOUD = 'CLOUD', 'Cloud'
        HOSTING = 'HOSTING', 'Hosting'
        VPN = 'VPN', 'VPN'
        EQUIPMENT = 'EQUIPMENT', 'Equipment'
        BUSINESS_SOLUTION = 'BUSINESS_SOLUTION', 'Business solution'
        OTHER = 'OTHER', 'Other'

    class Segment(models.TextChoices):
        PARTICULIER = 'PARTICULIER', 'Particulier'
        PROFESSIONNEL = 'PROFESSIONNEL', 'Professionnel'
        ENTREPRISE = 'ENTREPRISE', 'Entreprise'
        ADMINISTRATION = 'ADMINISTRATION', 'Administration'

    class BillingPeriod(models.TextChoices):
        ONE_TIME = 'ONE_TIME', 'One time'
        MONTHLY = 'MONTHLY', 'Monthly'
        QUARTERLY = 'QUARTERLY', 'Quarterly'
        YEARLY = 'YEARLY', 'Yearly'

    class Brand(models.TextChoices):
        CAMTEL = 'CAMTEL', 'CAMTEL'
        BLUE = 'BLUE', 'Blue'
        FIBER_CONNECT = 'FIBER_CONNECT', 'Fiber Connect'
        HOSTING = 'HOSTING', 'CAMTEL Hosting'
        CARRIER = 'CARRIER', 'CAMTEL Carrier'

    class ServiceType(models.TextChoices):
        """Distingue une offre tarifaire d'un service ou d'un produit materiel."""

        OFFER = 'OFFER', 'Offer'
        SERVICE = 'SERVICE', 'Service'
        PRODUCT = 'PRODUCT', 'Product'

    class Status(models.TextChoices):
        """Cycle de vie commercial (mission OnePortal #19)."""

        VALID = 'VALID', 'Valid'
        EXPIRED = 'EXPIRED', 'Expired'
        UPCOMING = 'UPCOMING', 'Upcoming'
        REQUIRES_VERIFICATION = 'REQUIRES_VERIFICATION', 'Requires verification'

    class PricingType(models.TextChoices):
        FIXED = 'FIXED', 'Fixed price'
        QUOTE = 'QUOTE', 'Price on request (quote)'
        FREE = 'FREE', 'Free'

    class SubscriptionMethod(models.TextChoices):
        ONLINE = 'ONLINE', 'Online'
        AGENCY = 'AGENCY', 'Agency / sales point'
        USSD = 'USSD', 'USSD'
        MOBILE_APP = 'MOBILE_APP', 'Mobile app'
        CONTACT = 'CONTACT', 'Contact / quote'

    class DataOrigin(models.TextChoices):
        """Provenance de la donnee commerciale (#37 : isoler les donnees demo)."""

        OFFICIAL = 'OFFICIAL', 'Official CAMTEL source'
        DEMO = 'DEMO', 'Demo data'
        MANUAL = 'MANUAL', 'Manual entry'


    class Technology(models.TextChoices):
        FTTH = 'FTTH', 'Fiber to the Home'
        FTTB = 'FTTB', 'Fiber to the Building'
        ADSL = 'ADSL', 'ADSL'
        LTE = 'LTE', 'LTE/4G'
        WIRELESS_5G = '5G', '5G'
        DEDICATED = 'DEDICATED', 'Dedicated link'
        OTHER = 'OTHER', 'Other'

    class Availability(models.TextChoices):
        ALL = 'ALL', 'All regions'
        REGION = 'REGION', 'Region specific'
        ADDRESS_CHECK = 'ADDRESS_CHECK', 'Address check required'

    name = models.CharField(max_length=255)
    name_en = models.CharField(max_length=255, blank=True, default='')
    slug = models.SlugField(max_length=255, unique=True)
    description = models.TextField(blank=True)
    description_en = models.TextField(blank=True, default='')
    short_description = models.CharField(max_length=500, blank=True, default='')
    short_description_en = models.CharField(max_length=500, blank=True, default='')
    # Regle OnePortal #29 : un prix inconnu doit rester NULL (jamais 0).
    # pricing_type=QUOTE signifie "Prix sur demande" (offres professionnelles).
    price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, default=None,
    )
    yearly_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, default=None,
        help_text='Prix annuel lorsque la source officielle le publie.',
    )
    price_unit = models.CharField(max_length=32, blank=True, default='FCFA')
    currency = models.CharField(max_length=8, default='XAF')
    category = models.ForeignKey(Category, related_name='products', on_delete=models.CASCADE)
    # Dimensionnement offre (service vs produit materiel). Le stock n'a de sens
    # que pour PRODUCTS_PHYSIQUE : pour les services il est desactive.
    product_type = models.CharField(max_length=32, choices=ProductType.choices, default=ProductType.SERVICE_OFFER)
    offer_type = models.CharField(max_length=32, choices=OfferType.choices, default=OfferType.OTHER)
    segment = models.CharField(max_length=32, choices=Segment.choices, default=Segment.PARTICULIER)
    billing_period = models.CharField(max_length=16, choices=BillingPeriod.choices, default=BillingPeriod.MONTHLY)
    activation_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=None)
    installation_fee = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, default=None)
    contract_duration = models.PositiveIntegerField(null=True, blank=True, help_text='Engagement en mois (null = sans engagement)')
    technology = models.CharField(max_length=32, choices=Technology.choices, default=Technology.OTHER)
    availability = models.CharField(max_length=32, choices=Availability.choices, default=Availability.ALL)
    eligibility = models.TextField(blank=True, default='')
    features = models.JSONField(default=list, blank=True)
    benefits = models.JSONField(default=list, blank=True)
    terms = models.TextField(blank=True, default='')
    stock = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    is_published = models.BooleanField(default=True)
    views_count = models.PositiveIntegerField(default=0)

    # --- Catalogue commercial verifiable et trace (mission donnees reelles) ---
    brand = models.CharField(max_length=16, choices=Brand.choices, default=Brand.CAMTEL)
    subcategory = models.CharField(max_length=120, blank=True, default='', help_text="Sous-famille officielle (ex: CB VPS, CB Rack Housing)")
    service_type = models.CharField(max_length=16, choices=ServiceType.choices, default=ServiceType.OFFER)
    status = models.CharField(max_length=24, choices=Status.choices, default=Status.VALID)
    pricing_type = models.CharField(max_length=16, choices=PricingType.choices, default=PricingType.FIXED)
    # Caracteristiques commerciales verifiees (champs libres courts).
    validity = models.CharField(max_length=64, blank=True, default='')
    data_volume = models.CharField(max_length=64, blank=True, default='')
    voice_volume = models.CharField(max_length=64, blank=True, default='')
    sms_volume = models.CharField(max_length=64, blank=True, default='')
    speed = models.CharField(max_length=64, blank=True, default='')
    coverage = models.CharField(max_length=255, blank=True, default='')
    subscription_method = models.CharField(max_length=32, choices=SubscriptionMethod.choices, blank=True, default='')
    ussd_code = models.CharField(max_length=64, blank=True, default='')
    # Caracteristiques techniques structurees hosting/datacenter (#15) :
    # cpu, ram, storage, storage_type, bandwidth, public_ip, vpn, data_transfer,
    # backup, domain, email_accounts, databases, cms, security...
    specs = models.JSONField(default=dict, blank=True)

    # Traçabilite obligatoire pour toute donnee OFFICIAL (#7).
    source_url = models.URLField(blank=True, default='')
    source_name = models.CharField(max_length=255, blank=True, default='')
    source_checked_at = models.DateField(null=True, blank=True)
    last_verified_at = models.DateField(null=True, blank=True)
    source_version = models.CharField(max_length=64, blank=True, default='')
    data_origin = models.CharField(max_length=16, choices=DataOrigin.choices, default=DataOrigin.MANUAL)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    # Full-text search V3 : tsvector indexe nom/description/benefits/short_description
    # et mis a jour via trigger PostgreSQL (voir migration + signal post_save).
    search_vector = SearchVectorField(null=True, editable=False)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['slug']),
            models.Index(fields=['is_active', 'is_published']),
            models.Index(fields=['category']),
            models.Index(fields=['offer_type']),
            models.Index(fields=['segment']),
            GinIndex(fields=['search_vector']),
        ]

    def __str__(self):
        return self.name

    @property
    def manage_stock(self) -> bool:
        """Le stock n'est gere que pour les produits physiques."""
        return self.product_type == Product.ProductType.PHYSICAL_PRODUCT

    @property
    def price_on_request(self) -> bool:
        """Vrai si l'affichage doit montrer 'Prix sur demande' (#29)."""
        return self.pricing_type == self.PricingType.QUOTE or (
            self.pricing_type != self.PricingType.FREE and self.price is None
        )

    @property
    def is_stale(self) -> bool:
        """Offre OFFICIAL non verifiee depuis plus de DATA_FRESHNESS_DAYS (#34)."""
        import datetime

        from django.conf import settings as dj_settings

        if self.data_origin != self.DataOrigin.OFFICIAL or not self.last_verified_at:
            return False
        days = getattr(dj_settings, 'DATA_FRESHNESS_DAYS', 30)
        age = datetime.date.today() - self.last_verified_at
        return age > datetime.timedelta(days=days)

    @property
    def cta_type(self) -> str:
        """CTA adapte au type d'offre (#30) : subscribe/agency/quote/eligibility."""
        if self.offer_type == self.OfferType.FIBER or self.brand == self.Brand.FIBER_CONNECT:
            return 'eligibility'
        if self.pricing_type == self.PricingType.QUOTE or self.price is None:
            if self.brand == self.Brand.BLUE and self.service_type == self.ServiceType.OFFER:
                return 'agency'
            return 'quote'
        if self.subscription_method == self.SubscriptionMethod.AGENCY:
            return 'agency'
        return 'subscribe'



class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='products/')
    alt_text = models.CharField(max_length=255, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    # Traçabilite mission donnees reelles (#21) : URL d'origine de l'asset
    # officiel CAMTEL telecharge localement (jamais de hotlink externe).
    original_source_url = models.URLField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['order', 'created_at']

    def __str__(self):
        return f"Image for {self.product.name}"


class ProductFAQ(models.Model):
    product = models.ForeignKey(Product, related_name='faqs', on_delete=models.CASCADE)
    question = models.CharField(max_length=255)
    answer = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"FAQ: {self.question}"


def _populate_search_vector(sender, instance, **kwargs):
    """Full-text V3 : rafraichit le tsvector sous PostgreSQL seulement.

    Le trigger/migration populate les lignes historiques ; ce signal couvre
    la creation et la mise a jour en lecture. Sous SQLite (tests) il est un no-op
    car le backend n'implemente pas SearchVectorField.
    """
    from django.db import connection

    if connection.vendor == 'postgresql':
        from django.contrib.postgres.search import SearchVector

        sender.objects.filter(pk=instance.pk).update(
            search_vector=SearchVector('name', 'description', 'short_description', 'terms')
        )


post_save.connect(_populate_search_vector, sender=Product)
