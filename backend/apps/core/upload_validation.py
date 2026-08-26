"""Validation de contenu des fichiers uploades (PHASE Securite).

Objectif : ne jamais faire confiance a l'extension fournie par le client
(section 53 de la mission — "Ne jamais faire confiance a l'extension fournie
par l'utilisateur"). Chaque format autorise est verifie par sa signature
binaire reelle (magic bytes) et, pour les images, par un decodage Pillow
complet — pas seulement par le nom de fichier.

Pas d'antivirus ici : un vrai scan antivirus (ClamAV ou equivalent) demande
une infrastructure dediee non disponible dans cet environnement de
developpement. C'est documente comme limite assumee (voir SECURITY_AUDIT.md)
et reste a brancher quand l'infrastructure sera disponible.
"""

from __future__ import annotations

import os
import zipfile

from django.core.exceptions import ValidationError

try:
    from PIL import Image
except ImportError:  # pragma: no cover - Pillow est une dependance du projet
    Image = None

# Extensions autorisees par defaut. Le SVG est volontairement exclu : c'est
# un format XML pouvant embarquer du JavaScript (<script>, gestionnaires
# on*), un vecteur de XSS stocke classique si le fichier est resservi tel
# quel. Le reintroduire suppose une sanitisation dediee (ex: bleach/svg-sanitizer),
# non presente dans les dependances actuelles.
DEFAULT_ALLOWED_EXTENSIONS = {
    '.jpg', '.jpeg', '.png', '.gif', '.webp',
    '.pdf', '.doc', '.docx', '.xls', '.xlsx',
}

_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
_LEGACY_OFFICE_EXTENSIONS = {'.doc', '.xls'}  # format OLE2 (CFBF)
_OOXML_EXTENSIONS = {'.docx', '.xlsx'}  # zip + structure interne

_PDF_MAGIC = b'%PDF-'
_OLE2_MAGIC = b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1'
_ZIP_MAGIC = b'PK\x03\x04'

_OOXML_INTERNAL_MARKERS = {
    '.docx': ('word/',),
    '.xlsx': ('xl/',),
}


def _read_head(file_obj, n: int = 8) -> bytes:
    pos = file_obj.tell()
    file_obj.seek(0)
    head = file_obj.read(n)
    file_obj.seek(pos)
    return head


def validate_upload_content(value, allowed_extensions: set[str] | None = None) -> None:
    """Verifie qu'un fichier uploade correspond reellement a son extension
    declaree, en inspectant son contenu binaire (pas seulement son nom).

    Leve une django.core.exceptions.ValidationError si le contenu ne
    correspond pas au format attendu, ou si l'extension n'est pas autorisee.
    """
    if value is None:
        return

    allowed = allowed_extensions if allowed_extensions is not None else DEFAULT_ALLOWED_EXTENSIONS
    extension = os.path.splitext(value.name)[1].lower()
    if extension not in allowed:
        raise ValidationError(f"Format de fichier non autorisé : '{extension}'.")

    if extension in _IMAGE_EXTENSIONS:
        if Image is None:  # pragma: no cover
            return
        try:
            value.seek(0)
            with Image.open(value) as img:
                img.verify()
            value.seek(0)
        except Exception as exc:  # noqa: BLE001 - toute erreur = fichier invalide
            raise ValidationError(
                "Le contenu du fichier ne correspond pas a une image valide."
            ) from exc
        return

    if extension == '.pdf':
        head = _read_head(value, len(_PDF_MAGIC))
        if head != _PDF_MAGIC:
            raise ValidationError("Le contenu du fichier ne correspond pas a un PDF valide.")
        return

    if extension in _LEGACY_OFFICE_EXTENSIONS:
        head = _read_head(value, len(_OLE2_MAGIC))
        if head != _OLE2_MAGIC:
            raise ValidationError(
                "Le contenu du fichier ne correspond pas a un document Office valide."
            )
        return

    if extension in _OOXML_EXTENSIONS:
        head = _read_head(value, len(_ZIP_MAGIC))
        if head != _ZIP_MAGIC:
            raise ValidationError(
                "Le contenu du fichier ne correspond pas a un document Office valide."
            )
        markers = _OOXML_INTERNAL_MARKERS.get(extension, ())
        try:
            value.seek(0)
            with zipfile.ZipFile(value) as archive:
                names = archive.namelist()
            value.seek(0)
        except zipfile.BadZipFile as exc:
            raise ValidationError(
                "Le contenu du fichier ne correspond pas a un document Office valide."
            ) from exc
        if markers and not any(name.startswith(m) for m in markers for name in names):
            raise ValidationError(
                "Le contenu du fichier ne correspond pas a un document Office valide."
            )
        return
