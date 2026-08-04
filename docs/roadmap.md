# Roadmap Technique — Plateforme CAMTEL

## Toutes les tâches compilées par couche technique

Checklist unique regroupant l'ensemble des tâches du projet (MVP + évolutions), organisées par couche et dans un ordre d'exécution logique.

---

## 🗄️ Data / Base de données

- [ ] Modéliser les tables `User`, `Category`, `Product`, `ProductImage`, `News`, `Promotion`, `MediaFile`, `ContactMessage`
- [ ] Définir les champs, types, contraintes et clés étrangères
- [ ] Créer les modèles Django correspondants (`models.py` par app)
- [ ] Générer et appliquer les migrations initiales (`makemigrations` / `migrate`)
- [ ] Configurer SQLite comme base de développement
- [ ] Créer les fixtures de données de test (catégories de base, comptes de rôles)
- [ ] Définir les index nécessaires (slug, status, category_id)
- [ ] Écrire les tests unitaires des modèles (contraintes, validations)
- [ ] Créer la table `ActivityLog` (audit des actions sensibles)
- [ ] Ajouter le compteur de vues produit (statistiques de consultation)
- [ ] Modéliser la table `ProductFAQ` (questions/réponses par produit)
- [ ] Ajouter les index sur `activity_logs` (user, target_model, created_at)
- [ ] Ajouter les champs de traduction (FR/EN) sur `Product`, `Category`, `News`
- [ ] Modéliser les tables préparatoires à l'espace client (`ClientProfile`, `SubscriptionRequest`)
- [ ] Migrer le schéma complet vers PostgreSQL en production
- [ ] Optimiser les index pour la recherche plein texte (PostgreSQL `GIN`/`tsvector`)
- [ ] Vérifier les séquences d'auto-incrément post-migration (`sqlsequencereset`)

## ⚙️ Backend (Django + DRF)

- [ ] Initialiser le projet Django avec structure `config/` + `apps/`
- [ ] Configurer les settings par environnement (`base.py`, `dev.py`, `prod.py`)
- [ ] Installer et configurer Django REST Framework
- [ ] Mettre en place l'authentification JWT (`djangorestframework-simplejwt`)
- [ ] Créer le modèle `User` custom avec champ `role`
- [ ] Implémenter les classes de permissions RBAC (`core/permissions.py`)
- [ ] Développer les sérialiseurs et vues DRF : Catégories
- [ ] Développer les sérialiseurs et vues DRF : Produits (+ images, statut, publication)
- [ ] Développer les sérialiseurs et vues DRF : Actualités
- [ ] Développer les sérialiseurs et vues DRF : Promotions
- [ ] Développer l'endpoint d'upload média (`media_library`)
- [ ] Développer l'endpoint de formulaire de contact (avec throttling)
- [ ] Mettre en place la pagination standard sur toutes les listes
- [ ] Configurer `drf-spectacular` (Swagger/OpenAPI) et exposer `/api/docs/`
- [ ] Écrire les tests d'intégration API (auth, permissions, CRUD produits)
- [ ] Configurer CORS pour autoriser le frontend
- [ ] Implémenter l'écriture automatique du journal d'activité (signal/middleware)
- [ ] Développer l'endpoint `GET /activity-logs/` avec filtres
- [ ] Développer l'endpoint de statistiques (produits les plus consultés)
- [ ] Développer le CRUD `ProductFAQ` lié aux produits
- [ ] Développer l'endpoint d'export PDF de fiche produit
- [ ] Mettre en place un système de notifications internes
- [ ] Ajouter la recherche avancée avec autocomplete
- [ ] Basculer la configuration `DATABASES` de production vers PostgreSQL
- [ ] Internationaliser l'API (champs traduits, en-tête `Accept-Language`)
- [ ] Développer le comparateur d'offres (endpoint multi-produits normalisés)
- [ ] Poser les bases du module `subscriptions` (souscription en ligne, statuts)
- [ ] Documenter et publier une API partenaire restreinte (clés API, scopes limités)
- [ ] Intégrer un service de chatbot IA basique (endpoint façade + FAQ produits)
- [ ] Ajouter les tests de non-régression sur PostgreSQL en CI

## 🐳 DevOps

- [ ] Écrire le `Dockerfile` backend (Python slim + Gunicorn)
- [ ] Écrire le `Dockerfile` frontend multi-stage (build Vite → image Nginx)
- [ ] Écrire le `docker-compose.yml` de développement (frontend, backend, nginx)
- [ ] Configurer Nginx en reverse proxy (statique + `/api/*`)
- [ ] Initialiser le dépôt Git et la stratégie de branches (`main`, `develop`)
- [ ] Créer le pipeline CI GitHub Actions (lint + tests à chaque PR)
- [ ] Rédiger le `README.md` (installation, lancement, structure du projet)
- [ ] Créer le `.env.example` documentant toutes les variables nécessaires
- [ ] Mettre en place le `.gitignore` complet
- [ ] Ajouter le job de déploiement automatisé (`deploy.yml`) sur merge dans `main`
- [ ] Mettre en place les healthchecks Docker (backend, frontend, db)
- [ ] Configurer les logs structurés (format JSON)
- [ ] Mettre en place une sauvegarde automatisée de la base et des médias
- [ ] Ajouter un environnement de recette (staging)
- [ ] Documenter la procédure de restauration de sauvegarde
- [ ] Provisionner l'infrastructure PostgreSQL de production
- [ ] Mettre à jour le pipeline CI/CD pour exécuter les tests contre PostgreSQL
- [ ] Configurer le monitoring (healthcheck avancé, alerting basique)
- [ ] Mettre en place le stockage objet compatible S3 pour les médias en production
- [ ] Renforcer la politique de sécurité HTTPS/HSTS en production
- [ ] Documenter le plan de reprise après incident (RTO/RPO cibles)

---

## Légende de suivi

Statut
Signification

⬜
À faire

🟡
En cours

✅
Terminé

*Astuce : dupliquer ce fichier dans `docs/roadmap.md` du dépôt et cocher les tâches au fil de l'avancement.*
