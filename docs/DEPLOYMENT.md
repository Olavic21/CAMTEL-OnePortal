# DEPLOYMENT.md — Déploiement

## Prérequis (production/staging)
- `SECRET_KEY` : valeur forte, obligatoire (application refuse de démarrer sinon).
- `DEBUG=False`, `DJANGO_SETTINGS_MODULE=config.settings.prod`.
- `ALLOWED_HOSTS` la liste réelle.
- `DB_*` : PostgreSQL (user/mdp/host/port), `DB_PASSWORD` jamais en dur.
- `SEED_DEMO_DATA=false` (défaut) — jamais de seed auto.
- HTTPS/TLS (reverse proxy Nginx) + `SECURE_SSL_REDIRECT`/HSTS.
- Médias : local (`MEDIA_ROOT`) ou S3-compatible (`USE_S3_STORAGE=True` + creds via env).

## Développement local (compose)
```bash
docker compose up --build
# http://localhost:8080 (nginx)
```
Seed uniquement si `SEED_DEMO_DATA=true` (défaut en dev).

## Staging
```bash
# Variables requises : SECRET_KEY, DB_PASSWORD (sinon le compose échoue)
$env:SECRET_KEY="<fort>" ; $env:DB_PASSWORD="<fort>"
docker compose -f docker-compose.staging.yml up --build
# http://localhost:8081
```

## Production
1. Configurer l'environnement (secrets, DB, ALLOWED_HOSTS, S3).
2. `python manage.py migrate`
3. Seed **volontaire** uniquement : `python manage.py seed_data` (si nécessaire en staging de démonstration — jamais en prod).
4. Serveur : `gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers N` (via conteneur).
5. Vérifier `GET /api/v1/health/` (200), `GET /api/v1/ready/` (à ajouter) et le Swagger `/api/docs/`.

## Sécurité de déploiement
- Healthcheck Docker configurés.
- Logs JSON (`LOG_FORMAT=json`), niveau via `LOG_LEVEL`.
- Nginx : reverse proxy + (à durcir : CSP, X-Frame-Options, referrer-policy).
- Sauvegarde : `scripts/backup.sh` / restauration `scripts/restore.sh` (voir `docs/disaster-recovery.md`).