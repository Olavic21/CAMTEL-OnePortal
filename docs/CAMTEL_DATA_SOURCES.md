# Sources officielles des données commerciales CAMTEL

Toute donnée commerciale de OnePortal doit pouvoir être rattachée à une entrée de
ce fichier. Les sources non officielles (blogs, comparateurs, forums, réseaux
sociaux, presse, revendeurs, copies archivées) sont **interdites** comme source
de vérité.

## Sources utilisées — vérification du 2026-08-25

| Clé snapshot | Source | URL | Domaines couverts | Statut |
|---|---|---|---|---|
| `camtel_hosting_home` | CAMTEL Hosting (site officiel) | https://hosting.camtel.cm/ | CB Bare Metal Server, CB M. Web Hosting, CB Rack Housing, CB VPS, Cloud Support, Domains, services additionnels | ✅ Vérifiée 2026-08-25 |
| `camtel_carrier_services` | CAMTEL Carrier (site officiel) | https://carrier.camtel.cm/services | Urban/Intercity Leased Line, DIA, IP Transit, IP/MPLS, IPLC, Infrastructure Sharing, Satellite, Data Center | ✅ Vérifiée 2026-08-25 |
| `camtel_portal_home` | CAMTEL (site institutionnel) | https://www.camtel.cm/ | Mobile blue, Landline (fibre ≤ 50 Mbps), Transport, Data Storage, Blue Shop, Fiber Connect, Data Plans, Data Center | ✅ Vérifiée 2026-08-25 |
| `camtel_fiberconnect` | Fiber Connect (portail de souscription) | https://fiberconnect.camtel.cm/ | FTTH | ⚠️ App JS — catalogue à extraire via rendu navigateur |
| `blue_website` | Blue (site officiel) | https://blue.camtel.cm/services | Forfaits mobiles blue | ❌ Injoignable depuis l'environnement le 2026-08-25 → aucune donnée importée |

## Sources autorisées non encore exploitées

- https://www.camtel.cm/services (page services détaillée)
- https://assistance.camtel.cm/ (centre d'aide)
- PDF officiels hébergés directement sur les domaines camtel.cm

## Règles d'usage

1. Toute nouvelle donnée commerciale passe d'abord par un snapshot daté
   (`data/camtel_catalog/<AAAA-MM-JJ>/`) référençant sa source.
2. L'import (`python manage.py import_camtel_catalog`) enregistre `source_url`,
   `source_name`, `source_checked_at`, `last_verified_at` et `data_origin=OFFICIAL`.
3. Une donnée dont la source ne peut pas être confirmée est soit `null`, soit
   « Prix sur demande », avec statut `REQUIRES_VERIFICATION`.
4. Re-vérification recommandée au moins tous les 30 jours
   (`DATA_FRESHNESS_DAYS`) ; au-delà, l'offre est marquée STALE (#34).

## Archives brutes

Les pages HTML collectées lors des vérifications sont conservées dans
`data/camtel_catalog/raw/` pour audit (hosting_home.html, fiberconnect_home.html).
