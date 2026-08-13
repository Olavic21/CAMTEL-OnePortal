from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from io import BytesIO
from rest_framework import generics, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.core.permissions import IsAdminUser, ReadPublicWriteAdminOrEditor

from .models import Product, ProductFAQ, ProductImage
from .serializers import (
    ProductCompareSerializer,
    ProductFAQSerializer,
    ProductImageSerializer,
    ProductSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.all().select_related('category').prefetch_related('images', 'faqs')
    serializer_class = ProductSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]
    lookup_field = 'slug'
    lookup_value_regex = '[^/]+'

    def get_permissions(self):
        # RBAC fin cote serveur (matrice section 9.2) : la publication et la
        # suppression d'un produit sont reservees aux Admin / Super Admin.
        # Les Editeurs et Gestionnaires Produits peuvent creer et modifier
        # (brouillons) mais ni publier ni supprimer.
        if self.action in {'publish', 'destroy'}:
            return [IsAdminUser()]
        return super().get_permissions()

    def get_object(self):
        lookup = self.kwargs.get(self.lookup_url_kwarg or self.lookup_field)
        if lookup.isdigit():
            return get_object_or_404(self.get_queryset(), pk=lookup)
        return get_object_or_404(self.get_queryset(), slug=lookup)

    def get_queryset(self):
        queryset = super().get_queryset()
        from django.db.models import Q
        from apps.core.i18n import get_request_language
        params = self.request.query_params
        # Recherche — le frontend envoie `search`, l'API partner `q` : on gere les deux.
        query = params.get('search') or params.get('q')
        if query:
            lang = get_request_language(self.request)
            if lang == 'en':
                queryset = queryset.filter(
                    Q(name_en__icontains=query) |
                    Q(name__icontains=query) |
                    Q(description_en__icontains=query) |
                    Q(description__icontains=query) |
                    Q(category__name_en__icontains=query) |
                    Q(category__name__icontains=query)
                )
            else:
                queryset = queryset.filter(
                    Q(name__icontains=query) |
                    Q(description__icontains=query) |
                    Q(category__name__icontains=query)
                )
        # Filtre par categorie (slug)
        category = params.get('category')
        if category:
            queryset = queryset.filter(category__slug=category)
        # Filtre par segment commercial (via la categorie)
        segment = params.get('segment')
        if segment:
            queryset = queryset.filter(category__segment=segment)
        # Tri (valeurs en liste blanche pour eviter toute injection d'ordre)
        ordering = params.get('ordering')
        allowed_ordering = {
            'price', '-price', 'created_at', '-created_at',
            'views_count', '-views_count', 'name', '-name',
        }
        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)
        return queryset

    @action(detail=False, methods=['get'], url_path='compare')
    def compare(self, request):
        ids_param = request.query_params.get('ids', '')
        id_list = []
        for token in ids_param.split(','):
            token = token.strip()
            if token.isdigit():
                id_list.append(int(token))
        id_list = id_list[:3]
        if not id_list:
            return Response({'detail': 'Fournir ids=1,2,3 (max 3 produits).'}, status=status.HTTP_400_BAD_REQUEST)
        products = (
            self.get_queryset()
            .filter(id__in=id_list, is_published=True)
            .select_related('category')
            .prefetch_related('faqs')
        )
        ordered = sorted(products, key=lambda p: id_list.index(p.id))
        return Response(ProductCompareSerializer(ordered, many=True, context={'request': request}).data)

    @action(detail=True, methods=['get'], url_path='export-pdf')
    def export_pdf(self, request, slug=None):
        product = self.get_object()
        try:
            from reportlab.lib.pagesizes import A4
            from reportlab.pdfgen import canvas
        except ImportError:
            return Response({'detail': 'reportlab non installé.'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

        buffer = BytesIO()
        pdf = canvas.Canvas(buffer, pagesize=A4)
        pdf.setTitle(product.name)
        y = 800
        pdf.drawString(50, y, f'Fiche produit: {product.name}')
        y -= 30
        pdf.drawString(50, y, f'Prix: {product.price} FCFA')
        y -= 30
        pdf.drawString(50, y, f'Catégorie: {product.category.name}')
        y -= 30
        for line in product.description.split('\n')[:20]:
            pdf.drawString(50, y, line[:90])
            y -= 20
        pdf.showPage()
        pdf.save()
        buffer.seek(0)
        response = HttpResponse(buffer.getvalue(), content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{product.slug}.pdf"'
        return response

    @action(detail=True, methods=['post'])
    def publish(self, request, slug=None):
        product = self.get_object()
        product.is_published = True
        product.save(update_fields=['is_published', 'updated_at'])
        return Response(ProductSerializer(product, context={'request': request}).data)

    @action(detail=True, methods=['get'])
    def stats(self, request, slug=None):
        product = self.get_object()
        product.views_count += 1
        product.save(update_fields=['views_count', 'updated_at'])
        return Response({
            'id': product.id,
            'name': product.name,
            'views_count': product.views_count,
        })

    @action(detail=False, methods=['get'])
    def dashboard(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        return Response({
            'total_products': queryset.count(),
            'active_products': queryset.filter(is_active=True).count(),
            'published_products': queryset.filter(is_published=True).count(),
            'top_products': ProductSerializer(
                queryset.order_by('-views_count')[:5],
                many=True,
                context={'request': request},
            ).data,
        })

    @action(detail=True, methods=['get', 'post'], url_path='faqs')
    def faqs(self, request, slug=None):
        product = self.get_object()
        if request.method == 'GET':
            faqs = product.faqs.all()
            return Response(ProductFAQSerializer(faqs, many=True).data)
        serializer = ProductFAQSerializer(data={**request.data, 'product': product.id})
        serializer.is_valid(raise_exception=True)
        serializer.save(product=product)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ProductFAQViewSet(viewsets.ModelViewSet):
    queryset = ProductFAQ.objects.select_related('product').all()
    serializer_class = ProductFAQSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]

    def get_queryset(self):
        queryset = super().get_queryset()
        product_id = self.request.query_params.get('product')
        if product_id:
            queryset = queryset.filter(product_id=product_id)
        return queryset


# Sous-ressource images : /products/<product_id>/images/ (creation + liste) et
# /products/<product_id>/images/<id>/ (detail). Permet l'upload d'une image de
# couverture et la gestion de la galerie depuis l'interface d'administration.
class ProductImageListCreateView(generics.ListCreateAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]

    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_id']).order_by('order', 'created_at')

    def get_product(self):
        return get_object_or_404(Product, pk=self.kwargs['product_id'])

    def perform_create(self, serializer):
        product = self.get_product()
        existing = product.images.count()
        serializer.save(
            product=product,
            order=existing + 1,
            is_primary=existing == 0,
        )


class ProductImageDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductImageSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]
    queryset = ProductImage.objects.all()

    def get_queryset(self):
        return ProductImage.objects.filter(product_id=self.kwargs['product_id'])
