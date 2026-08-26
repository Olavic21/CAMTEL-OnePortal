# SECURITY.md — Policy and Authentication Architecture

## Core Principles

1. **No secrets in version control**: All secrets via environment variables. `.env.example` contains only placeholders.
2. **`SECRET_KEY` required in production**: `config.settings.prod` refuses to start if missing or placeholder.
3. **Demo data prohibited in production**: `SEED_DEMO_DATA` defaults false in prod; `seed_data` command refuses outside DEBUG=True.
4. **Server-side authorization required**: Permissions checked server-side (frontend checks are UX only). See `docs/RBAC.md`.

## Authentication & JWT (SimpleJWT 5.5.1)

### Access Token Lifecycle
- **Lifetime**: 30 minutes (configurable via `JWT_ACCESS_LIFETIME_MINUTES`)
- **Storage**: Memory/localStorage (frontend)
- **Transmission**: Authorization header (`Authorization: Bearer <token>`)
- **Purpose**: Stateless request authentication (no database lookup per request)
- **Expiry**: On expiry, frontend redirects to refresh endpoint

### Refresh Token Lifecycle (CRITICAL for security)

#### Token Issuance (Login)
1. User POSTs credentials to `/api/v1/auth/login/`
2. Backend verifies credentials via Django ORM (User model)
3. Backend generates:
   - **Access token**: Signed JWT, 30min validity, sent in response body
   - **Refresh token**: Signed JWT, 7-day validity, sent in `HttpOnly` cookie only (never in response body)
4. Frontend stores:
   - Access token → localStorage/memory
   - Refresh token → Automatic (cookie handled by browser, HttpOnly prevents JS access)

#### Token Refresh (Automatic)
1. Access token expires (30 min)
2. Frontend automatically POSTs to `/api/v1/auth/refresh/`
3. Backend validates old refresh token (not blacklisted, still valid)
4. Backend issues:
   - New access token
   - **New refresh token** (stored in HttpOnly cookie)
   - Old refresh token added to `token_blacklist` table (can never be used again)

#### Token Revocation (Logout) — MOST CRITICAL

**Backend-side invalidation** (database):
1. User clicks "Logout"
2. Frontend POSTs to `/api/v1/auth/logout/` with current tokens
3. Backend finds refresh token in `TokenBlacklist` or `OutstandingToken` and marks as revoked
4. Backend clears refresh cookie by setting `Set-Cookie: <name>=; Max-Age=0; ...`
5. **Refresh token cannot be reused** even if frontend keeps old cookie

**Frontend-side cleanup** (user-visible):
1. Access token cleared from localStorage/memory
2. User redirected to login page
3. Session state cleared (Redux/Context store reset)
4. Even if browser has old refresh cookie, refresh attempt fails (server-side revocation)

### Why Refresh Token Rotation?

With `REFRESH_TOKEN_ROTATE=True` + `BLACKLIST_AFTER_ROTATION=True`:

1. **Prevents token theft**
   - Stolen refresh token valid only until next refresh cycle (7 days max)
   - Each use invalidates previous token
   - Attacker cannot indefinitely use old stolen token

2. **Detects token theft**
   - If backend sees old blacklisted token, can flag account as compromised
   - (Optional: implement extra monitoring/alerts)

3. **Limits window of exposure**
   - Token leaked during transmission? Automatically invalidated on next refresh.
   - Token left in browser cache? Window limited to 7 days.

### Cookie Security Settings

```
REFRESH_COOKIE_SECURE=True       # Only sent over HTTPS (production requirement)
REFRESH_COOKIE_HTTP_ONLY=True    # Never accessible to JavaScript (XSS protection)
REFRESH_COOKIE_SAMESITE=Strict   # Only sent in same-site requests (CSRF protection)
REFRESH_COOKIE_PATH=/api/v1/auth/ # Only sent to auth endpoints
```

- **Secure flag**: Browser withholds cookie if not HTTPS (man-in-the-middle protection)
- **HttpOnly flag**: Malicious JavaScript cannot access cookie (XSS prevention)
- **SameSite=Strict**: Browser prevents CSRF attacks (cookie not sent cross-site)

## Logout Workflow Detailed

### Backend Logout Handler (`apps/users/views.py:LogoutView`)

```python
@action(detail=False, methods=['post'], permission_classes=[permissions.IsAuthenticated])
def logout(self, request):
    """
    Revoke refresh token and clear cookie.
    """
    # Extract refresh token from cookie or request
    refresh_token = request.COOKIES.get('camtel_refresh')
    
    if refresh_token:
        # Add to blacklist (prevents reuse)
        token = RefreshToken(refresh_token)
        token.blacklist()  # Adds to token_blacklist table
    
    # Clear cookie
    response = Response({'detail': 'Logged out'}, status=status.HTTP_200_OK)
    response.delete_cookie('camtel_refresh')  # Browser discards cookie
    return response
```

### Frontend Logout Workflow

```typescript
// 1. Call backend logout (revoke refresh token server-side)
await fetch('/api/v1/auth/logout/', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  credentials: 'include', // Send refresh cookie
});

// 2. Clear access token from memory/localStorage
localStorage.removeItem('access_token');

// 3. Clear Redux/Context state
dispatch(clearAuthState());

// 4. Redirect to login
navigate('/login');

// 5. Browser automatically discards refresh cookie (httpOnly + Max-Age=0)
```

## Rate Limiting

All rate limits are per-endpoint, checked by DRF throttling classes:

