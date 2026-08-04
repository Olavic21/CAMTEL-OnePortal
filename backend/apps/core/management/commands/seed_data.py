from django.core.management.base import BaseCommand

from apps.categories.models import Category
from apps.products.models import Product
from apps.promotions.models import Promotion
from apps.news.models import News
from apps.users.models import User


class Command(BaseCommand):
    help = 'Seed the database with initial CAMTEL data.'

    def handle(self, *args, **options):
        self.stdout.write('Création des données initiales CAMTEL...')

        User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@camtel.cm',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )

        User.objects.get_or_create(
            username='editor',
            defaults={
                'email': 'editor@camtel.cm',
                'role': User.Role.EDITOR,
                'is_staff': True,
            },
        )

        telecom, _ = Category.objects.get_or_create(
            slug='telecom',
            defaults={'name': 'Télécom', 'description': 'Solutions de télécommunication'}
        )
        internet, _ = Category.objects.get_or_create(
            slug='internet',
            defaults={'name': 'Internet', 'description': 'Accès internet et fibre'}
        )
        cloud, _ = Category.objects.get_or_create(
            slug='cloud',
            defaults={'name': 'Cloud', 'description': 'Services cloud et datacenter'}
        )

        Product.objects.get_or_create(
            slug='routeur-entreprise',
            defaults={
                'name': 'Routeur Entreprise',
                'description': 'Routeur haute performance pour les entreprises.',
                'price': 245.50,
                'category': telecom,
                'stock': 30,
                'is_active': True,
                'is_published': True,
            },
        )

        Product.objects.get_or_create(
            slug='abonnement-fibre',
            defaults={
                'name': 'Abonnement Fibre',
                'description': 'Accès internet fibre optique premium.',
                'price': 120.00,
                'category': internet,
                'stock': 100,
                'is_active': True,
                'is_published': True,
            },
        )

        Product.objects.get_or_create(
            slug='hebergement-cloud',
            defaults={
                'name': 'Hébergement Cloud',
                'description': 'Infrastructure cloud sécurisée.',
                'price': 399.99,
                'category': cloud,
                'stock': 25,
                'is_active': True,
                'is_published': True,
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
                'content': 'CAMTEL lance une nouvelle offre dédiée aux entreprises.',
                'is_published': True,
            },
        )

        self.stdout.write(self.style.SUCCESS('Données initiales CAMTEL créées avec succès.'))
