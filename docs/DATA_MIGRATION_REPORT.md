# DATA_MIGRATION_REPORT.md

Date : 2026-08-28
Scope : migration taxonomy `enterprise→segment`, nouveaux champs catalogue, RBAC back-office.

---

## 1. Backup préalable

Un **backup logique** de la base a été réalisé avant toute migration :

```
pg_dump -Fc -f backup_camtel_<date>.dump OnePortal
```

---

## 2. Migration schema

| App | Migration | Opérations |
|---|---|---|
| `core` | `0007_notification_channel_read_at` | + `channel`, `read_at`, index `(user,is_read)`, choix `error` |
| `subscriptions` | `0004_alter_subscriptionrequest_status` | statut `Status.choices` étendu (DRAFT/ACTIVATING/ACTIVE/SUSPENDED/COMPLETED + legacy conservés) |
| `products` | `0012_taxonomy_service_segment_bootstrap` | création `Service`/`Segment`, bootstrap 4 services + 4 segments |

---

## 3. Migration data

### Taxonomy (enterprise → segment)
- `enterprise` (catégorie) n’est **pas** supprimée : les produits legacy gardent leur `category` (compat).
- Un `Service` (`fixes/mobiles/transport/data-center`) et des `Segment` (`particulier/professionnel/entreprise/administration`) sont créés.
- La table `ProductSegment` relie produits ↔ segments (ManyToMany).
- `Product.service` est renseigné depuis le mapping `import_camtel_catalog`.

### Souscriptions
- Les statuts existants sont conservés. Ajout `DRAFT/ACTIVATING/ACTIVE/SUSPENDED/COMPLETED`.
- Mapping legacy : `PENDING≡SUBMITTED`, `ACTIVATED≡ACTIVE` (alias d’entrée).
- `SubscriptionStatusHistory` conserve chaque transition.

---

## 4. Validation

| Check | Commande | Résultat |
|---|---|---|
| Intégrité | `manage.py check` | ✅ 0 issue |
| Migr. orpheline | `makemigrations --check` | ✅ No changes |
| Qualité données | `manage.py validate_camtel_data` | ✅ 0 erreur, 4 warnings legacy (`internet/cloud/telecom` categories) |
| Tests | `manage.py test` | ✅ all pass (core 55, subscriptions 16, products+users 19) |

---

## 5. Stratégie de migration progressive (data CAMTEL)

Les catégories legacy sont traitées dans `docs/BACKEND_TAXONOMY_MIGRATION.md`.
Les cas ambigus sont marqués `REQUIRES_BUSINESS_VALIDATION` (ex: `internet`, `enterprise`).

Les snapshots source sont conservés sous `data/camtel_catalog/<YYYY-MM-DD>/` ; les offres
supprimées du catalogue source passent à `ARCHIVED` (jamais suppressions immédiates).
