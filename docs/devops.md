# DevOps et déploiement CAMTEL OnePortal

## 1. Objectif

Cette documentation décrit les étapes de base DevOps nécessaires pour faire passer le projet de l’environnement local vers l’environnement de recette et de production.

## 2. Environnement de développement

### Stack actuelle

- Python + Django
- Django REST Framework
- SQLite pour le développement local
- JWT pour l’authentification API
- Swagger/OpenAPI via `drf-spectacular`

### Commandes de base

```bash
python -m venv .venv
source .venv/bin/activate   # Linux/macOS
.\.venv\Scripts\Activate.ps1  # Windows PowerShell
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

## 3. Variables d’environnement

Créer un fichier `.env` localement avec des valeurs adaptées.

Exemple :

```env
DJANGO_SETTINGS_MODULE=config.settings.dev
DEBUG=True
SECRET_KEY=change-me
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=sqlite:///db.sqlite3
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

## 4. Conteneurisation

### Dockerfile backend

À ajouter plus tard :

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]
```

### docker-compose

À ajouter plus tard :

```yaml
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DJANGO_SETTINGS_MODULE: config.settings.dev
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: camtel
      POSTGRES_USER: camtel
      POSTGRES_PASSWORD: camtel
```

## 5. CI/CD

Le pipeline doit au minimum inclure :

- installation des dépendances
- vérification du lint
- exécution des tests Django
- build des images Docker
- déploiement automatique sur branche `main`

### Exemple GitHub Actions structure

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r backend/requirements.txt
      - run: cd backend && python manage.py test
```

## 6. Production

Pour la production, il faudra :

- passer sur PostgreSQL
- sécuriser le `SECRET_KEY`
- définir `DEBUG=False`
- mettre `ALLOWED_HOSTS` à jour
- configurer HTTPS / HSTS
- mettre en place les healthchecks
- stocker les médias sur un storage compatible S3

## 7. Sauvegarde et restauration

### Sauvegarde base de données

```bash
pg_dump -U camtel -d camtel > backup.sql
```

### Restauration

```bash
psql -U camtel -d camtel < backup.sql
```

### Sauvegarde des médias

- copier les dossiers de médias vers un stockage objet ou un disque externe
- conserver la version et la date des sauvegardes

## 8. Monitoring

À mettre en place progressivement :

- healthcheck API
- logs structurés JSON
- alerting sur erreurs 5xx
- suivi disque/espace de stockage
- monitoring du temps de réponse API

## 9. Sécurité

- ne jamais exposer le `SECRET_KEY` en clair
- utiliser des variables d’environnement
- activer HTTPS en production
- limiter l’accès aux endpoints sensibles
- servir les fichiers statiques via un reverse proxy ou CDN

## 10. Plan de progression recommandé

1. Ajouter un `requirements.txt` propre.
2. Ajouter `.env.example`.
3. Ajouter Dockerfile + docker-compose.
4. Brancher la CI GitHub Actions.
5. Préparer PostgreSQL en production.
6. Ajouter monitoring et sauvegarde automatique.

## 11. Statut actuel

Le backend est fonctionnel en local, avec modèles, API, JWT et seeding de données initiales validés. Les sections DevOps restent à compléter pour la mise en production.
