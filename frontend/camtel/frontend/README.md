# CAMTEL Platform — Frontend

Application React + TypeScript (Vite) du site public et du back-office de la
plateforme produits & services CAMTEL, conforme a l'architecture decrite dans
la documentation technique du projet (sections 4 a 12).

## ⚠️ Important — Comment démarrer le frontend

**Le fichier `package.json` se trouve UNIQUEMENT dans ce dossier** (`frontend/camtel/frontend/`).

Pour démarrer le frontend, vous avez deux options :

### Option 1 : Utiliser les scripts de démarrage (recommandé)

Double-cliquez sur l'un des fichiers suivants :
- **`start-frontend.bat`** — pour Windows (invite de commande)
- **`start-frontend.ps1`** — pour Windows PowerShell

Ces scripts installent automatiquement les dépendances si nécessaire et lancent le serveur de développement.

### Option 2 : Ligne de commande

```bash
# Naviguer vers le dossier frontend
cd frontend/camtel/frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev```

L'application demarre sur `http://localhost:5173` et proxy les appels
`/api/*` vers `http://localhost:8000` (backend Django/DRF) en developpement —
voir `vite.config.ts`. En production, `VITE_API_BASE_URL` pointe directement
vers l'URL de l'API (ex: `https://api.camtel.cm/api/v1`).

---

## Stack

- **React 18 + TypeScript** (strict)
- **Vite** — bundler et serveur de developpement
- **React Router 6** — routage (`app/router.tsx`)
- **TanStack React Query** — cache et synchronisation des donnees serveur
- **Axios** — client HTTP avec intercepteur JWT (access + refresh)
- **React Hook Form + Zod** — formulaires et validation
- **TailwindCSS** — design system (couleurs institutionnelles CAMTEL)
- **Framer Motion** — transitions et micro-interactions
- **react-i18next** — fondations multilingues FR/EN
- **Recharts** — graphiques du tableau de bord admin

## 🔑 Acces au Back-Office (Mode Demo — Sans Backend)

Le frontend inclut un **mode demo** qui permet d'acceder au back-office sans
avoir besoin du backend Django/DRF ni d'une base de donnees. Ideal pour le
developpement et la demonstration.

### Activer le mode demo

Verifiez que le fichier `.env` contient :

```env
VITE_DEMO_MODE=true
```

### Identifiants de connexion

| Role | Nom d'utilisateur | Mot de passe |
|------|-------------------|--------------|
| **Super Admin** (acces complet) | `superadmin` | `CamtelAdmin2026!` |

### Etapes pour acceder au back-office

1. **Demarrer le serveur de developpement** :
   ```bash
   npm run dev
   ```

2. **Naviguer vers la page de connexion** :
   ```
   http://localhost:5173/admin/login
   ```

3. **Se connecter avec les identifiants Super Admin** :
   - Nom d'utilisateur : `superadmin`
   - Mot de passe : `CamtelAdmin2026!`

4. **Acceder au back-office** :
   - Apres connexion, cliquez sur le bouton **"Back-Office"** dans le header
   - Ou naviguez directement vers `http://localhost:5173/admin`

### Fonctionnalites accessibles en mode demo

- ✅ Dashboard avec statistiques
- ✅ Catalogue produits (filtres service/segment)
- ✅ Gestion des services (Fixes, Mobiles, Transport, Data Center)
- ✅ Gestion des offres
- ✅ Gestion des clients
- ✅ Analytics et metriques
- ✅ Qualite des donnees
- ✅ Tickets support
- ✅ Notifications
- ✅ Parametres d'administration

### Creer des utilisateurs supplementaires

En tant que super_admin, vous pouvez creer des comptes avec differents roles
via **Administration** > **Utilisateurs** :

| Role | Permissions |
|------|-------------|
| `super_admin` | Acces complet (creation d'admins, journal d'activite) |
| `admin` | Gestion catalogue, clients, souscriptions |
| `product_manager` | Gestion produits, promotions, media |
| `editor` | Gestion actualites, promotions, media |

### Deconnexion

