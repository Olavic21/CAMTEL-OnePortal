from rest_framework import viewsets

from apps.core.permissions import ReadPublicWriteAdminOrEditor

from .models import MediaFile
from .serializers import MediaFileSerializer


class MediaFileViewSet(viewsets.ModelViewSet):
    queryset = MediaFile.objects.all()
    serializer_class = MediaFileSerializer
    permission_classes = [ReadPublicWriteAdminOrEditor]
