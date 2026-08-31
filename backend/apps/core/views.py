from django.db.models import Q
from django.http import HttpResponse
from django.utils import timezone
from io import BytesIO
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.contacts.models import ContactMessage
from apps.news.models import News
from apps.news.serializers import NewsSerializer
from apps.products.models import Product, Service
from apps.products.serializers import ProductSerializer
from apps.promotions.models import Promotion

from .models import (
    ActivityLog,
    AnalyticsEvent,
    Notification,
    Payment,
    SupportTicket,
    TicketMessage,
)
from .permissions import AdminOnly, IsAdminOrEditor
from .serializers import (
    ActivityLogSerializer,
    AnalyticsEventSerializer,
    NotificationSerializer,
    SupportTicketSerializer,
    TicketMessageSerializer,
)
from .throttling import ChatbotRateThrottle, SearchRateThrottle


class HealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        checks = {
            'status': 'ok',
            'database': 'ok',
            'storage': 'ok',
            'version': '1.0.0',
        }
        try:
            from django.db import connection
            connection.ensure_connection()
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
        except Exception:
            checks['database'] = 'error'
            checks['status'] = 'degraded'

        try:
            from django.conf import settings
            import os
            media_root = getattr(settings, 'MEDIA_ROOT', None)
            if media_root:
                os.makedirs(media_root, exist_ok=True)
                if not os.access(media_root, os.W_OK):
                    checks['storage'] = 'error'
                    checks['status'] = 'degraded'
        except Exception:
            checks['storage'] = 'error'
            checks['status'] = 'degraded'

        http_status = status.HTTP_200_OK if checks['status'] == 'ok' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(checks, status=http_status)


