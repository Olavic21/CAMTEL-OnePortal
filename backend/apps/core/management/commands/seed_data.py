from django.conf import settings
from django.core.management.base import BaseCommand, CommandError
from django.db import connection

from apps.categories.models import Category
from apps.news.models import News
from apps.products.models import Product
from apps.promotions.models import Promotion
from apps.users.models import User


class Command(BaseCommand):
    help = 'Seed the database with DEMO CAMTEL data (bilingual FR/EN). For development only.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Forcer le seed meme hors developpement (a utiliser uniquement en staging de demo).',
        )

    def _ensure_user(self, username, password, **defaults):
        user, _ = User.objects.get_or_create(username=username, defaults=defaults)
        for key, value in defaults.items():
            setattr(user, key, value)
        user.set_password(password)
        user.save()
        return user

    def handle(self, *args, **options):
        # Securite : jamais de seed demo automatique en production/staging.
        # En dev (DEBUG=True) le seed est autorise. Sinon il faut SEED_DEMO_DATA=true
        # dans l'environnement, ou l'option explicite --force.
        force = options.get('force', False)
        seed_env = settings.SEED_DEMO_DATA
        if not settings.DEBUG and not seed_env and not force:
            raise CommandError(
                'Seed demo refuse : mode hors-developpement. Definissez SEED_DEMO_DATA=true '
                'dans l\'environnement ou passez --force pour un seed volontaire.'
            )

        self.stdout.write('Création des données DEMO CAMTEL...')

        self._ensure_user(
            'superadmin',
            'CamtelAdmin2026!',
            email='superadmin@camtel.cm',
            role=User.Role.SUPER_ADMIN,
            is_staff=True,
            is_superuser=True,
        )

        self._ensure_user(
            'admin',
            'admin123',
            email='admin@camtel.cm',
            role=User.Role.ADMIN,
            is_staff=True,
            is_superuser=False,
        )

        self._ensure_user(
            'editor',
            'editor123',
            email='editor@camtel.cm',
            role=User.Role.EDITOR,
            is_staff=True,
        )

        telecom, _ = Category.objects.update_or_create(
            slug='telecom',
            defaults={
                'name': 'Télécom',
                'name_en': 'Telecom',
                'description': 'Solutions de télécommunication',
                'description_en': 'Telecommunication solutions',
                'segment': Category.Segment.ENTREPRISE,
            },
        )
        internet, _ = Category.objects.update_or_create(
            slug='internet',
            defaults={
                'name': 'Internet',
                'name_en': 'Internet',
                'description': 'Accès internet et fibre',
                'description_en': 'Internet and fiber access',
                'segment': Category.Segment.GRAND_PUBLIC,
            },
        )
        cloud, _ = Category.objects.update_or_create(
            slug='cloud',
            defaults={
                'name': 'Cloud',
                'name_en': 'Cloud',
                'description': 'Services cloud et datacenter',
                'description_en': 'Cloud and datacenter services',
                'segment': Category.Segment.ENTREPRISE,
            },
        )

        # NOTE mission donnees reelles (#37) : ces entrees sont des DONNEES DEMO
        # fictives, marquees data_origin=DEMO pour pouvoir les isoler/archiver
        # sans toucher au catalogue officiel (import_camtel_catalog).
        Product.objects.get_or_create(
            slug='routeur-entreprise',
            defaults={
                'name': 'Routeur Entreprise',
                'name_en': 'Enterprise Router',
                'short_description': 'Routeur haute performance pour entreprises.',
                'short_description_en': 'High-performance router for businesses.',
                'description': 'Routeur haute performance pour les entreprises.',
                'description_en': 'High-performance router for enterprise networks.',
                'price': 245.50,
                'price_unit': 'FCFA/mois',
                'category': telecom,
                'stock': 30,
                'is_active': True,
                'is_published': True,
                'data_origin': Product.DataOrigin.DEMO,
            },
        )

        Product.objects.get_or_create(
            slug='abonnement-fibre',
            defaults={
                'name': 'Abonnement Fibre',
                'name_en': 'Fiber Subscription',
                'short_description': 'Accès internet fibre optique premium.',
                'short_description_en': 'Premium fiber optic internet access.',
                'description': 'Accès internet fibre optique premium.',
                'description_en': 'Premium fiber optic internet subscription.',
                'price': 120.00,
                'price_unit': 'FCFA/mois',
                'category': internet,
                'stock': 100,
                'is_active': True,
                'is_published': True,
                'data_origin': Product.DataOrigin.DEMO,
            },
        )

        Product.objects.get_or_create(
            slug='hebergement-cloud',
            defaults={
                'name': 'Hébergement Cloud',
                'name_en': 'Cloud Hosting',
                'short_description': 'Infrastructure cloud sécurisée.',
                'short_description_en': 'Secure cloud infrastructure.',
                'description': 'Infrastructure cloud sécurisée.',
                'description_en': 'Secure and scalable cloud hosting infrastructure.',
                'price': 399.99,
                'price_unit': 'FCFA/mois',
                'category': cloud,
                'stock': 25,
                'is_active': True,
                'is_published': True,
                'data_origin': Product.DataOrigin.DEMO,
            },
        )

        Promotion.objects.get_or_create(
            slug='promo-telecom',
            defaults={
                'title': 'Promo Telecom',
                'description': 'Réduction spéciale sur les équipements réseau.',
                'discount_percent': 15,
                'is_active': True,
            },
        )

        News.objects.get_or_create(
            slug='nouvelle-offre-camtel',
            defaults={
                'title': 'Nouvelle offre CAMTEL',
                'title_en': 'New CAMTEL Offer',
                'content': 'CAMTEL lance une nouvelle offre dédiée aux entreprises.',
                'content_en': 'CAMTEL launches a new offer dedicated to businesses.',
                'is_published': True,
            },
        )

        if connection.vendor == 'postgresql':
            self.stdout.write('Base PostgreSQL détectée — index full-text actifs.')

        self.stdout.write(self.style.SUCCESS('Données initiales CAMTEL créées avec succès.'))
        self.stdout.write('Comptes: superadmin/CamtelAdmin2026!, admin/admin123, editor/editor123')
