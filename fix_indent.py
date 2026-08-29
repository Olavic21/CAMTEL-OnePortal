import sys

path = 'frontend/camtel/frontend/src/shared/lib/i18n.ts'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

fixes = [
    "                        seeAll: 'Voir tout',\n        popularOffers: 'Offres populaires',\n",
    "                        successBody: \"Notre \u00e9quipe reviendra vers vous rapidement.\",\n      },\n      services: {\n        fixes: 'Fixes',\n        mobiles: 'Mobiles',\n        transport: 'Transport',\n        dataCenter: 'Data Center',\n        about: '\u00c0 propos',\n        subServices: 'Sous-services',\n        offers: 'Offres',\n        viewOffers: 'Voir les offres',\n        noOffers: 'Aucune offre disponible',\n        notFound: 'Service introuvable',\n        complementary: 'Services compl\u00e9mentaires',\n        faq: 'Questions fr\u00e9quentes',\n      },\n      notFound: {",
    "                        tagline:\n          'Op\u00e9rateur historique de t\u00e9l\u00e9communications du Cameroun : fixe, mobile, internet et solutions entreprise.',\n        services: 'Services',\n        profiles: 'Profils',\n        products: 'Produits',",
    "                        seeAll: 'See all',\n        popularOffers: 'Popular offers',\n        featuredProducts: 'Featured products',",
    "                        successBody: 'Our team will get back to you shortly.',\n      },\n      services: {\n        fixes: 'Landline',\n        mobiles: 'Mobile',\n        transport: 'Transport',\n        dataCenter: 'Data Center',\n        about: 'About',\n        subServices: 'Sub-services',\n        offers: 'Offers',\n        viewOffers: 'View offers',\n        noOffers: 'No offers available',\n        notFound: 'Service not found',\n        complementary: 'Complementary services',\n        faq: 'Frequently asked questions',\n      },\n      notFound: {",
    "                        tagline:\n          \"Cameroon's historic telecommunications operator \u2014 landline, mobile, internet and enterprise solutions.\",\n        services: 'Services',\n        profiles: 'Profiles',\n        products: 'Products',",
]

replacements = [
    "        seeAll: 'Voir tout',\n        popularOffers: 'Offres populaires',\n        featuredProducts: 'Produits phares',",
    "        successBody: \"Notre \u00e9quipe reviendra vers vous rapidement.\",\n      },\n      services: {\n        fixes: 'Fixes',\n        mobiles: 'Mobiles',\n        transport: 'Transport',\n        dataCenter: 'Data Center',\n        about: '\u00c0 propos',\n        subServices: 'Sous-services',\n        offers: 'Offres',\n        viewOffers: 'Voir les offres',\n        noOffers: 'Aucune offre disponible',\n        notFound: 'Service introuvable',\n        complementary: 'Services compl\u00e9mentaires',\n        faq: 'Questions fr\u00e9quentes',\n      },\n      notFound: {",
    "        tagline:\n          'Op\u00e9rateur historique de t\u00e9l\u00e9communications du Cameroun : fixe, mobile, internet et solutions entreprise.',\n        services: 'Services',\n        profiles: 'Profils',\n        products: 'Produits',",
    "        seeAll: 'See all',\n        popularOffers: 'Popular offers',\n        featuredProducts: 'Featured products',",
    "        successBody: 'Our team will get back to you shortly.',\n      },\n      services: {\n        fixes: 'Landline',\n        mobiles: 'Mobile',\n        transport: 'Transport',\n        dataCenter: 'Data Center',\n        about: 'About',\n        subServices: 'Sub-services',\n        offers: 'Offers',\n        viewOffers: 'View offers',\n        noOffers: 'No offers available',\n        notFound: 'Service not found',\n        complementary: 'Complementary services',\n        faq: 'Frequently asked questions',\n      },\n      notFound: {",
    "        tagline:\n          \"Cameroon's historic telecommunications operator \u2014 landline, mobile, internet and enterprise solutions.\",\n        services: 'Services',\n        profiles: 'Profiles',\n        products: 'Products',",
]

for i, (old, new) in enumerate(zip(fixes, replacements)):
    if old in content:
        content = content.replace(old, new, 1)
        print(f'Fix {i+1}: OK')
    else:
        print(f'Fix {i+1}: NOT FOUND')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done - file written')
