# TESTING.md — Stratégie de tests

## Backend (Django / DRF)
```powershell
cd backend
# Toutes les apps, SQLite
python manage.py test apps --verbosity 2
# PostgreSQL (définir DB_* puis)
python manage.py test apps --verbosity 2
```
Périmètre couvert (32 tests) : authentication (login, logout+blacklist, refresh), RBAC/permissions (publication/destruction réservées admin), produits (CRUD, recherche, filtres catégorie/segment/type/disponibilité/prix, comparateur), offres métier, workflow souscription (numéro, historique, transitions, KPIs, scoping client), catégories, activités, notifications, partenaires (clés/scopes), modèles.

## Frontend (Vitest)
```powershell
cd frontend\camtel\frontend
npm run test -- --run
npm run build          # typecheck (tsc -b) + build
```
Périmètre : composants critiques (Button, ProductCard), utils (format), permissions RBAC. (Lenteur d'exécution possible sur machines sous-dimensionnées.)

## E2E (à venir V2)
Parcours client (accueil→catalogue→recherche→fiche→souscription→dashboard) et admin (login→création offre→publication→demande→statut→notification).

## CI/CD
`.github/workflows/ci.yml` exécute tests backend sur SQLite + PostgreSQL et tests/build frontend à chaque push/PR. Aucun déploiement si les tests critiques échouent.