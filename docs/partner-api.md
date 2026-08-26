# API Partenaire CAMTEL OnePortal

API restreinte pour les intégrations tierces (catalogue lecture seule).

## Authentification

Envoyer la clé dans l'en-tête HTTP :

```http
X-API-Key: camtel_xxxxxxxxxxxxxxxx
```

## Créer une clé

```bash
cd backend
python manage.py create_partner_key --name "Partenaire XYZ" --scopes "products:read,categories:read"
```

La clé brute n'est affichée qu'une seule fois. Elle est stockée sous forme de hash SHA-256.

## Scopes disponibles

| Scope | Endpoint |
|---|---|
| `products:read` | `GET /api/v1/partner/products/` |
| `categories:read` | `GET /api/v1/partner/categories/` |
| `news:read` | `GET /api/v1/partner/news/` |

## Exemples

### Lister les produits publiés

```bash
curl -H "X-API-Key: camtel_VOTRE_CLE" \
     -H "Accept-Language: en" \
     https://api.camtel.cm/api/v1/partner/products/
```

### Réponse (extrait)

```json
{
  "count": 3,
  "results": [
    {
      "id": 1,
      "name": "Enterprise Router",
      "slug": "routeur-entreprise",
      "price": "245.50",
      "price_unit": "FCFA/mois",
      "category": 1
    }
  ]
}
```

## Internationalisation

L'en-tête `Accept-Language: fr|en` localise les champs `name`, `description`, `title`, `content`.

## Limitations

- Lecture seule (pas de CRUD)
- Pas d'accès aux endpoints admin, auth, ou journal d'activité
- Clés révocables via Django Admin (`PartnerAPIKey.is_active = False`)
- Expiration optionnelle via `expires_at`

## Documentation OpenAPI

Swagger : `/api/docs/` — section « Partner API »
