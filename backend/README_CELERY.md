Celery & SMTP local run instructions
===================================

Prerequisites
 - Either Docker (optional) or just Python for local SMTP debug + eager Celery

Local smoke-test without Docker (recommended when Docker is not available)

1) Start a local SMTP debug server (prints emails to the terminal):

```powershell
# Python 3.x
python -m smtpd -n -c DebuggingServer localhost:1025
```

2) Run the test email, executing tasks eagerly (no Redis required):

```powershell
# In PowerShell (repo root)
$env:CELERY_TASK_ALWAYS_EAGER='True'
$env:EMAIL_PROVIDER='smtp'
$env:EMAIL_HOST='localhost'
$env:EMAIL_PORT='1025'

cd backend
python manage.py send_test_email --to you@example.com
```

You should see the email printed in the SMTP server terminal.

Optional: If you have Redis locally and prefer to test the real async path, follow the Docker section below.

Docker quick reference (optional)

```bash
docker run -d --name oneportal-redis -p 6379:6379 redis:7
docker run -d --name oneportal-mailhog -p 8025:8025 -p 1025:1025 mailhog/mailhog

export USE_CELERY=True
export CELERY_BROKER_URL=redis://localhost:6379/0
export EMAIL_PROVIDER=smtp
export EMAIL_HOST=localhost
export EMAIL_PORT=1025

celery -A config worker -l info
python manage.py send_test_email --to you@example.com
```

CI / Docker Compose helper
--------------------------

We include a small Docker Compose file for CI or local smoke-tests (MailHog + Redis + a worker):

```
docker/mailhog-docker-compose.yml
```

To run the smoke-test using the provided compose and helper script:

```bash
./scripts/smoke_test_mailhog.sh
```

Notes:
- The script and compose file are intended for CI runners or developer machines where Docker is permitted.
- If you prefer not to use Docker locally, use the non-Docker instructions above (aiosmtpd + `CELERY_TASK_ALWAYS_EAGER=True`).


