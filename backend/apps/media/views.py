from rest_framework import viewsets

from apps.core.permissions import IsAdminOrEditor, IsAdminUser

from .models import MediaFile
from .serializers import MediaFileSerializer


class MediaFileViewSet(viewsets.ModelViewSet):
    queryset = MediaFile.objects.all()
    serializer_class = MediaFileSerializer
    permission_classes = [IsAdminOrEditor]

    def get_permissions(self):
        # Upload / consultation : staff (Editor+). Suppression : Admin
        # uniquement (coherence avec la matrice frontend delete_media).
        if self.action == 'destroy':
            return [IsAdminUser()]
        return [IsAdminOrEditor()]

    def perform_create(self, serializer):
        serializer.save(uploaded_by=self.request.user)