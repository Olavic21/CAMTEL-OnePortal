# CAMTEL-OnePortal

Plateforme backend Django/DRF pour la gestion des contenus, produits, promotions, médias et flux d’information CAMTEL.

## 1. Vue d’ensemble

Ce projet contient une base backend fonctionnelle pour :

- gestion des catégories
- gestion des produits et FAQ
- gestion des actualités
- gestion des promotions
- gestion des médias
- formulaire de contact
- journal d’activité
- authentification JWT
- documentation Swagger/OpenAPI
- seeding des données initiales

## 2. Stack technique

- Python 3.12+
- Django 6.0.7
- Django REST Framework
- JWT (`djangorestframework-simplejwt`)
- SQLite pour le développement local
- Swagger / OpenAPI via `drf-spectacular`
- CORS support

## 3. Structure du projet

```text
CAMTEL-OnePortal/
├── backend/
│   ├── apps/
│   │   ├── categories/
│   │   ├── products/
│   │   ├── news/
│   │   ├── promotions/
│   │   ├── media/
│   │   ├── contacts/
│   │   ├── core/
│   │   └── users/
│   ├── config/
│   ├── manage.py
│   ├── db.sqlite3
│   └── requirements.txt
├── docs/
│   ├── roadmap.md
│   ├── backend-setup.md
│   └── devops.md
├── .gitignore
├── README.md
└── .venv/
```

## 4. Démarrage rapide

### Créer l’environnement virtuel

```bash
python -m venv .venv
```

### Activer l’environnement

PowerShell :

```powershell
.\.venv\Scripts\Activate.ps1
```

### Installer les dépendances

```bash
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers drf-spectacular pillow
```

### Migrer et lancer le backend

```bash
cd backend
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

### Accès API

- API racine : `http://127.0.0.1:8000/api/`
- Swagger : `http://127.0.0.1:8000/api/docs/`
- JWT token : `http://127.0.0.1:8000/api/token/`

## 5. Données de base

Le backend inclut une commande de seeding :

```bash
python manage.py seed_data
```

Elle initialise :

- utilisateurs admin/editor
- catégories principales
- produits de démonstration
- promotions
- actualités

## 6. Tests

```bash
python manage.py test apps.products apps.core --verbosity 2
```

## 7. Documentation

- [docs/roadmap.md](docs/roadmap.md)
- [docs/backend-setup.md](docs/backend-setup.md)
- [docs/devops.md](docs/devops.md)

## 8. Prochaines étapes DevOps

À compléter pour la mise en production :

- Dockerfile backend
- docker-compose
- CI/CD GitHub Actions
- PostgreSQL de production
- backup et restauration
- monitoring et santé des services
- HTTPS/HSTS
- stockage objet S3

## 9. Statut actuel

Le backend est fonctionnel localement, avec données initiales, modèles de base, API DRF, documentation OpenAPI et validation des tests effectués.
