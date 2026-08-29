# PRODUCTION READINESS — CAMTEL-OnePortal FINAL

> État de préparation au déploiement contrôlé. Statuts vérifiés lors de la passe finale
> (voir `FINAL_COMPLETION_REPORT.md` et `FINAL_AUDIT.md` pour le détail des corrections).
> Date d'évaluation : 2026-08-26.

## SECURITY

| Élément | Statut | Preuve / Emplacement |
|---|---|---|
| Authentification JWT | [x] | `apps/users/`, simplejwt (access+refresh) |
| RBAC (SUPER_ADMIN/ADMIN/EDITOR/CLIENT) | [x] | `apps/core/permissions.py`, `apps/users/models.py` |
| Ownership subscriptions & tickets | [x] | retrieve 404 hors propriétaire/admin ; tests `test_other_client_*` |
| CSRF / CORS | [x] | DRF API-only + CORS restreint (`config/settings`) |
| Rate limiting analytics/search | [x] | throttles DRF sur `/analytics/events/`, `/search/autocomplete/` |
| Montant paiement côté serveur | [x] | `PaymentInitiateView` : montant = prix DB uniquement |
| Idempotence paiements | [x] | `Idempotency-Key` header/body → réutilise la transaction existante |
| Input validation analytics | [x] | `_sanitize_payload()` : max 20 clés / 4 Ko / scalaires |
| Secrets | [x] | hors repo ; `.env` non versionné |
| Webhook paiement signé | [ ] | nécessite un provider réel (abstraction prête) |

## DATA

| Élément | Statut | Preuve / Emplacement |
|---|---|---|
| Sources officielles tracées | [x] | `data/camtel_catalog/2026-08-25/sources.json` |
| Règle OFFICIAL ⇒ source obligatoire | [x] | `import_camtel_catalog` : REJECT si `source_url` absent |
| Import idempotent | [x] | upsert par slug ; relance sans doublons |
| Snapshots datés | [x] | `data/camtel_catalog/YYYY-MM-DD/{offers,services,promotions,sources}.json` |
| Diff entre snapshots | [x] | `python manage.py catalog_diff --a ... --b ...` (NEW/UPDATED/REMOVED) |
| Offres Fiber Connect | [!] | statut REQUIRES_VERIFICATION — portail dynamique, pas d'API publique confirmée |
| Offres Blue mobile | [!] | seules les pages publiques vérifiables sont importées ; le reste est marqué à vérifier |

## BACKEND

| Élément | Statut | Preuve / Emplacement |
|---|---|---|
| Suite de tests | [x] | 57 tests Django (0 échec après correctifs tickets/analytics) |
| Health checks | [x] | `/api/v1/health/live/` + `/api/v1/health/ready/` (db/storage/cache) |
| Gestion d'erreurs métier | [x] | 400/403/404 explicites dans les vues sensibles |
| Index DB | [x] | indexes status/user/created_at ; contrainte CHECK payment_amount_positive |
| Historique souscriptions | [x] | `SubscriptionStatusHistory` (timeline client) |
| Logging | [x] | logging std Django ; exceptions LLM loggées (pas de crash parcours) |

## FRONTEND

| Élément | Statut | Preuve / Emplitude |
|---|---|---|
| TypeScript strict | [x] | `tsc --noEmit` → 0 erreur |
| Fiche produit structurée | [x] | `ProductSpecifications.tsx` (MOBILE/HOSTING/FIBER/BUSINESS) |
| Champs vides jamais affichés | [x] | « Non précisé » ou masquage, pas de 0/N/A |
| Disclaimer mock éligibilité/paiement | [x] | « Vérification indicative » / « Simulation » |
| Responsive 320→1440px | [x] | grilles fluides, tables scrollables (audit Phase 38) |
| Accessibilité de base | [x] | labels formulaires, focus visible, aria sur composants clés |
| SEO dynamique par offre | [x] | balises title/description/OG par page produit |
| Tests unitaires frontend | [ ] | peu de tests React — à renforcer (Vitest) |

## BUSINESS

| Élément | Statut | Détail |
|---|---|---|
| Catalogue Hosting | [x] | offres réelles depuis hosting.camtel.cm (snapshot) |
| Catalogue Carrier | [x] | services pro `pricing_type=QUOTE` (« Prix sur demande »), jamais 0 FCFA |
| Parcours souscription | [x] | création → analyse → approbation → activation + notifications |
| Paiement mock idempotent | [x] | trace persistée `core.Payment` |
| Éligibilité mock affichée comme telle | [x] | `status=SIMULATED` vs `VERIFIED` |
| Support tickets | [x] | OPEN→IN_PROGRESS→WAITING_USER→RESOLVED/CLOSED + ownership |

## AI

| Élément | Statut | Détail |
|---|---|---|
| Réponse prix depuis DB | [x] | chatbot : intention prix → `Product` en base, source + date incluse |
| Fallback FAQ/recherche | [x] | mode legacy sans LLM |
| Pipeline RAG LLM | [x] | activable (`CHATBOT_PROVIDER`), fallback search |
| Ancienneté des sources signalée | [x] | mention « doit être vérifiée » si snapshot > 90 j |

## DEVOPS

| Élément | Statut | Détail |
|---|---|---|
| CI sans silencing sécurité | [x] | `pip-audit` et `npm audit --audit-level=moderate` non masqués |
| CI tests+lint+migrations | [x] | `.github/workflows/ci.yml` |
| Backup documenté | [x] | `docs/disaster-recovery.md` |
| Restore testé automatiquement | [ ] | procédure manuelle validée ; automatisation à ajouter |
| Health probes orchestrateur | [x] | endpoints live/ready exploitables (k8s/compose) |

## Critère de sortie

Le projet peut être présenté comme **production-ready pour un déploiement contrôlé**
sur données officielles vérifiées, tant que :
1. aucun libellé ne présente un mock comme une intégration réelle ;
2. toute nouvelle donnée OFFICIAL passe par l'importeur (source obligatoire) ;
3. un provider de paiement réel implémente son abstraction avant activation.