| Endpoint | Limit | Purpose |
|----------|-------|---------|
| `/auth/login/` | 5/min | Brute-force prevention |
| `/auth/register/` | 3/hour | Spam prevention |
| `/auth/refresh/` | 20/min | Token refresh DoS prevention |
| `/chatbot/ask/` | 30/min | LLM cost control |
| `/search/` | 120/min | Database query protection |
| `/contact/` | 5/hour | Form submission throttling |
| Partner API | 1000/hour | Per-API-key limit |

Limits are configurable via environment:
```
THROTTLE_ANON_RATE=60/min       # Anonymous users
THROTTLE_USER_RATE=600/min      # Authenticated users
THROTTLE_PARTNER_RATE=1000/hour # Partner API keys
```

## Seed Data Protection

Demo accounts (superadmin, admin, editor) are **ONLY created** if:
```
DEBUG=True AND (SEED_DEMO_DATA=True OR force flag)
```

Protection mechanisms:
1. **Opt-in**: `SEED_DEMO_DATA` defaults False in production
2. **Idempotent**: Running seed multiple times doesn't duplicate accounts
3. **Marked**: All demo accounts have `is_demo=True` (visible in admin/audits)
4. **Refused in prod**: `seed_data` command explicitly rejects execution outside DEBUG=True

## Pre-Deployment Security Checklist

```bash
# 1. Django security checks
python manage.py check --deploy

# 2. Environment variables
# ✓ DEBUG=False
# ✓ SECRET_KEY set to 50+ random characters
# ✓ ALLOWED_HOSTS restricted to actual domains only
# ✓ SECURE_SSL_REDIRECT=True (enforce HTTPS)
# ✓ SECURE_HSTS_SECONDS=31536000 (force HTTPS for 1 year)
# ✓ REFRESH_COOKIE_SECURE=True (HttpOnly cookies over HTTPS only)
# ✓ SESSION_COOKIE_SECURE=True + CSRF_COOKIE_SECURE=True

# 3. Database & secrets
# ✓ DATABASE_URL points to PostgreSQL (not SQLite)
# ✓ SEED_DEMO_DATA unset or False (no demo accounts in prod)
# ✓ No debug_toolbar, no prints of sensitive data

# 4. Dependencies & audits
pip audit  # Check for security vulnerabilities

# 5. Test suite
python manage.py test apps -v 2  # All tests must pass

# 6. Log review
# ✓ No secrets in application logs
# ✓ LOG_LEVEL appropriate (not DEBUG in prod)
```

## Attack Surface & Mitigations

### 1. Cross-Site Request Forgery (CSRF)

**Mitigation**:
- CSRF token in form submissions (Django middleware)
- SameSite=Strict on all cookies
- `X-CSRFToken` header validation for state-changing requests

### 2. Cross-Site Scripting (XSS)

**Mitigation**:
- HttpOnly cookies (refresh token inaccessible to JavaScript)
- Django template auto-escaping
- Content-Security-Policy headers (recommended)
- Frontend: sanitize user input before rendering

### 3. Authentication Bypass

**Mitigation**:
- JWT signature validation (SimpleJWT handles)
- Refresh token blacklist check (prevents replay)
- Access token expiry (30 min window)
- Rate limiting on login (5/min)

### 4. Token Theft

**Mitigation**:
- HTTPS only (Secure flag on cookies)
- HttpOnly cookies (malicious JS cannot steal)
- Token rotation (old tokens invalidated)
- Token blacklist (revoked tokens rejected)

### 5. Brute-Force Attacks

**Mitigation**:
- Login endpoint throttled (5/min per IP/user)
- Account lockout (future: implement via model field)
- Strong password requirements (enforced in register)

### 6. SQL Injection / Command Injection

**Mitigation**:
- Django ORM (parameterized queries)
- No raw SQL (uses query builders)
- Upload validation (reject executable files)

### 7. Sensitive Data Exposure

**Mitigation**:
- HTTPS only (Secure flag, HSTS, REDIRECT)
- No sensitive data in URLs (POST for credentials)
- Passwords hashed via Django's PBKDF2 hasher
- API keys/tokens in HttpOnly cookies or Authorization headers

### 8. Broken Access Control

**Mitigation**:
- RBAC on all protected endpoints (6 roles: SUPER_ADMIN, ADMIN, PRODUCT_MANAGER, EDITOR, VIEWER, CLIENT)
- Permission checks via `permission_classes` on ViewSets
- See `docs/RBAC.md` for detailed matrix

## LLM / Chatbot Security (Timeout Protection)

**Issue**: Google Generative AI SDK can exceed Python `timeout` parameter in rare cases (gRPC retries on transport failures).

**Mitigation** (see `SECURITY_AUDIT.md` section 7):
- Hard timeout wall-clock in `providers._call_with_hard_timeout()`
- Thread-based timeout (not just SDK parameter)
- CHATBOT_TIMEOUT_SECONDS=20 (configurable)
- Fallback to search if LLM fails

## Vulnerability Disclosure

Found a security issue? Report privately:
1. **Do not open public issues** with exploit details
2. Contact security team with details
3. Include affected version and reproduction steps
4. Avoid including real data or attack payloads

Response time: Within 24 hours.

## References

- **JWT**: https://django-rest-framework-simplejwt.readthedocs.io/
- **RBAC**: `docs/RBAC.md`
- **OWASP Top 10**: `SECURITY_AUDIT.md`
- **API Endpoints**: `docs/API.md`
- **Authentication Flow**: https://tools.ietf.org/html/rfc6749 (OAuth 2.0 refresh token flow)