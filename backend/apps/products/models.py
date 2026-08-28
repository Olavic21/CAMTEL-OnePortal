from django.conf import settings
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models
from django.db.models.signals import post_save
from django.utils import timezone

from apps.categories.models import Category


class Service(models.Model):
    """Verticale commerciale officielle OnePortal (taxonomie V4).

    SERVICES = FIXES | MOBILES | TRANSPORT | DATA_CENTER.
    "ENTREPRISE" n'est PAS un service : c'est un segment (voir Segment).

    Slugs stables exposes a l'API : fixes, mobiles, transport, data-center.
    Codes internes : FIXED, MOBILE, TRANSPORT, DATA_CENTER.
    """

    class Code(models.TextChoices):
        FIXED = 'FIXED', 'Fixes'
        MOBILE = 'MOBILE', 'Mobiles'
        TRANSPORT = 'TRANSPORT', 'Transport'
        DATA_CENTER = 'DATA_CENTER', 'Data Center'

    class Status(models.TextChoices):
        ACTIVE = 'ACTIVE', 'Active'
        INACTIVE = 'INACTIVE', 'Inactive'

    slug = models.SlugField(max_length=64, unique=True)
    code = models.CharField(max_length=32, choices=Code.choices, unique=True)
    name = models.CharField(max_length=128)
    name_en = models.CharField(max_length=128, blank=True, default='')
    description = models.TextField(blank=True, default='')
    description_en = models.TextField(blank=True, default='')
    status = models.CharField(max_length=16, choices=Status.choices, default=Status.ACTIVE)
    display_order = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        indexes = [models.Index(fields=['status'])]

    def __str__(self):
        return f'{self.code} ({self.slug})'


