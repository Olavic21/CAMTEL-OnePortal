# Guide de démarrage backend CAMTEL OnePortal

## 1. Prérequis

- Python 3.12+
- Git
- Virtualenv ou venv
- SQLite pour le développement local
- navigateur ou outil API tel que Postman/Insomnia

## 2. Cloner le projet

```bash
git clone <url-du-repo>
cd CAMTEL-OnePortal
```

## 3. Créer l’environnement virtuel

```bash
python -m venv .venv
```

Sous Windows PowerShell :

```powershell
.\.venv\Scripts\Activate.ps1
```

## 4. Installer les dépendances

```bash
pip install -r requirements.txt
```

Si le projet n’a pas encore de `requirements.txt`, installer au minimum :

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers drf-spectacular pillow
```

## 5. Lancer le backend

Depuis le dossier backend :

```bash
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

L’API sera disponible sur :

- `http://127.0.0.1:8000/api/`
- `http://127.0.0.1:8000/api/docs/`
- `http://127.0.0.1:8000/api/schema/`

## 6. Authentification JWT

Les endpoints suivants sont disponibles :

```bash
/api/token/
/api/token/refresh/
```

## 7. Structure backend

```text
backend/
├── apps/
│   ├── categories/
│   ├── products/
│   ├── news/
│   ├── promotions/
│   ├── media/
│   ├── contacts/
│   ├── core/
│   └── users/
├── config/
│   ├── settings/
│   ├── urls.py
│   ├── asgi.py
│   └── wsgi.py
├── db.sqlite3
├── manage.py
└── requirements.txt
```

## 8. Données initiales

La commande :

```bash
python manage.py seed_data
```

crée les éléments de base suivants :

- utilisateurs admin/editor
- catégories télécom, internet et cloud
- produits initiaux
- promotions
- actualités

## 9. Tests backend

```bash
python manage.py test apps.products apps.core --verbosity 2
```

## 10. Problèmes connus / points d’attention

- Le projet utilise `apps.*` comme namespace Django.
- Les dépendances backend doivent être installées dans l’environnement virtuel du projet.
- Les migrations sont à relancer si de nouveaux modèles sont ajoutés.
