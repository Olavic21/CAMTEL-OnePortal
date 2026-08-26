# ARCHITECTURE.md — Vue d'ensemble

Voir `ARCHITECTURE_FINAL.md` pour la version détaillée et structurée.

```text
React / TypeScript (SPA)
        ↓  /api/v1 · JWT Bearer · Accept-Language
Django REST Framework (apps.<domaine>, RBAC serveur)
        ↓
PostgreSQL (prod/staging) · SQLite (dev/tests)
```

## Couches
- **apps.core** — `ActivityLog`, `Notification`, santé, chatbot, recherche, permissions, i18n.
- **apps.products** — offres métier (types, segments, frais, engagement, technologie, éligibilité), comparateur, FAQ, galerie.
- **apps.subscriptions** — workflow souscription (`request_number`, historique, statuts), espace client.
- **apps.users / categories / news / promotions / media / contacts / partners** — comptes, catalogue, actualités, promos, médias, contact, API partenaire.

## Principes d'extension (V2/V3)
- Ajouter de nouvelles `apps` Django (documents, tickets, analytics, eligibility) sans modifier le cœur.
- Abstractions fournisseurs (`PaymentProvider`, `EligibilityProvider`, `EmailProvider`, `CRM/Billing/Provisioning`) en interfaces + mocks — jamais de faux connecteurs.
- i18n FR/EN généralisée ; omnicanal et mobile-ready via services partagés.