class Segment(models.Model):
    """Segment client OnePortal : PARTICULIER | PROFESSIONNEL | ENTREPRISE |
    ADMINISTRATION.

    Un produit peut cibler PLUSIEURS segments (voir Product.segments M2M).
    Le champ historique Product.segment (CharField) reste expose comme
    "segment principal" pour compatibilite frontend.
    """

    class Code(models.TextChoices):
        PARTICULIER = 'PARTICULIER', 'Particulier'
        PROFESSIONNEL = 'PROFESSIONNEL', 'Professionnel'
        ENTREPRISE = 'ENTREPRISE', 'Entreprise'
        ADMINISTRATION = 'ADMINISTRATION', 'Administration'

    slug = models.SlugField(max_length=64, unique=True)
    code = models.CharField(max_length=32, choices=Code.choices, unique=True)
    name = models.CharField(max_length=128)
    name_en = models.CharField(max_length=128, blank=True, default='')
    display_order = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['display_order', 'name']

    def __str__(self):
        return self.code


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
        """Taxonomie tarifaire cahier des charges #15.

        FIXED equivaut a FIXED_PRICE ; MONTHLY/YEARLY sont portes par
        billing_period ; price reste NULL pour QUOTE (prix inconnu -> jamais 0).
        """

        FIXED = 'FIXED', 'Fixed price (FIXED_PRICE)'
        QUOTE = 'QUOTE', 'Price on request (quote)'
        FREE = 'FREE', 'Free'
        INSTALLATION = 'INSTALLATION', 'Installation fee'
        USAGE_BASED = 'USAGE_BASED', 'Usage based'

    class SubscriptionMethod(models.TextChoices):
        ONLINE = 'ONLINE', 'Online'
        AGENCY = 'AGENCY', 'Agency / sales point'
        USSD = 'USSD', 'USSD'
        MOBILE_APP = 'MOBILE_APP', 'Mobile app'
        CONTACT = 'CONTACT', 'Contact / quote'

    class DataOrigin(models.TextChoices):
        """Provenance de la donnee commerciale (#37 + qualite #11/#12).

        OFFICIAL    : source officielle CAMTEL (source_url/name/last_verified_at
                      obligatoires — controle par validate_camtel_data).
        MANUAL      : saisie manuelle back-office.
        HISTORICAL  : donnee historique, ne doit jamais etre presentee comme
                      actuelle (historical_since renseigne).
        DEMO        : donnee de demonstration (marquee explicitement).
        MOCK        : donnee de simulation (mock=true) — jamais presentee
                      comme reelle.
        REQUIRES_VALIDATION : donnee non confirmee (REQUIRES_BUSINESS_VALIDATION).
        """

        OFFICIAL = 'OFFICIAL', 'Official CAMTEL source'
        DEMO = 'DEMO', 'Demo data'
        MANUAL = 'MANUAL', 'Manual entry'
        HISTORICAL = 'HISTORICAL', 'Historical data'
        MOCK = 'MOCK', 'Mock / simulated data'
        REQUIRES_VALIDATION = 'REQUIRES_VALIDATION', 'Requires business validation'


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
    # Taxonomie V4 : verticale de service officielle (fixes/mobiles/transport/
    # data-center). Nullable pour tolerate les produits legacy non classes ;
    # validate_camtel_data remonte les produits sans service en ERROR.
    service = models.ForeignKey(
        Service, related_name='products', on_delete=models.PROTECT,
        null=True, blank=True, default=None,
    )
    # Segments cibles (multi-segments). Le CharField `segment` ci-dessous reste
    # le "segment principal" expose au frontend legacy ; il est resynchronise
    # a l'enregistrement avec le premier element de `segments`.
    # NB : reference string 'products.Segment' — l'enum imbrique Product.Segment
    # masque le modele module-level dans ce corps de classe.
    segments = models.ManyToManyField('products.Segment', related_name='products', blank=True)
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
    data_origin = models.CharField(max_length=32, choices=DataOrigin.choices, default=DataOrigin.MANUAL)
    # Donnee HISTORICAL : date a partir de laquelle la donnee n'est plus
    # consideree comme actuelle (cahier des charges #11/#36).
    historical_since = models.DateField(null=True, blank=True)

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
            models.Index(fields=['service']),
            models.Index(fields=['data_origin']),
            GinIndex(fields=['search_vector']),
        ]

    def __str__(self):
        return self.name

    def save(self, *args, **kwargs):
        # Taxonomie V4 : resynchronise le segment principal (CharField legacy)
        # avec le premier segment du M2M (par display_order) lorsque celui-ci
        # est alimente. A la creation, le M2M n'est pas encore renseigne :
        # utiliser sync_segments() apres le save initial.
        if self.pk:
            first = (
                Segment.objects.filter(products=self)
                .order_by('display_order', 'code')
                .first()
            )
            if first is not None and self.segment != first.code:
                self.segment = first.code
        # Auto-resolution du service (taxonomie V4) : categorie puis offer_type
        # determinent la verticale ; les cas ambigus restent NULL et sont
        # remontes par validate_camtel_data (REQUIRES_BUSINESS_VALIDATION).
        if self.service_id is None:
            from apps.products.taxonomy import resolve_service_slug

            service_slug = resolve_service_slug(
                getattr(self.category, 'slug', '') or '', self.offer_type,
            )
            if service_slug:
                service = Service.objects.filter(slug=service_slug).first()
                if service is not None:
                    self.service = service
        super().save(*args, **kwargs)

    def sync_segments(self, segment_codes):
        """Definit les segments du produit et resynchronise le segment principal.

        `segment_codes` : iterable de codes Segment (PARTICULIER, ...).
        Idempotent : les doublons sont ignores.
        """
        codes = [str(c).upper() for c in segment_codes if c]
        segments = list(Segment.objects.filter(code__in=codes))
        if not segments:
            return False
        self.segments.set(segments)
        primary = min(segments, key=lambda s: (s.display_order, s.code))
        if self.segment != primary.code:
            self.segment = primary.code
            self.save(update_fields=['segment', 'updated_at'])
        return True

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


# Provenances non commerciales (demo/mock/historique) — definies APRES la
# declaration de l'enum TextChoices (les membres ne sont pas accessibles dans
# le corps de la classe).
Product.DataOrigin.DEMO_ORIGINS = frozenset({
    Product.DataOrigin.DEMO,
    Product.DataOrigin.MOCK,
    Product.DataOrigin.HISTORICAL,
})


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


