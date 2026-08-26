# Plan de reprise après incident (DR)

## Objectifs

| Métrique | Cible | Description |
|---|---|---|
| **RTO** (Recovery Time Objective) | 4 heures | Délai max de remise en service |
| **RPO** (Recovery Point Objective) | 24 heures | Perte de données max acceptable |

## Composants critiques

1. Base PostgreSQL (données métier)
2. Fichiers médias (images produits, actualités)
3. Configuration secrets (SECRET_KEY, clés S3)
4. Images Docker (backend, frontend, nginx)

## Sauvegarde automatisée

Script : `scripts/backup.sh`

```bash
# Cron quotidien (exemple 2h du matin)
0 2 * * * BACKUP_DIR=/var/backups/camtel DB_PASSWORD=xxx ./scripts/backup.sh
```

Produit :
- `backups/db_YYYYMMDD_HHMMSS.sql`
- `backups/media_YYYYMMDD_HHMMSS.tar.gz`

Conserver 30 jours minimum (rotation externe recommandée).

## Procédure de restauration

1. Arrêter les services : `docker compose down`
2. Restaurer PostgreSQL :
   ```bash
   ./scripts/restore.sh backups/db_20260812_020000.sql backups/media_20260812_020000.tar.gz
   ```
3. Réinitialiser les séquences :
   ```bash
   cd backend && python manage.py reset_pg_sequences
   ```
4. Redémarrer : `docker compose up -d`
5. Vérifier : `curl http://localhost:8080/api/v1/health/`

## Scénarios

### Panne base de données

- Basculer sur la dernière sauvegarde SQL
- RPO effectif = age de la dernière sauvegarde

### Perte médias S3

- Restaurer depuis archive tar.gz ou réplication S3 cross-region

### Compromission clé API partenaire

- Désactiver la clé dans Django Admin
- Générer une nouvelle clé : `python manage.py create_partner_key`

## Contacts et escalade

| Rôle | Action |
|---|---|
| DevOps | Restauration infra, Docker, PostgreSQL |
| Backend | Validation API post-restauration |
| Product Owner | Communication utilisateurs |

## Tests de reprise

Effectuer un test de restauration trimestriel sur l'environnement staging (`docker-compose.staging.yml`).
