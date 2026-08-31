# data/incoming/ — Dépôt des fichiers source officiels

Déposez ici les fichiers PDF du catalogue officiel CAMTEL à importer.

Pipeline d'import (documenté dans le README, section
« Import depuis un nouveau PDF officiel ») :

```powershell
# 1. Extraction texte + images (depuis la racine du projet)
python scripts/extract_official_pdf.py data/incoming/<votre-fichier>.pdf

# 2. Construction du snapshot + validation + chargement
python manage.py seed_camtel_data --snapshot <date>
python manage.py validate_camtel_data

# 3. Rattachement des images aux produits
python manage.py attach_official_images
```

Le script extrait :
- le TEXTE page par page -> `data/camtel_catalog/pdf-extracts/`
- les IMAGES (>= 64 px, icones filtrees) -> `backend/media/products/pdf-import/`

Regle #52 : seules les valeurs lues dans le PDF alimentent le catalogue ;
les champs manquants restent marques `REQUIRES_VALIDATION` (jamais inventes).