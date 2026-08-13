#!/usr/bin/env bash
# Restauration base PostgreSQL + médias
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <backup_sql_file> [media_tar_gz]"
  exit 1
fi

SQL_FILE="$1"
MEDIA_ARCHIVE="${2:-}"
DB_NAME="${DB_NAME:-camtel}"
DB_USER="${DB_USER:-camtel}"
DB_HOST="${DB_HOST:-localhost}"
MEDIA_DIR="${MEDIA_DIR:-./backend/media}"

echo "[restore] Restauration PostgreSQL depuis $SQL_FILE..."
PGPASSWORD="${DB_PASSWORD:-camtel}" psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" < "$SQL_FILE"

if [ -n "$MEDIA_ARCHIVE" ] && [ -f "$MEDIA_ARCHIVE" ]; then
  echo "[restore] Restauration médias..."
  tar -xzf "$MEDIA_ARCHIVE" -C "$(dirname "$MEDIA_DIR")"
fi

echo "[restore] Terminé."
