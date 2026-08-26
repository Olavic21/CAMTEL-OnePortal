# Migration des données DEMO vers les données commerciales officielles CAMTEL

> Audit et traçabilité de la migration. Date de vérification des sources : **2026-08-25**.
>
> **Règle absolue appliquée** : aucune offre, prix, débit, durée, volume, code USSD,
> promotion ou disponibilité n'a été inventé. Toute donnée non trouvée sur une source
> officielle CAMTEL est `null` ou affichée « Prix sur demande ».

## 1. Données demo identifiées (backend)

| Donnée actuelle (demo) | Fichier | Source | Statut | Action | Nouvelle donnée | Vérifié le |
|---|---|---|---|---|---|---|
| Routeur Entreprise — 245.50 FCFA/mois | `seed_data.py` | Aucune (fictif) | FICTIF | Marqué `data_origin=DEMO`, conservé isolé (dev uniquement) | Remplacé par le catalogue hosting officiel | 2026-08-25 |
| Abonnement Fibre — 120.00 FCFA/mois | `seed_data.py` | Aucune (fictif) | FICTIF | idem | Offre réelle : « Internet fixe illimité jusqu'à 50 Mbps » (prix non publié → QUOTE) | 2026-08-25 |
| Hébergement Cloud — 399.99 FCFA/mois | `seed_data.py` | Aucune (fictif) | FICTIF | idem | 24 plans officiels hosting.camtel.cm importés | 2026-08-25 |
| Promo Telecom −15 % | `seed_data.py` | Aucune (fictive) | FICTIVE | Non reproduite | `promotions.json = []` (aucune promo officielle datée vérifiable) | 2026-08-25 |
| Nouvelle offre CAMTEL (news) | `seed_data.py` | Aucune | FICTIF | Hors périmètre catalogue ; reste gated dev | — | — |

Le seed demo est déjà protégé (`SEED_DEMO_DATA` / `--force`, jamais en prod) et ses
produits portent désormais `data_origin=DEMO` pour pouvoir être archivés sans toucher
au catalogue officiel.

## 2. Catalogue officiel importé

Architecture : **snapshots JSON versionnés** (`data/camtel_catalog/<date>/`) →
commande idempotente `import_camtel_catalog` → base Django → API REST → React.
Le frontend n'embarque aucune donnée commerciale statique.

### Hosting (source : https://hosting.camtel.cm/ — vérifiée 2026-08-25)

| Ancienne donnée demo | Statut | Nouvelle donnée officielle |
|---|---|---|
| « Hébergement Cloud 399.99 FCFA » | REMPLACÉE | CB BMS S/M/L, CB M. Web Hosting S/M/L, CB VPS XS→Quad XXL (9), CB Rack Housing XS/S/M/L/XL/XXL (6), CS XS/S, Domain Name + addons (VNIC, VPS Backups, Data Backups) — **26 offres avec prix exacts FCFA/mois et FCFA/an** |

### Carrier (source : https://carrier.camtel.cm/services)

| Ancienne donnée | Statut | Nouvelle donnée |
|---|---|---|
| Néant (aucun service Carrier en demo) | AJOUT | Urban Leased Line, Intercity Leased Line, DIA, IP Transit, IP/MPLS, IPLC, Infrastructure Sharing (CoCLS/CoSiCam), Satellite, Data Center — tous `pricing_type=QUOTE` (« Prix sur demande », aucun tarif ni SLA publié) |

### Fixe/Fibre & Mobile Blue (sources : camtel.cm, fiberconnect.camtel.cm)

| Ancienne donnée | Statut | Nouvelle donnée |
|---|---|---|
| Abonnement Fibre fictif | REMPLACÉ | « Internet fixe illimité jusqu'à 50 Mbps » (citation exacte Landline), speed=50 Mbps, prix non publié → QUOTE |
| Néant | AJOUT | Services blue (réseau mobile, Blue Shop, Application Blue), Fiber Connect — **statut REQUIRES_VERIFICATION** pour le détail tarifaire FTTH |
| Forfaits Blue (Blue One, Blue Go…) | NON CRÉÉS | blue.camtel.cm inaccessible depuis l'environnement de vérification (fetch/curl échoués). Conformément à la règle absolue, **aucun forfait, prix ou code USSD Blue n'a été inventé**. À importer après vérification sur blue.camtel.cm |

### Promotions

Aucune promotion officielle datée et conditionnée n'étant publiée au 2026-08-25,
`promotions.json` est vide. Le modèle `Promotion` supporte désormais
`offer/status/conditions/source_url/last_verified_at` et une promo expirée ne peut
plus apparaître active (`is_currently_active`).

## 3. Champs de traçabilité ajoutés (#7)

Chaque offre OFFICIAL porte : `source_url`, `source_name`, `source_checked_at`,
`last_verified_at`, `data_origin='OFFICIAL'`, plus `brand`, `service_type`,
`status` (VALID/EXPIRED/UPCOMING/REQUIRES_VERIFICATION), `pricing_type`
(FIXED/QUOTE/FREE), volumes data/voix/sms, `speed`, `coverage`,
`subscription_method`, `ussd_code` (vide partout : aucun code USSD officiel trouvé),
`specs` JSON structuré hosting (#15).

Règles d'affichage : prix inconnu ⇒ jamais `0 FCFA` mais **« Prix sur demande »**
(#29) ; fraîcheur `DATA_FRESHNESS_DAYS=30` ⇒ flag STALE (#34).

## 4. Résolutions post-audit

| Élément | Blocage initial | Résolution |
|---|---|---|
| **Images produits** | Aucun asset identifié au premier passage | ✅ **RÉSOLU** — 5 assets officiels découverts dans le HTML archivé de hosting.camtel.cm (+ logo Fiber Connect). Commande `attach_official_images` : téléchargement local `media/products/`, champ `original_source_url` sur `ProductImage` (migration 0010), 16 offres illustrées (logo CAMTEL, serveurs, datacenter Tier III), idempotent. Aucun hotlink, aucune image tierce. |
| **Codes USSD Blue** | Jamais publiés sur les sources accessibles | Toujours vides — règle « ne pas inventer » maintenue |
| **Forfaits Blue détaillés** | blue.camtel.cm + www.blue.camtel.cm injoignables le 25/08/2026 (HTTPS et HTTP) | En attente d'un accès réseau ; snapshot prêt à être complété dès collecte possible |

## 5. Correctifs techniques induits par l'audit qualité

- **Auth API** : `DEFAULT_AUTHENTICATION_CLASSES` réordonné (JWT en tête) — DRF 3.17
  coerce `NotAuthenticated`→403 lorsque le premier authenticator ne fournit pas de
  header `WWW-Authenticate` ; les écritures anonymes renvoient désormais bien **401**
  conformément au contrat d'API testé.
- **Tests LLM hermétiques** : `CHATBOT_MODEL='mock-gpt'` ajouté aux overrides — les
  tests ne dépendent plus du `.env` local (Gemini réel).

