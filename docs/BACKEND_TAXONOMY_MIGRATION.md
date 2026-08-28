# BACKEND_TAXONOMY_MIGRATION.md

Migration taxonomique CAMTEL OnePortal — OLD → NEW → stratégie → impact.

> Source de vérité : cahier des charges OnePortal (sections 2, 3, 4, 6).
> Date : 2026-08-28 — Branche : dev.
> Migrations concernées : `products.0011_segment_sourceverificationlog_and_more`,
> `products.0012_taxonomy_service_segment_bootstrap`.

---

## 1. Règle d'or

**SERVICE ≠ SEGMENT ≠ PRODUCT ≠ OFFER ≠ SPECIFICATION ≠ SOURCE.**

- **Service** = verticale commerciale (FIXES, MOBILES, TRANSPORT, DATA_CENTER).
- **Segment** = clientèle cible (PARTICULIER, PROFESSIONNEL, ENTREPRISE, ADMINISTRATION).
- **"ENTREPRISE" n'est PAS un service** — c'est un segment.

## 2. Ancienne taxonomie (audit)

| Élément | Localisation avant migration |
|---|---|
| `offer_type` (INTERNET, FIBER, MOBILE, VOICE, DATA, CLOUD, HOSTING, VPN, EQUIPMENT, BUSINESS_SOLUTION, OTHER) | `apps/products/models.py::Product.offer_type` — filtres API, import command, comparateur, chatbot, analytics |
| `segment` CharField simple | `Product.segment` — filtre `?segment=` (déléguait vers `category__segment`) |
| Segment catégorie `grand_public`/`entreprise` | `apps/categories/models.py::Category.segment` — utilisé par le frontend (`?segment=grand_public`, `?segment=entreprise`) |
| Familles catalogue (mobile-blue, fixed-fiber, transport-carrier, data-center-hosting) | `import_camtel_catalog.py::OFFICIAL_CATEGORIES` + snapshot `data/camtel_catalog/` |
| `data_origin` (OFFICIAL/DEMO/MANUAL) | `Product.data_origin` — qualité de données, dashboards |

## 3. Mapping OLD → NEW

### 3.1 Services (nouveaux, stockés en base)

| Service (slug API) | Code interne | Contenu |
|---|---|---|
| `fixes` | `FIXED` | Téléphonie fixe, lignes, PABX, fibre fixe (Fiber Connect, Landline), internet fixe |
| `mobiles` | `MOBILE` | Réseau blue, forfaits, SIM, recharges |
| `transport` | `TRANSPORT` | Carrier : IP transit, MPLS, IPLC, satellite, colocation transport |
| `data-center` | `DATA_CENTER` | Hosting, VPS, Bare Metal, Rack Housing, Backup, Storage, VPN, Public IP, domaines |

### 3.2 Conversion des anciennes valeurs

| OLD | NEW | Stratégie | Impact |
|---|---|---|---|
| `offer_type=MOBILE` | `service=mobiles` | automatique | aucun |
| `offer_type=FIBER` / `INTERNET` | `service=fixes` | automatique (offres fibre/internet fixe documentées) | `INTERNET` legacy → **REQUIRES_BUSINESS_VALIDATION** hors fibre |
| `offer_type=VOICE` | `service=fixes` | automatique (téléphonie fixe) | aucun |
| `offer_type=CLOUD` / `HOSTING` / `VPN` | `service=data-center` | automatique | aucun |
| `offer_type=DATA` | `service=transport` | hypothèse « liaisons dédiées » | **REQUIRES_BUSINESS_VALIDATION** |
| `offer_type=EQUIPMENT` / `BUSINESS_SOLUTION` / `OTHER` | service via `category_slug` ; sinon **NULL** | pas de devinette | produit sans service → **ERROR** `validate_camtel_data` |
| catégorie `mobile-blue` | `service=mobiles` | automatique | aucun |
| catégorie `fixed-fiber` | `service=fixes` | automatique | aucun |
| catégorie `transport-carrier` | `service=transport` | automatique | aucun |
| catégorie `data-center-hosting` | `service=data-center` | automatique | aucun |
| catégorie legacy `internet` / `telecom` | `service=fixes` | produits DEMO uniquement | **REQUIRES_BUSINESS_VALIDATION** |
| catégorie legacy `cloud` | `service=data-center` | produits DEMO uniquement | faible |

