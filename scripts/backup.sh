#!/usr/bin/env bash
# Sauvegarde automatisée base PostgreSQL + médias
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
DB_NAME="${DB_NAME:-camtel}"
DB_USER="${DB_USER:-camtel}"
DB_HOST="${DB_HOST:-localhost}"
MEDIA_DIR="${MEDIA_DIR:-./backend/media}"

mkdir -p "$BACKUP_DIR"

echo "[backup] Dump PostgreSQL..."
PGPASSWORD="${DB_PASSWORD:-camtel}" pg_dump -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" \
  > "$BACKUP_DIR/db_${TIMESTAMP}.sql"

if [ -d "$MEDIA_DIR" ]; then
  echo "[backup] Archive médias..."
  tar -czf "$BACKUP_DIR/media_${TIMESTAMP}.tar.gz" -C "$(dirname "$MEDIA_DIR")" "$(basename "$MEDIA_DIR")"
fi

echo "[backup] Terminé : $BACKUP_DIR/db_${TIMESTAMP}.sql"
