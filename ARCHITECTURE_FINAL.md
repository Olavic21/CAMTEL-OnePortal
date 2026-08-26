# ARCHITECTURE_FINAL.md — CAMTEL OnePortal (V1, extensible V2/V3)

## Vue d'ensemble

```text
                    CAMTEL-OnePortal (React / TypeScript)
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼                          ▼                          ▼
  Portail public             Espace client            Back-office
        │                          │                          │
        └──────────────────────────┼──────────────────────────┘
                                   ▼
                       REST API / Auth (DRF + SimpleJWT)
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        ▼              ▼           ▼            ▼              ▼
    Catalogue      Souscriptions  Utilisateurs  Core/Audit   Partenaires
    (Products)     (workflow +    (RBAC)        (log, notif, (API keys,
     offers/filters)historique)                 chatbot,      scopes,
                                                 search)      rate limit)
                                   │
                    ┌──────────────┼──────────────┐
                    ▼              ▼              ▼
                PostgreSQL       Cache          Media/S3
                (ou SQLite dev)               (local ou S3)
```

## Choix structurants

1. **Multi-apps Django** (`apps.<domaine>` : categories, products, news, promotions, media, contacts, subscriptions, users, partners, core) — séparation des responsabilités, extensibilité (ajouter `documents`, `tickets`, `analytics`, `eligibility` sans toucher au cœur).
2. **API versionnée** : `/api/v1/` (routes métier) et `/partner/` (clés API). La doc OpenAPI (drf-spectacular) sert `/api/schema/` + Swagger `/api/docs/`.
3. **RBAC serveur en référentiel** : permissions via `apps/core/permissions.py` (`ReadPublicWriteAdminOrEditor`, `AdminOnly`, `IsAdminOrEditor`...), rôles `User.role`.
4. **i18n backend** : champs `*_en` + `Accept-Language` (mixin `TranslatableModelSerializer`).
5. **Journalisation centralisée** : `ActivityLog` (signaux `core/signals.py`) + middleware capturant l'utilisateur courant.
6. **Abstraction préparée** (V2/V3, sans faux connecteurs) :
   - `PaymentProvider`, `EligibilityProvider`, `EmailProvider` → interfaces + `Mock*` (voir `docs/roadmap.md`).
   - RAG/LLM multi-fournisseur (Gemini/OpenAI/Ollama) via doc `docs/oneportal-ai.md` — non couplé.
   - Intégrations CAMTEL (CRM/Billing/Provisioning) en adaptateurs mock (V3).

## Flux critiques

- **Souscription** : public/anonyme `POST /api/v1/subscriptions/` → `request_number` + historique initial + notifications → admin `change-status/` (historique tracé, notification client) → statut final `ACTIVATED/REJECTED/CANCELLED`.
- **Espace client** : `my-subscriptions/` et `my-dashboard/` (scoping par utilisateur).

## Base de données / migrations
- SQLite (dev/tests) et PostgreSQL (staging/prod) — bascule via `DB_HOST`.
- Migrations propres et réversibles ; data-migration de backfill pour `request_number`.
- Index ajoutés : `offer_type`, `segment`, `status`, `user`, `request_number`.

## Évolutivité (non implémentée, spécifiée)
Voir `docs/roadmap.md`, `V2_COMPLETION_REPORT.md`, `V3_COMPLETION_REPORT.md`.