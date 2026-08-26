# Configuration frontend CAMTEL OnePortal

## Prérequis

- Node.js 20+
- npm 10+
- Backend Django en cours d'exécution (port 8000)

## Installation

```bash
cd frontend/camtel/frontend
npm install
cp .env.example .env   # si présent, sinon utiliser les variables ci-dessous
```

Variables Vite :

```env
VITE_API_BASE_URL=/api/v1
VITE_DEMO_MODE=false
```

`VITE_DEMO_MODE=false` force l'utilisation de l'API réelle (sans mock auth).

## Lancement

```bash
npm run dev      # http://localhost:5173
npm run build    # build production
npm run preview  # prévisualiser le build
npm run test     # tests Vitest
```

## Architecture

```text
src/
├── app/           # Router, layouts, providers
├── features/      # Modules métier (products, news, auth...)
└── shared/        # Composants, hooks, lib (axios, i18n, queryClient)
```

## Intégration API

- **Base URL** : `/api/v1` (proxy Vite en dev, Nginx en prod)
- **JWT** : intercepteur axios avec refresh automatique
- **i18n** : `Accept-Language` envoyé selon la langue react-i18next (fr/en)
- **Comparateur** : `GET /products/compare/?ids=1,2,3`

## Pages publiques

| Route | Description |
|---|---|
| `/` | Accueil |
| `/produits` | Catalogue |
| `/produits/comparateur` | Comparateur d'offres |
| `/produits/:slug` | Fiche produit |
| `/actualites` | Actualités |
| `/contact` | Formulaire de contact |

## Espace admin

Connexion : `/admin/login`  
Comptes seed : superadmin/CamtelAdmin2026!, admin/admin123, editor/editor123

## Accessibilité

- Lien d'évitement « Aller au contenu principal »
- Labels ARIA sur formulaires et tableaux
- Contraste Tailwind conforme WCAG AA (couleurs primary/neutral)
- Navigation clavier sur modales et menus

## Build Docker

Le `Dockerfile` multi-stage produit une image Nginx servie derrière le reverse proxy principal.
