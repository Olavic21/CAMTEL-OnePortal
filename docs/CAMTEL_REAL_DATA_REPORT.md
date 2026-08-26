# CAMTEL Real Data Report — 2026-08-25

Résultat de la migration des données de démonstration vers les données
commerciales officielles CAMTEL (snapshot `data/camtel_catalog/2026-08-25/`).

## Compteurs

| Métrique | Valeur |
|---|---|
| Entrées officielles importées (offres + services) | **42** |
| Offres illustrées par un **asset officiel téléchargé** (`original_source_url`) | **16** (logo CAMTEL ×3, visuels serveurs/datacenter ×12, logo Fiber Connect ×1) |
| Offres Hosting tarifées (BMS, Web Hosting, Rack Housing, VPS, Cloud Support) | 23 |
| Services additionnels Hosting tarifés (VNIC, VPS Backups, Data Backups) | 3 |
| Domain Name service | 1 |
| Services Carrier (Urban/Intercity LL, DIA, IP Transit, IP/MPLS, IPLC, Infra Sharing, Satellite, Data Center) | 9 |
| Services Blue / portail (réseau blue, Blue Shop, Application Blue, Landline fibre, Fiber Connect, Data Center) | 6 |
| Offres avec prix publié (`FIXED`) | **26** |
| Offres « Prix sur demande » (`QUOTE`, prix `null`) | **15** |
| Promotions actives importées | 0 (aucune promotion officielle datée vérifiable) |
| FAQ officielles adossées aux offres (chatbot/RAG) | 6 |
| Sources officielles référencées | 5 (voir `CAMTEL_DATA_SOURCES.md`) |
| Date de dernière vérification des sources | 2026-08-25 |
| Offres `REQUIRES_VERIFICATION` | 1 (Fiber Connect — catalogue FTTH à extraire) |
| Forfaits mobiles Blue importés | **0** — site officiel injoignable lors de la vérification ; aucune donnée inventée |

## Répartition par marque

| Brand | Entrées | Avec prix | QUOTE |
|---|---|---|---|
| HOSTING (hosting.camtel.cm) | 27 | 26 | 1 (Domaines) |
| CARRIER (carrier.camtel.cm) | 9 | 0 | 9 |
| BLUE / FIBER_CONNECT / CAMTEL (portail) | 6 | 0 | 6 |

## Qualité des données

- Idempotence prouvée : second passage de l'import → **42 mises à jour, 0 création**
  (aucun doublon possible : upsert par slug unique).
- Aucun prix inconnu stocké comme `0` (règle #29) : `null` + affichage
  « Prix sur demande ».
- Toute entrée OFFICIAL porte `source_url` + `source_name` +
  `last_verified_at=2026-08-25`.
- Endpoint qualité (admin) : `GET /api/v1/products/data-quality/`
  (total, vérifiées, STALE, sans prix, sans image, sans source,
  REQUIRES_VERIFICATION, expirées).

## Hors périmètre / prochaines étapes

1. **Blue mobile** : re-collecter blue.camtel.cm dès qu'il est joignable puis
   publier un nouveau snapshot daté (forfaits, volumes, USSD uniquement s'ils y
   sont publiés).
2. **Fiber Connect** : extraire le catalogue FTTH via rendu JS du portail.
3. **Images** : associer les assets officiels CAMTEL quand téléchargeables
   (`media/products/` + source originale conservée).
4. Re-vérification périodique : `DATA_FRESHNESS_DAYS=30` → dashboard STALE.

## Commandes

```bash
python manage.py import_camtel_catalog            # upsert idempotent + rapport
python manage.py import_camtel_catalog --dry-run  # validation sans écriture
python manage.py test apps.products.test_data_quality   # 13 tests qualité
```

## État de la suite de tests backend

| Périmètre | Résultat |
|---|---|
| **Suite complète `manage.py test`** | **✅ OK — 130 tests, 0 échec** (1 skip volontaire) |
| `apps.products.test_data_quality` (nouveau, mission #36) | 13/13 OK |
| Frontend vitest (format + ProductCard) | 13/13 OK · `tsc --noEmit` exit 0 |

### Correctifs réalisés pour y parvenir

1. **Auth API (401 vs 403)** — cause racine identifiée : DRF coerce
   `NotAuthenticated`→403 quand le premier authenticator ne fournit pas de header
   `WWW-Authenticate`. Fix : `JWTAuthentication` placé en tête de
   `DEFAULT_AUTHENTICATION_CLASSES` (SimpleJWT fournit `Bearer realm=`), session
   conservée pour l'admin. Écritures anonymes → **401** conformément au contrat.
   Note incident : une première application du fix a été écrasée par une écriture
   concurrente (run de tests long en parallèle de l'édition) ; ré-appliquée puis
   re-vérifiée au runtime (`promotions/categories → 401`).
2. **Tests LLM hermétiques** — `CHATBOT_MODEL='mock-gpt'` ajouté aux overrides ;
   les tests ne dépendent plus du `.env` local pointant vers Gemini réel.


Validation API live post-import (2026-08-25) :
- `GET /api/v1/products/?brand=HOSTING&service_type=OFFER` → 26 offres
- `GET /api/v1/products/?pricing_type=QUOTE` → 15 offres
- `GET /api/v1/products/data-quality/` → 42 OFFICIAL / 42 vérifiées / 0 STALE / 0 sans source / 1 REQUIRES_VERIFICATION
- `POST /api/v1/chatbot/ask/` (« Combien coûte un VPS CAMTEL ? ») → réponse générée (source: gemini/RAG) citant les plans CB VPS importés