class HealthLiveView(APIView):
    """Liveness probe : l'application tourne-t-elle ? (Phase 27).

    Aucune dependance externe n'est verifiee ici — si ce endpoint repond,
    le process Django est vivant et peut servir du trafic.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({'status': 'alive'})


class HealthReadyView(APIView):
    """Readiness probe : l'application peut-elle servir correctement ?

    Verifie les dependances critiques : database, storage, cache.
    Les services optionnels (LLM/chatbot) sont reportes a titre indicatif
    mais ne font PAS echouer la readiness : un fallback existe.
    """

    permission_classes = [permissions.AllowAny]

    def get(self, request):
        checks = {
            'status': 'ok',
            'database': 'ok',
            'storage': 'ok',
            'cache': 'ok',
        }
        try:
            from django.db import connection
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
        except Exception:
            checks['database'] = 'error'
            checks['status'] = 'unavailable'

        try:
            from django.conf import settings
            import os
            media_root = getattr(settings, 'MEDIA_ROOT', None)
            if media_root:
                os.makedirs(media_root, exist_ok=True)
                if not os.access(media_root, os.W_OK):
                    checks['storage'] = 'error'
                    checks['status'] = 'degraded'
        except Exception:
            checks['storage'] = 'error'
            checks['status'] = 'degraded'

        try:
            from django.core.cache import cache
            probe_key = '_health_ready_probe'
            cache.set(probe_key, 1, 10)
            if cache.get(probe_key) != 1:
                checks['cache'] = 'error'
                checks['status'] = 'degraded'
        except Exception:
            # Le cache n'est pas critique pour readiness (fallback memoire/DB)
            checks['cache'] = 'degraded'

        http_status = status.HTTP_200_OK if checks['status'] == 'ok' else status.HTTP_503_SERVICE_UNAVAILABLE
        return Response(checks, status=http_status)


class CatalogDataQualityView(APIView):
    """Dashboard qualite du catalogue commercial (Phase 31)."""

    permission_classes = [IsAdminOrEditor]

    def get(self, request):
        products = Product.objects.all()
        official = products.filter(data_origin=Product.DataOrigin.OFFICIAL)
        return Response({
            'total_products': products.count(),
            'official_total': official.count(),
            'official_verified': official.exclude(source_url='').exclude(last_verified_at=None).count(),
            'official_without_source': official.filter(source_url='').count(),
            'requires_verification': products.filter(status=Product.Status.REQUIRES_VERIFICATION).count(),
            'stale': sum(1 for p in products.filter(is_published=True) if p.is_stale),
            'without_price': products.filter(price__isnull=True).exclude(pricing_type=Product.PricingType.QUOTE).count(),
            'price_on_request': products.filter(pricing_type=Product.PricingType.QUOTE).count(),
            'without_image': sum(1 for p in products.prefetch_related('images') if not p.images.exists()),
        })


class DashboardSummaryView(APIView):
    permission_classes = [IsAdminOrEditor]

    def get(self, request):
        from django.contrib.auth import get_user_model
        from django.db.models import Count
        from apps.subscriptions.models import SubscriptionRequest

        UserModel = get_user_model()
        role_counts = dict(
            UserModel.objects.all()
            .values_list('role')
            .annotate(c=Count('id'))
            .values_list('role', 'c')
        )
        active_subs = SubscriptionRequest.Status.ACTIVE
        subscriptions_total = SubscriptionRequest.objects.count()
        return Response({
            'products_published': Product.objects.filter(is_published=True).count(),
            'products_draft': Product.objects.filter(is_published=False).count(),
            'news_recent': NewsSerializer(
                News.objects.filter(is_published=True).order_by('-published_at')[:5],
                many=True,
                context={'request': request},
            ).data,
            'promotions_active': Promotion.objects.filter(is_active=True).count(),
            'contact_messages_new': ContactMessage.objects.filter(is_read=False).count(),
            # --- Compteurs Superadmin (donnees reelles) ---
            'users': {
                'total': UserModel.objects.all().count(),
                'active': UserModel.objects.filter(is_active=True).count(),
                'customers': role_counts.get('CUSTOMER', 0),
                'backoffice': sum(role_counts.get(r, 0) for r in ('SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'EDITOR')),
                'super_admins': role_counts.get('SUPER_ADMIN', 0),
                'admins': role_counts.get('ADMIN', 0),
                'by_role': role_counts,
            },
            'roles_count': len([c for c in role_counts.values() if c]),
            'subscriptions': {
                'total': subscriptions_total,
                'pending': SubscriptionRequest.objects.filter(
                    status__in=('PENDING', 'UNDER_REVIEW'),
                ).count(),
                'activated': SubscriptionRequest.objects.filter(
                    status__in=('ACTIVATED', active_subs),
                ).count(),
            },
            'tickets': {
                'total': SupportTicket.objects.all().count(),
                'open': SupportTicket.objects.filter(
                    status__in=('OPEN', 'IN_PROGRESS', 'WAITING_CUSTOMER'),
                ).count(),
            },
            'payments': {
                'total': Payment.objects.all().count(),
                'pending': Payment.objects.filter(status='PENDING').count(),
                'completed': Payment.objects.filter(status='COMPLETED').count(),
            },
            'notifications_unread_global': Notification.objects.filter(
                user__isnull=True, is_read=False,
            ).count(),
        })


class ChatbotView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_classes = [ChatbotRateThrottle]

    def post(self, request):
        # Robustesse : un corps JSON mal forme (string, liste, null) doit produire
        # une 400 explicite et non une 500 AttributeError. Le frontend envoie
        # toujours { question } (dict), mais un appel exterieur ou un provider LLM
        # retournant un body inattendu doit etre gere sans faire planter le
        # process. Le fallback search reste disponible pour question vide.
        if not isinstance(request.data, dict):
            return Response(
                {'answer': 'Posez une question sur nos produits ou services.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        question = (request.data.get('question') or '').strip()
        if not question:
            return Response({'answer': 'Posez une question sur nos produits ou services.'})
        from apps.core.analytics import record_event
        from apps.core.chatbot_service import ask_chatbot

        # Phase 17 : chaque question alimente l'analytics (sans PII).
        record_event(
            event_type='chatbot_question',
            user=getattr(request, 'user', None),
            payload={'query': question[:200]},
        )
        return Response(ask_chatbot(question.lower()))



class GlobalSearchView(APIView):
    """Recherche globale structuree (cahier des charges #16/#29).

    GET /api/v1/search/?q=...&service=...&segment=...&price_min=...&price_max=...
        &availability=...&status=...&product_type=...&page=1

    Retourne des resultats structures, sources par type (service/product/faq),
    avec pagination obligatoire. Public.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchRateThrottle]
    PAGE_SIZE = 20

    def get(self, request):
        from apps.products.models import ProductFAQ

        params = request.query_params
        query = (params.get('q') or '').strip()

        results = []

        # 1. Services (si filtre service absent, listes toutes).
        services = Service.objects.filter(status=Service.Status.ACTIVE)
        if query:
            services = services.filter(Q(name__icontains=query) | Q(name_en__icontains=query) | Q(description__icontains=query))
        for s in services.order_by('display_order', 'name'):
            results.append({
                'type': 'service',
                'id': s.id,
                'slug': s.slug,
                'title': s.name,
                'name_en': s.name_en,
                'url': f'/api/v1/services/{s.slug}/',
            })

        # 2. Produits (catalogue publie, filtres).
        products = Product.objects.filter(is_published=True, is_active=True)
        if query:
            products = products.filter(
                Q(name__icontains=query) | Q(name_en__icontains=query)
                | Q(description__icontains=query) | Q(slug__icontains=query)
            )
        service = params.get('service')
        if service:
            products = products.filter(service__slug=service)
        segment = params.get('segment')
        if segment:
            seg_upper = segment.upper()
            legacy_map = {'GRAND_PUBLIC': 'PARTICULIER', 'ENTREPRISE': 'ENTREPRISE'}
            code = legacy_map.get(seg_upper, seg_upper)
            products = products.filter(
                Q(segment=code) | Q(segments__code=code),
            ).distinct()
        if params.get('availability'):
            products = products.filter(availability=params['availability'].upper())
        if params.get('status'):
            products = products.filter(status=params['status'].upper())
        if params.get('product_type'):
            products = products.filter(product_type=params['product_type'].upper())
        price_min = params.get('price_min')
        if price_min:
            products = products.filter(price__gte=price_min)
        price_max = params.get('price_max')
        if price_max:
            products = products.filter(price__lte=price_max)

        for p in products.select_related('service').prefetch_related('segments')[:200]:
            results.append({
                'type': 'product',
                'id': p.id,
                'slug': p.slug,
                'title': p.name,
                'name_en': p.name_en,
                'service': p.service.slug if p.service else None,
                'price': p.price,
                'currency': p.currency,
                'pricing_type': p.pricing_type,
                'url': f'/api/v1/products/{p.slug}/',
            })

        # 3. FAQ produits.
        faqs = ProductFAQ.objects.all()
        if query:
            faqs = faqs.filter(Q(question__icontains=query) | Q(answer__icontains=query))
        if service:
            faqs = faqs.filter(product__service__slug=service)
        for f in faqs.select_related('product')[:100]:
            results.append({
                'type': 'faq',
                'id': f.id,
                'title': f.question,
                'product_slug': f.product.slug,
                'url': f'/api/v1/products/{f.product.slug}/',
            })

        # Pagination.
        try:
            page = max(int(params.get('page', 1)), 1)
        except (TypeError, ValueError):
            page = 1
        total = len(results)
        start = (page - 1) * self.PAGE_SIZE
        page_results = results[start:start + self.PAGE_SIZE]

        return Response({
            'query': query,
            'count': total,
            'page': page,
            'page_size': self.PAGE_SIZE,
            'next': (page + 1) if start + self.PAGE_SIZE < total else None,
            'previous': (page - 1) if page > 1 else None,
            'results': page_results,
        })