### 3.3 Segments

| OLD | NEW | Stratégie |
|---|---|---|
| `Product.segment` CharField (valeur unique) | **conservé** comme « segment principal » (compat frontend) + nouveau M2M `Product.segments` | resynchronisé à l'enregistrement : `segment` = premier segment du M2M (par `display_order`) |
| `Category.segment=grand_public` | `PARTICULIER` | mapping migration ; le filtre `?segment=grand_public` continue de fonctionner |
| `Category.segment=entreprise` | `ENTREPRISE` | idem |
| Un produit = 1 segment | Un produit = **N segments** | `Product.segments` M2M + `Product.sync_segments([...])` |

### 3.4 Provenance des données (`data_origin`)

| OLD | NEW | Usage |
|---|---|---|
| `OFFICIAL` | inchangé — exigences renforcées (source_url + source_name + last_verified_at obligatoires) | catalogue vérifié |
| `MANUAL` | inchangé | saisie back-office |
| `DEMO` | inchangé | seed développement |
| — | `HISTORICAL` (+ `historical_since`) | donnée datée, jamais présentée comme actuelle (chatbot/RAG) |
| — | `MOCK` | simulation explicite, jamais présentée comme réelle |
| — | `REQUIRES_VALIDATION` | donnée non confirmée → **REQUIRES_BUSINESS_VALIDATION** |

### 3.5 Tarification

| OLD | NEW | Remarque |
|---|---|---|
| `FIXED` | conservé ≡ `FIXED_PRICE` | libellé API documenté |
| `QUOTE` (+ `price IS NULL`) | inchangé | règle « prix inconnu ≠ 0 » déjà en place |
| `FREE` | inchangé | |
| — | `INSTALLATION` | frais d'installation (`installation_fee`) |
| — | `USAGE_BASED` | facturation à l'usage (crédit voix/data) |
| — | `MONTHLY` / `YEARLY` | portés par `billing_period` (déjà existant) — PAS dupliqués dans `pricing_type` |

## 4. Stratégie d'exécution

1. **Schema** (`0011`) : création `Service`, `Segment`, `Product.service` (FK nullable, `PROTECT`),
   `Product.segments` (M2M), `ProductSource`, `SourceVerificationLog`, élargissement
   `data_origin` (max_length 16→32), `pricing_type`, `historical_since`, index.
2. **Data** (`0012`) : seed des 4 services + 4 segments, assignation
   `Product.service` (category_slug → offer_type), alimentation M2M
   (`segment` CharField prioritaire, sinon `category.segment` : grand_public→PARTICULIER).
   **Réversible** (reverse : désassignation + suppression des entités seedées, aucune donnée produit détruite).
3. **Validation** : `python manage.py validate_camtel_data` (PASS/WARNING/ERROR, exit code CI).
4. **Aucun renommage destructif** : `offer_type`, `segment`, `category.segment` restent
   en place et restent exposés — le frontend existant continue de fonctionner.

## 5. Cas marqués REQUIRES_BUSINESS_VALIDATION

- `offer_type=DATA` → transport (hypothèse liaisons dédiées).
- Produits `EQUIPMENT`/`BUSINESS_SOLUTION`/`OTHER` hors catégories officielles → sans service.
- Catégories legacy demo (`internet`, `telecom`, `cloud`).
- Éventuel renommage final des statuts de souscription (voir FRONTEND_BACKEND_CONTRACT.md) :
  `PENDING≡SUBMITTED`, `SCHEDULED≡ACTIVATING`, `ACTIVATED≡ACTIVE`.

## 6. Impact sur les consommateurs

| Consommateur | Impact |
|---|---|
| Filtre `?offer_type=` | inchangé (toujours actif) |
| Filtre `?segment=` | étendu : matche `Product.segment` + `Product.segments` + `category.segment` |
| Filtre `?service=` | **nouveau** (slug service) |
| Sérialisation produit | champs additionnels `service` (objet), `segments` (liste) — champs existants inchangés |
| Comparateur / chatbot / analytics | lisent toujours `offer_type`/`segment` — aucun changement requis |
| Import catalogue | assigne désormais `service` + `segments` + `ProductSource` |

## 7. Vérification

```bash
python manage.py migrate products            # 0011 + 0012
python manage.py validate_camtel_data        # aucune donnée incohérente
python manage.py test apps.products.test_taxonomy
```