Cliquez sur **"Se deconnecter"** dans le header. Pour reinitialiser la session
demo, supprimez la cle `camtel_demo_accounts` du localStorage du navigateur.

### Desactiver le mode demo (production)

Pour utiliser le backend Django/DRF reel, modifiez `.env` :

```env
VITE_DEMO_MODE=false
```

## Scripts

| Commande          | Description                              |
|-------------------|-------------------------------------------|
| `npm run dev`     | Serveur de developpement avec HMR          |
| `npm run build`   | Verification TypeScript + build production |
| `npm run preview` | Previsualisation du build de production    |
| `npm run lint`    | Lint ESLint                                |
| `npm run format`  | Formatage Prettier                         |

## Structure du projet

Organisation **feature-based** (voir section 5.4 de la documentation) :

```
src/
├── app/                # Configuration globale
│   ├── router.tsx      # Arborescence de routes (public + admin)
│   ├── providers.tsx   # Providers globaux (React Query, Toasts)
│   ├── layout/          # Header/Footer public, Sidebar/Layout admin
│   └── pages/            # Pages transverses (Accueil, Entreprise, 404)
├── features/
│   ├── auth/             # Authentification JWT, garde de route, RBAC
│   ├── products/         # Catalogue public + CRUD admin, comparateur
│   ├── categories/       # CRUD admin des categories
│   ├── news/              # Actualites publiques + CRUD admin
│   ├── promotions/       # Bannieres publiques + CRUD admin
│   ├── media/              # Mediatheque (upload, suppression)
│   ├── contact/           # Formulaire public + boite de reception admin
│   ├── dashboard/        # Tableau de bord de synthese
│   ├── activity-log/    # Journal d'activite (Super Admin)
│   ├── users/              # Gestion des comptes internes (Super Admin)
│   └── subscriptions/   # Parcours de souscription en ligne (V3)
└── shared/
    ├── components/       # Design system (Button, Card, Table, Modal...)
    ├── lib/                  # Client Axios, React Query, i18n
    ├── types/               # Modele de donnees (aligne section 7)
    └── utils/               # Formatage, slugify
```

## Fonctionnalites couvertes

Conformement au cahier des fonctionnalites (section 3) :

- **MVP** : catalogue public, categories, authentification JWT, RBAC,
  CRUD produits/actualites/promotions, mediatheque, formulaire de contact,
  recherche et filtres, tableau de bord, responsive design complet.
- **V2** : journal d'activite, statistiques de consultation, galerie
  multi-images, FAQ produit, recherche avec autocomplete.
- **V3** : comparateur d'offres, fondations multilingues FR/EN, parcours de
  souscription en ligne, widget chatbot (facade API).

Les fonctionnalites V2/V3 qui dependent d'endpoints non encore livres par le
backend (export PDF, statistiques avancees, chatbot IA) sont cablees cote
frontend contre les routes documentees (section 8) avec une gestion d'erreur
gracieuse, prêtes a fonctionner des que l'API correspondante est disponible.

## Authentification & RBAC

Le token JWT (access + refresh) est stocke via `shared/lib/tokenStorage.ts`
et injecte automatiquement dans chaque requete (`shared/lib/axios.ts`), avec
rafraichissement automatique sur expiration (401). Les routes admin sont
protegees par `RequireAuth` (`features/auth/components/RequireAuth.tsx`), qui
verifie a la fois l'authentification et le role (section 9.3) — ce controle
frontend reste un confort d'affichage, jamais un substitut au RBAC applique
cote serveur.

## Accessibilite & performance

- Navigation clavier, `focus-visible`, attributs ARIA sur les composants
  interactifs (section 11.6).
- `prefers-reduced-motion` respecte (Framer Motion desactive les animations).
- Images en `loading="lazy"`, pagination standard sur toutes les listes,
  cache React Query pour limiter les appels redondants (section 14).

## Deploiement

Le `Dockerfile` fourni realise un build multi-stage (Vite → Nginx), conforme
a la section 15.1 de la documentation. Un `nginx.conf` minimal sert les
fichiers statiques avec fallback SPA et compression gzip.

```bash
docker build -t camtel-frontend .
docker run -p 8080:80 camtel-frontend
```