class SearchAutocompleteView(APIView):
    """Recherche globale (section 12 mission) : produits/offres, actualites,
    promotions et FAQ. Portait uniquement sur les produits auparavant —
    etendu pour couvrir les 4 sources demandees par le cahier des charges."""

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchRateThrottle]

    def get(self, request):
        from apps.products.models import ProductFAQ

        query = (request.query_params.get('q') or '').strip()
        if len(query) < 2:
            return Response([])

        results = []

        products = Product.objects.filter(
            Q(name__icontains=query) | Q(slug__icontains=query),
            is_published=True,
        ).values('id', 'name', 'slug')[:5]
        results += [{'type': 'product', 'id': p['id'], 'title': p['name'], 'slug': p['slug']} for p in products]

        news = News.objects.filter(
            Q(title__icontains=query) | Q(content__icontains=query),
            is_published=True,
        ).values('id', 'title', 'slug')[:5]
        results += [{'type': 'news', 'id': n['id'], 'title': n['title'], 'slug': n['slug']} for n in news]

        promotions = Promotion.objects.filter(
            Q(title__icontains=query) | Q(description__icontains=query),
            is_active=True,
        ).values('id', 'title', 'slug')[:5]
        results += [{'type': 'promotion', 'id': pr['id'], 'title': pr['title'], 'slug': pr['slug']} for pr in promotions]

        faqs = ProductFAQ.objects.filter(
            Q(question__icontains=query) | Q(answer__icontains=query),
        ).select_related('product').values('id', 'question', 'product__slug')[:5]
        results += [
            {'type': 'faq', 'id': f['id'], 'title': f['question'], 'slug': f['product__slug']} for f in faqs
        ]

        return Response(results[:15])


