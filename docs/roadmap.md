# Roadmap Technique — Plateforme CAMTEL

Checklist regroupant l'ensemble des tâches du projet, organisées par couche technique.

---

## Data / Base de données

- [x] Modéliser les tables `User`, `Category`, `Product`, `ProductImage`, `News`, `Promotion`, `MediaFile`, `ContactMessage`
- [x] Définir les champs, types, contraintes et clés étrangères
- [x] Créer les modèles Django correspondants
- [x] Générer et appliquer les migrations initiales
- [x] Configurer SQLite comme base de développement
- [x] Créer les fixtures de données de test (commande `seed_data`)
- [x] Définir les index nécessaires (slug, status, category_id)
- [x] Écrire les tests unitaires des modèles
- [x] Créer la table `ActivityLog`
- [x] Ajouter le compteur de vues produit
- [x] Modéliser la table `ProductFAQ`
- [x] Ajouter les index sur `activity_logs`
- [x] Ajouter les champs de traduction (FR/EN) sur `Product`, `Category`, `News`
- [x] Modéliser les tables espace client (`ClientProfile`, `SubscriptionRequest`)
- [x] Migrer le schéma complet vers PostgreSQL en production (config + docker-compose)
- [x] Optimiser les index pour la recherche plein texte (PostgreSQL GIN/tsvector)
- [x] Vérifier les séquences post-migration (`reset_pg_sequences`)

## Backend (Django + DRF)

- [x] Initialiser le projet Django avec structure `config/` + `apps/`
- [x] Configurer les settings par environnement
- [x] Installer et configurer Django REST Framework
- [x] Mettre en place l'authentification JWT
- [x] Créer le modèle `User` custom avec champ `role`
- [x] Implémenter les permissions RBAC
- [x] Développer les sérialiseurs et vues DRF (Catégories, Produits, Actualités, Promotions)
- [x] Développer l'endpoint d'upload média
- [x] Développer l'endpoint de formulaire de contact
- [x] Mettre en place la pagination standard
- [x] Configurer `drf-spectacular` (Swagger/OpenAPI)
- [x] Écrire les tests d'intégration API
- [x] Configurer CORS
- [x] Implémenter le journal d'activité
- [x] Développer l'endpoint `GET /activity-logs/`
- [x] Développer l'endpoint de statistiques
- [x] Développer le CRUD `ProductFAQ`
- [x] Développer l'endpoint d'export PDF
- [x] Mettre en place un système de notifications internes
- [x] Ajouter la recherche avancée avec autocomplete
- [x] Basculer la configuration PostgreSQL de production
- [x] Internationaliser l'API (champs traduits, en-tête `Accept-Language`)
- [x] Développer le comparateur d'offres (endpoint multi-produits normalisés)
- [x] Poser les bases du module `subscriptions`
- [x] Documenter et publier une API partenaire restreinte (clés API, scopes limités)
- [x] Intégrer un service de chatbot IA basique
- [x] Ajouter les tests de non-régression sur PostgreSQL en CI

## Frontend (React + TypeScript)

- [x] Initialiser le projet Vite + React + TypeScript
- [x] Configurer TailwindCSS et le design system
- [x] Mettre en place React Router et la structure `app/` + `features/`
- [x] Configurer l'instance Axios (intercepteur JWT)
- [x] Configurer React Query
- [x] Développer le module Authentification
- [x] Développer la page catalogue produits
- [x] Développer la page fiche produit détaillée
- [x] Développer l'interface admin CRUD
- [x] Développer le module Actualités
- [x] Développer le module Promotions
- [x] Développer le formulaire de contact public
- [x] Développer le tableau de bord admin
- [x] Implémenter le responsive design mobile-first
- [x] Écrire les tests unitaires des composants critiques
- [x] Développer l'écran Journal d'activité
- [x] Développer le module Statistiques
- [x] Développer la galerie multi-images
- [x] Développer le composant FAQ
- [x] Ajouter le bouton d'export PDF
- [x] Développer le centre de notifications
- [x] Implémenter la recherche avec suggestions
- [x] Améliorer l'accessibilité (WCAG AA, corrections ciblées)
- [x] Ajouter le sélecteur de langue (FR/EN) et l'internationalisation
- [x] Développer l'écran comparateur d'offres
- [x] Développer le parcours de souscription en ligne
- [x] Intégrer le widget chatbot
- [x] Préparer les fondations de l'espace client
- [x] Optimiser le bundle (code splitting)

## DevOps

- [x] Écrire le `Dockerfile` backend
- [x] Écrire le `Dockerfile` frontend multi-stage
- [x] Écrire le `docker-compose.yml` de développement
- [x] Configurer Nginx en reverse proxy
- [x] Initialiser le dépôt Git et la stratégie de branches
- [x] Créer le pipeline CI GitHub Actions
- [x] Rédiger le `README.md`
- [x] Créer le `.env.example`
- [x] Mettre en place le `.gitignore`
- [x] Ajouter le job de déploiement automatisé
- [x] Mettre en place les healthchecks Docker
- [x] Configurer les logs structurés (format JSON)
- [x] Mettre en place une sauvegarde automatisée de la base et des médias
- [x] Ajouter un environnement de recette (staging)
- [x] Documenter la procédure de restauration de sauvegarde
- [x] Provisionner l'infrastructure PostgreSQL de production (docker-compose)
- [x] Mettre à jour le pipeline CI/CD pour exécuter les tests contre PostgreSQL
- [x] Configurer le monitoring (healthcheck avancé, alerting basique)
- [x] Mettre en place le stockage objet compatible S3 pour les médias en production
- [x] Renforcer la politique de sécurité HTTPS/HSTS en production
- [x] Documenter le plan de reprise après incident (RTO/RPO cibles)

*Dernière mise à jour : 12 août 2026 — Projet complet, intégration API et documentation de lancement finalisées.*

---

## Finalisation V1 (14 août 2026) — Sécurité, métier offre, souscription

### Sécurité & stabilisation
- [x] `SECRET_KEY` obligatoire en production (refus de démarrer)
- [x] Logout révocable : blacklist du refresh token (`token_blacklist`)
- [x] JWT configurable (`JWT_ACCESS_LIFETIME_MINUTES`, `JWT_REFRESH_LIFETIME_DAYS`)
- [x] Rate limiting : login, register, refresh, chatbot, search, contact, partenaire
- [x] Seed demo gated (`SEED_DEMO_DATA`, `--force`) ; retiré des compose
- [x] Secrets retirés de `docker-compose*.yml` ; staging exige `SECRET_KEY`/`DB_PASSWORD`
- [x] Fix du test backend cassé + CI élargie à `apps` (toutes)

### Modèle métier offre
- [x] `Product` : `product_type`, `offer_type`, `segment`, `billing_period`, frais, engagement, technologie, éligibilité, `features/benefits/terms`, `currency`, `manage_stock`
- [x] Filtres catalogue (type, produit/service, disponibilité, prix) + index
- [x] Comparateur enrichi (PHASE 2)

### Souscription V1
- [x] `request_number` humain unique (SUB-YYYY-NNNNNN)
- [x] Statuts complets + `SubscriptionStatusHistory`
- [x] `change-status/`, `my-subscriptions/`, `my-dashboard/`
- [x] Notifications création + transitions

### Tests / Docs
- [x] 32 tests backend ✓ (12 nouveaux) ; API/RBAC/docs finaux ajoutés