class ProductSource(models.Model):
    """Source de verite d'un produit (cahier des charges #12).

    Complete les champs denormalises de Product (source_url/source_name)
    par une entite structuree permettant l'historisation des verifications.
    `verification_status` reprend la strategie stricte de provenance :
    OFFICIAL / MANUAL / HISTORICAL / DEMO / MOCK / REQUIRES_VALIDATION.
    """

    class SourceType(models.TextChoices):
        OFFICIAL_WEBSITE = 'OFFICIAL_WEBSITE', 'Official website'
        OFFICIAL_DOCUMENT = 'OFFICIAL_DOCUMENT', 'Official document'
        SNAPSHOT = 'SNAPSHOT', 'Catalog snapshot'
        AGENCY = 'AGENCY', 'Agency / sales point'
        SUPPORT = 'SUPPORT', 'Support channel'
        OTHER = 'OTHER', 'Other'

    class VerificationStatus(models.TextChoices):
        OFFICIAL = 'OFFICIAL', 'Official'
        MANUAL = 'MANUAL', 'Manual'
        HISTORICAL = 'HISTORICAL', 'Historical'
        DEMO = 'DEMO', 'Demo'
        MOCK = 'MOCK', 'Mock'
        REQUIRES_VALIDATION = 'REQUIRES_VALIDATION', 'Requires validation'

    product = models.ForeignKey(
        Product, related_name='sources', on_delete=models.CASCADE,
    )
    source_name = models.CharField(max_length=255)
    source_url = models.URLField(blank=True, default='')
    source_type = models.CharField(
        max_length=32, choices=SourceType.choices, default=SourceType.OFFICIAL_WEBSITE,
    )
    verification_status = models.CharField(
        max_length=32, choices=VerificationStatus.choices,
        default=VerificationStatus.REQUIRES_VALIDATION,
    )
    last_verified_at = models.DateField(null=True, blank=True)
    checked_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='verified_sources',
    )
    notes = models.TextField(blank=True, default='')
    is_primary = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_primary', '-last_verified_at', 'source_name']
        indexes = [
            models.Index(fields=['verification_status']),
            models.Index(fields=['product', 'is_primary']),
        ]
        constraints = [
            # Une donnee OFFICIAL doit etre verifiable : URL obligatoire.
            models.CheckConstraint(
                condition=~models.Q(verification_status='OFFICIAL') | ~models.Q(source_url=''),
                name='productsource_official_requires_url',
            ),
        ]

    def __str__(self):
        return f'{self.source_name} ({self.verification_status}) -> {self.product.name}'

    def log_verification(self, verified_by=None, result='VERIFIED', notes=''):
        """Historise une verification dans SourceVerificationLog."""
        return SourceVerificationLog.objects.create(
            source=self,
            verified_at=timezone.now(),
            verified_by=verified_by,
            result=result,
            notes=notes,
        )


class SourceVerificationLog(models.Model):
    """Historique des verifications d'une source (#12).

    Conserve qui a verifie quoi, quand, avec quel resultat — sans jamais
    stocker de donnee sensible.
    """

    class Result(models.TextChoices):
        VERIFIED = 'VERIFIED', 'Verified'
        CHANGED = 'CHANGED', 'Content changed'
        UNAVAILABLE = 'UNAVAILABLE', 'Source unavailable'
        INVALID = 'INVALID', 'Invalid / rejected'

    source = models.ForeignKey(
        ProductSource, related_name='verification_logs', on_delete=models.CASCADE,
    )
    verified_at = models.DateTimeField(default=timezone.now)
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
    )
    result = models.CharField(
        max_length=16, choices=Result.choices, default=Result.VERIFIED,
    )
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-verified_at']
        indexes = [models.Index(fields=['source', 'verified_at'])]

    def __str__(self):
        return f'{self.source.source_name} - {self.result} @ {self.verified_at:%Y-%m-%d %H:%M}'


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