class EligibilityCheckView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        product_id = request.data.get('product_id')
        slug = request.data.get('slug')
        if not product_id and not slug:
            return Response({'detail': 'product_id ou slug est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        lookup = {'pk': product_id} if product_id else {'slug': slug}
        try:
            product = Product.objects.get(**lookup)
        except Product.DoesNotExist:
            return Response({'detail': 'Offre introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        from apps.core.v2_services import get_eligibility_provider
        provider = get_eligibility_provider()
        result = provider.check(
            product,
            address=(request.data.get('address') or '').strip(),
            phone=(request.data.get('phone') or '').strip(),
        )
        data = result.as_dict()
        data['provider'] = provider.name
        return Response(data)


class PaymentInitiateView(APIView):
    """Initiation d'un paiement (Phase 10 — confiance serveur).

    Regles de securite :
      - le montant n'est JAMAIS pris du client pour un paiement produit ;
        il est lu depuis le prix officiel en base ;
      - le flux non-produit est refuse (aucun montant libre ne doit pouvoir
        etre iniatié sans objet metier reference) ;
      - une cle d'idempotence (header ``Idempotency-Key`` ou champ body)
        garantit qu'un retry client ne cree pas une seconde transaction ;
      - chaque initiation est persistee dans :model:`apps_core.Payment`.
    """

    permission_classes = [permissions.IsAuthenticated]
    MAX_IDEMPOTENCY_KEY_LEN = 128

    def post(self, request):
        from decimal import Decimal


        from apps.core.analytics import record_event
        from apps.core.models import Payment
        from apps.core.v2_services import generate_reference, get_payment_provider

        product_id = request.data.get('product_id')

        # Phase 10 : montant 100% determine cote serveur depuis l'offre.
        if not product_id:
            return Response(
                {'detail': "product_id est requis. Le montant n'est jamais accepté du client."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            product = Product.objects.get(pk=product_id)
        except Product.DoesNotExist:
            return Response({'detail': 'Offre introuvable.'}, status=status.HTTP_404_NOT_FOUND)

        if product.price is None:
            return Response(
                {'detail': 'Cette offre ne peut pas être payée en ligne (Prix sur demande).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        amount_decimal = Decimal(product.price)
        currency = product.currency
        if amount_decimal <= 0:
            return Response({'detail': 'Montant du produit invalide.'}, status=status.HTTP_400_BAD_REQUEST)

        # --- Idempotence -------------------------------------------------
        idempotency_key = (
            request.headers.get('Idempotency-Key')
            or request.data.get('idempotency_key')
            or ''
        )
        idempotency_key = str(idempotency_key).strip()[: self.MAX_IDEMPOTENCY_KEY_LEN]
        if idempotency_key:
            existing = Payment.objects.filter(
                user=request.user, idempotency_key=idempotency_key,
            ).first()
            if existing is not None:
                # Rejeu identique -> on renvoie la transaction existante
                # SANS re-initier une deuxieme execution aupres du provider.
                return Response(self._payment_payload(existing), status=status.HTTP_200_OK)

        provider = get_payment_provider()
        reference = generate_reference('PAY')
        result = provider.initiate_payment(
            amount=amount_decimal,
            currency=currency,
            customer={
                'id': request.user.pk,
                'email': request.user.email,
                'username': request.user.username,
            },
            reference=reference,
            metadata={'product_id': product_id},
        )

        payment = Payment.objects.create(
            reference=reference,
            idempotency_key=idempotency_key,
            transaction_id=result.get('transaction_id', ''),
            provider=provider.name,
            product=product,
            user=request.user,
            amount=amount_decimal,
            currency=currency,
            status=Payment.Status.PENDING,
            metadata=result.get('metadata', {}),
        )
        record_event(event_type='payment_started', user=request.user, product=product)

        return Response(self._payment_payload(payment, extra=result), status=status.HTTP_201_CREATED)

    @staticmethod
    def _payment_payload(payment, extra=None):
        payload = {
            'id': payment.pk,
            'provider': payment.provider,
            'transaction_id': payment.transaction_id,
            'reference': payment.reference,
            'status': payment.status,
            'amount': str(payment.amount),
            'currency': payment.currency,
            'created_at': payment.created_at.isoformat() if payment.created_at else None,
        }
        if extra:
            for key in ('payment_url', 'metadata'):
                if key in extra:
                    payload[key] = extra[key]
        if payment.provider == 'mock':
            payload['simulation'] = (
                "Simulation — aucune transaction réelle n'est effectuée."
            )
        return payload


class PaymentHistoryView(APIView):
    """Historique des paiements de l'utilisateur connecte (espace client).

    Regles :
      - isolation stricte : ne renvoie QUE les paiements de ``request.user``
        (aucun parametre client ne peut elargir le perimetre) ;
      - les statuts exposes sont le mappage reel du modele Payment :
        COMPLETED -> PAID, PENDING -> PENDING, FAILED/CANCELLED -> FAILED ;
      - ``paid_at`` correspond a la date de derniere transition d'etat du
        paiement (updated_at) uniquement lorsqu'il est COMPLETED — aucune
        date n'est simulee pour les autres statuts ;
      - ``summary.next_due_date`` vaut toujours null : aucune facturation
        recurrente n'est modelisee (camtel backend) — ne pas inventer.
    """

    permission_classes = [permissions.IsAuthenticated]
    MAX_LIMIT = 100

    STATUS_MAP = {
        Payment.Status.COMPLETED: 'PAID',
        Payment.Status.PENDING: 'PENDING',
        Payment.Status.FAILED: 'FAILED',
        Payment.Status.CANCELLED: 'FAILED',
    }

    def get(self, request):
        from django.db.models import Count, Sum

        from .models import Payment

        try:
            limit = int(request.query_params.get('limit', 50))
        except (TypeError, ValueError):
            limit = 50
        limit = max(1, min(limit, self.MAX_LIMIT))

        payments = (
            Payment.objects.filter(user=request.user)
            .select_related('product')
            .order_by('-created_at')[:limit]
        )

        results = []
        for payment in payments:
            status_mapped = self.STATUS_MAP.get(payment.status, 'FAILED')
            results.append(
                {
                    'id': payment.pk,
                    'reference': payment.reference,
                    'transaction_id': payment.transaction_id,
                    'provider': payment.provider,
                    'product_name': payment.product.name if payment.product else None,
                    'product_slug': payment.product.slug if payment.product else None,
                    'amount': str(payment.amount),
                    'currency': payment.currency,
                    'status': status_mapped,
                    'paid_at': (
                        payment.updated_at.isoformat()
                        if payment.status == Payment.Status.COMPLETED and payment.updated_at
                        else None
                    ),
                    'created_at': payment.created_at.isoformat() if payment.created_at else None,
                    'simulation': payment.provider == 'mock',
                }
            )

        # Resume calcule en base (une seule requete agregats + une de comptage).
        from decimal import Decimal

        totals = Payment.objects.filter(user=request.user).aggregate(
            total_paid=Sum('amount', filter=Q(status=Payment.Status.COMPLETED)),
        )
        counts = Payment.objects.filter(user=request.user).values('status').annotate(c=Count('id'))
        by_status = {row['status']: row['c'] for row in counts}
        pending_count = by_status.get(Payment.Status.PENDING, 0)
        # Normalisation de l'echelle decimale (Sum() peut la perdre selon le backend DB).
        total_paid = f'{Decimal(totals["total_paid"] or 0):.2f}'

        summary = {
            'total_paid': total_paid,
            'currency': results[0]['currency'] if results else 'XAF',
            'pending_count': pending_count,
            'failed_count': by_status.get(Payment.Status.FAILED, 0)
            + by_status.get(Payment.Status.CANCELLED, 0),
            'completed_count': by_status.get(Payment.Status.COMPLETED, 0),
            'billing_status': 'PENDING' if pending_count > 0 else 'UP_TO_DATE',
            'next_due_date': None,
        }
        return Response({'count': len(results), 'results': results, 'summary': summary})


class DocumentSearchView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.core.v2_services import DocumentStore
        store = DocumentStore()
        query = request.query_params.get('q', '')
        kind = request.query_params.get('kind')
        product_id = request.query_params.get('product_id')
        if query:
            documents = store.search(query)
        else:
            documents = store.list_documents(
                product_id=int(product_id) if product_id else None,
                kind=kind,
            )
        return Response({'count': len(documents), 'results': documents})


class RecommendationView(APIView):
    permission_classes = [permissions.AllowAny]

    @staticmethod
    def _parse_number(raw):
        if raw in (None, ''):
            return None
        try:
            return float(raw)
        except (TypeError, ValueError):
            return None

    def post(self, request):
        """« Trouver ma solution » (section 14) : moteur de recommandation
        SERVEUR. Le client n'envoie que des criteres ; le backend filtre et
        trie le catalogue reellement publie, puis serialise les offres avec
        le contrat ProductSerializer (regle #52 : aucune donnee inventee,
        regle #59 : pas de scoring fantome cote client uniquement)."""
        from apps.core.v2_services import recommend_products_by_criteria
        from apps.products.serializers import ProductSerializer

        criteria = request.data if isinstance(request.data, dict) else {}
        parsed = {}
        for key in ('budget', 'min_speed', 'min_storage', 'users'):
            value = criteria.get(key)
            number = self._parse_number(value)
            if value not in (None, '') and number is None:
                return Response(
                    {'detail': f"Critère invalide : '{key}' doit être un nombre."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            parsed[key] = number
        if parsed.get('users') is not None and parsed['users'] < 1:
            return Response(
                {'detail': "Critère invalide : 'users' doit être >= 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        service = str(criteria.get('service') or '').strip().lower().replace('_', '-')
        segment = str(criteria.get('segment') or '').strip().upper()
        try:
            limit = int(criteria.get('limit', 6))
        except (TypeError, ValueError):
            limit = 6

        products = recommend_products_by_criteria(
            service=service,
            segment=segment,
            limit=limit,
            **parsed,
        )
        results = ProductSerializer(products, many=True, context={'request': request}).data
        return Response({'count': len(results), 'engine': 'criteria', 'results': results})

    def get(self, request):
        from apps.core.v2_services import recommend_products
        product = None
        slug = request.query_params.get('product') or request.query_params.get('slug')
        if slug:
            try:
                product = Product.objects.get(slug=slug)
            except Product.DoesNotExist:
                return Response({'detail': 'Offre introuvable.'}, status=status.HTTP_404_NOT_FOUND)
        try:
            limit = int(request.query_params.get('limit', 3))
        except ValueError:
            limit = 3
        recommendations = recommend_products(
            product,
            segment=request.query_params.get('segment', ''),
            limit=max(1, min(limit, 10)),
        )
        return Response({'count': len(recommendations), 'results': recommendations})


class ActivityLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ActivityLog.objects.select_related('user').all()
    serializer_class = ActivityLogSerializer
    permission_classes = [AdminOnly]

    def get_queryset(self):
        queryset = super().get_queryset()
        target_model = self.request.query_params.get('target_model')
        user_id = self.request.query_params.get('user')
        if target_model:
            queryset = queryset.filter(target_model=target_model)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset


class NotificationViewSet(viewsets.ModelViewSet):
    """Centre de notifications (Phase 16).

    Un utilisateur ne voit et ne manipule QUE ses propres notifications ;
    les staff/admin voient en plus les notifications globales (user=None).
    Corrige l'exposition anterieure de toutes les notifications à tout
    utilisateur authentifie.
    """

    queryset = Notification.objects.all()
    serializer_class = NotificationSerializer

    def get_permissions(self):
        return [permissions.IsAuthenticated()]

    def _is_admin(self, user) -> bool:
        return bool(
            user.is_staff
            or getattr(user, 'role', None) in {'SUPER_ADMIN', 'ADMIN'}
        )

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self._is_admin(self.request.user):
            queryset = queryset.filter(user=self.request.user)
        elif self.request.query_params.get('scope') != 'all':
            # Admin par defaut : ses notifications + les globales (user=None).
            queryset = queryset.filter(
                Q(user=self.request.user) | Q(user__isnull=True),
            )
        if self.request.query_params.get('unread') == 'true':
                    queryset = queryset.filter(is_read=False)
        return queryset

    @action(detail=True, methods=['post'], url_path='mark-read')
    def mark_read(self, request, pk=None):
        notification = self.get_object()
        notification.is_read = True
        if not notification.read_at:
            notification.read_at = timezone.now()
        notification.save(update_fields=['is_read', 'read_at'])
        return Response(NotificationSerializer(notification).data)

    @action(detail=False, methods=['post'], url_path='mark-all-read')
    def mark_all_read(self, request):
        updated = self.get_queryset().filter(is_read=False).update(
            is_read=True, read_at=timezone.now(),
        )
        return Response({'updated': updated})


class AnalyticsEventCreateView(APIView):
    """Collecte d'un evenement analytique public (Phase 18 — validation stricte).

    Seuls les evenements provenant du navigateur sont acceptes ici ; les
    evenements metier (subscription_approved/activated, payment_*) sont
    enregistres cote serveur et ne peuvent pas etre falsifies par un client.
    """

    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchRateThrottle]

    CLIENT_EVENT_TYPES = frozenset({
        'offer_view',
        'offer_compare',
        'service_view',
        'product_view',
        'comparison',
        'subscription_started',
        'search',
        'faq_view',
        'chatbot_question',
        'recommendation_clicked',
    })

    def post(self, request):
        from apps.core.analytics import record_event

        event_type = (request.data.get('event_type') or '').strip()
        if event_type not in self.CLIENT_EVENT_TYPES:
            return Response(
                {'detail': "Type d'evenement inconnu ou non autorise."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        product = None
        product_id = request.data.get('product_id')
        if product_id not in (None, ''):
            try:
                product_id = int(product_id)
            except (TypeError, ValueError):
                return Response(
                    {'detail': 'product_id invalide.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            product = Product.objects.filter(pk=product_id).first()
        event = record_event(
            event_type=event_type,
            user=request.user,
            product=product,
            payload=request.data.get('payload') or {},
        )
        if event is None:
            return Response(
                {'detail': 'Evenement refuse (payload invalide).'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response(AnalyticsEventSerializer(event).data, status=status.HTTP_201_CREATED)


class AnalyticsSummaryView(APIView):
    """Resume analytique admin : KPIs, top offres, top categories, recherches
    et funnel de conversion (Phase 17) avec filtres date/categorie/produit/segment."""

    permission_classes = [IsAdminOrEditor]

    def get(self, request):
        from apps.core.analytics import analytics_summary

        params = request.query_params
        return Response(analytics_summary(
            days=params.get('days', '30'),
            category=(params.get('category') or '').strip(),
            product=(params.get('product') or '').strip(),
            segment=(params.get('segment') or '').strip(),
        ))


class SupportTicketViewSet(viewsets.ModelViewSet):
    queryset = SupportTicket.objects.select_related('client', 'assigned_agent').prefetch_related('messages')
    serializer_class = SupportTicketSerializer

    def get_permissions(self):
        if self.action in {'create', 'my_tickets', 'reply', 'retrieve'}:
            return [permissions.IsAuthenticated()]
        if self.action in {'list', 'update', 'partial_update', 'destroy'}:
            return [AdminOnly()]
        return [AdminOnly()]

    def get_queryset(self):
        """Phase 34 (IDOR) : un client ne peut accéder qu'à SES tickets.

        retrieve/reply/my-tickets sont scopés au propriétaire pour les
        non-admins ; la liste reste reservee aux admins (les clients passent
        par my-tickets).
        """
        queryset = super().get_queryset()
        user = self.request.user
        if getattr(user, 'is_staff', False) or getattr(user, 'role', None) in {'SUPER_ADMIN', 'ADMIN'}:
            return queryset
        if self.action in {'retrieve', 'reply', 'my_tickets'}:
            return queryset.filter(client=user)
        return queryset.none()

    def perform_create(self, serializer):
        serializer.save(client=self.request.user)

    @action(detail=False, methods=['get'], url_path='my-tickets')
    def my_tickets(self, request):
        queryset = self.get_queryset().filter(client=request.user)
        return Response(self.get_serializer(queryset, many=True).data)

    @action(detail=True, methods=['post'], url_path='reply')
    def reply(self, request, pk=None):
        # Recuperation NON scopee volontaire : on distingue 403 (ticket d'un
        # autre utilisateur) de 404 (ticket inexistant) pour que le client
        # legitime recoive une erreur explicite (Phase 15 / Phase 34).
        try:
            ticket = SupportTicket.objects.get(pk=pk)
        except SupportTicket.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        is_staff = getattr(request.user, 'role', '') in {'SUPER_ADMIN', 'ADMIN', 'PRODUCT_MANAGER', 'EDITOR'}
        if not is_staff and ticket.client_id != request.user.id:
            return Response({'detail': 'Accès interdit à ce ticket.'}, status=status.HTTP_403_FORBIDDEN)

        message_text = (request.data.get('message') or '').strip()
        if not message_text:
            return Response({'detail': 'message est requis.'}, status=status.HTTP_400_BAD_REQUEST)

        message = TicketMessage.objects.create(
            ticket=ticket,
            author=request.user if request.user.is_authenticated else None,
            message=message_text,
        )
        ticket.save(update_fields=['updated_at'])
        return Response(TicketMessageSerializer(message, context={'request': request}).data, status=status.HTTP_201_CREATED)
