#!/usr/bin/env bash
set -euo pipefail

# Docker-based smoke test: start mailhog + redis, run a celery worker, enqueue a test email
# Usage: ./scripts/smoke_test_mailhog.sh

COMPOSE_FILE=docker/mailhog-docker-compose.yml

echo "Starting MailHog+Redis via docker-compose..."
docker compose -f "$COMPOSE_FILE" up -d redis mailhog

echo "Waiting for MailHog HTTP UI to become available..."
for i in {1..20}; do
  if curl -sS http://localhost:8025 >/dev/null 2>&1; then
    break
  fi
  sleep 1
done

echo "Enqueueing test email via Django management command"
docker compose -f "$COMPOSE_FILE" run --rm worker bash -lc "cd /app/backend && CELERY_BROKER_URL=redis://redis:6379/0 CELERY_RESULT_BACKEND=redis://redis:6379/0 USE_CELERY=True EMAIL_PROVIDER=smtp EMAIL_HOST=mailhog EMAIL_PORT=1025 python manage.py send_test_email --to smoke@example.com"

echo "Checking MailHog for messages..."
TOTAL=$(curl -sS http://localhost:8025/api/v2/messages | jq '.total')
echo "MailHog total messages: $TOTAL"
if [ "$TOTAL" -eq 0 ]; then
  echo "Smoke test failed: no messages in MailHog" >&2
  exit 2
fi

echo "Smoke test succeeded: $TOTAL message(s) found in MailHog"
