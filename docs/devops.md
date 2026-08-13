# DevOps et déploiement CAMTEL OnePortal

## 1. Stack

| Composant | Technologie |
|---|---|
| Backend | Python 3.12, Gunicorn |
| Frontend | Vite → Nginx |
| Base | PostgreSQL 16 |
| Proxy | Nginx (port 8080) |
| CI/CD | GitHub Actions |

## 2. Développement local (Docker)

```bash
docker compose up --build
```

Services :
- **db** : PostgreSQL 16 (port 5432)
- **backend** : Django/Gunicorn (port 8000)
- **frontend** : Nginx statique
- **nginx** : Reverse proxy (port 8080)

Healthchecks configurés sur tous les services.

## 3. Staging

```bash
docker compose -f docker-compose.staging.yml up --build
```

- Port 8081
- `DJANGO_SETTINGS_MODULE=config.settings.prod`
- Logs JSON (`LOG_FORMAT=json`)
- DEBUG=False

## 4. Variables d'environnement

Copier `.env.example` → `.env`. Variables clés :

| Variable | Usage |
|---|---|
| `SECRET_KEY` | Clé Django (obligatoire en prod) |
| `DB_HOST` | Si défini → PostgreSQL, sinon SQLite |
| `LOG_FORMAT` | `json` ou `text` |
| `USE_S3_STORAGE` | Stockage objet en production |

## 5. CI/CD (GitHub Actions)

Fichiers :
- `.github/workflows/ci.yml` — tests SQLite + PostgreSQL + frontend
- `.github/workflows/deploy.yml` — tests PG + build Docker sur `main`

Jobs CI :
1. `backend-tests-sqlite`
2. `backend-tests-postgresql` (service container PG 16)
3. `frontend-tests` (build + vitest)

## 6. Production PostgreSQL

Le `docker-compose.yml` inclut PostgreSQL. Pour production externe :

```env
DB_HOST=postgres.production.internal
DB_NAME=camtel_prod
DB_USER=camtel_app
DB_PASSWORD=<secret>
DB_PORT=5432
```

Migration depuis SQLite :
1. `pg_dump` ou export fixtures
2. `python manage.py migrate` sur PostgreSQL
3. `python manage.py reset_pg_sequences`
4. Vérifier index full-text (migration auto)

## 7. Logs structurés

Configuration dans `config/settings/base.py` :

```python
LOG_FORMAT=json  # via variable d'environnement
```

Utilise `python-json-logger` pour le format JSON en production.

## 8. Monitoring

Healthcheck avancé : `GET /api/v1/health/`

```json
{
  "status": "ok",
  "database": "ok",
  "storage": "ok",
  "version": "1.0.0"
}
```

Retourne HTTP 503 si DB ou storage indisponible.

Alerting basique : surveiller ce endpoint (uptime monitor, Docker healthcheck).

## 9. Sauvegarde automatisée

Scripts :
- `scripts/backup.sh` — dump PostgreSQL + archive médias
- `scripts/restore.sh` — restauration

Exemple cron :

```bash
0 2 * * * BACKUP_DIR=/var/backups/camtel ./scripts/backup.sh
```

Voir [disaster-recovery.md](disaster-recovery.md) pour RTO/RPO.

## 10. Stockage S3

Production (`config/settings/prod.py`) :

```env
USE_S3_STORAGE=True
AWS_STORAGE_BUCKET_NAME=camtel-media
AWS_S3_ENDPOINT_URL=https://minio.example.com
```

Compatible MinIO, AWS S3, et autres backends S3.

## 11. Sécurité production

Configuré dans `prod.py` :
- `SECURE_SSL_REDIRECT`
- HSTS (31536000s)
- Cookies sécurisés
- CORS restreint (configurer via env)

## 12. Déploiement

1. Merger sur `main` → CI déclenchée
2. Build images : `docker compose build`
3. Déployer avec `docker-compose.staging.yml` ou orchestrateur (K8s)
4. Vérifier healthcheck post-déploiement

Placeholder deploy dans `deploy.yml` — remplacer par SSH/kubectl selon l'infra cible.
