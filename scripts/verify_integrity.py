"""Verification d'integrite des modifications de la mission donnees reelles.

Verifie la presence des marqueurs cles dans chaque fichier modifie
(apres l'incident d'ecriture concurrente ayant perdu base.py).
"""
import io
import os

CHECKS = {
    'backend/config/settings/base.py': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'DATA_FRESHNESS_DAYS',
        'CAMTEL_FIBER_ELIGIBILITY_URL',
    ],
    'backend/apps/products/models.py': [
        'class Brand', 'price_on_request', 'cta_type', 'is_stale',
        'original_source_url', 'data_origin',
    ],
    'backend/apps/products/serializers.py': [
        "price_on_request", "yearly_price", "'data_origin'", "'specs'",
    ],
    'backend/apps/products/views.py': [
        'brand=brand.upper', 'data-quality', 'stale_threshold',
    ],
    'backend/apps/products/admin.py': [
        'mark_verified', 'archive_offers', 'verification_flag',
    ],
    'backend/apps/promotions/models.py': ['is_currently_active', 'conditions'],
    'backend/apps/promotions/admin.py': ['mark_expired'],
    'backend/apps/core/v2_services.py': ['CamtelFiberEligibilityProvider', 'camtel_fiber'],
    'backend/apps/core/tests.py': ["CHATBOT_MODEL='mock-gpt'"],
    'frontend/camtel/frontend/src/shared/utils/format.ts': ['Prix sur demande'],
    'frontend/camtel/frontend/src/shared/lib/i18n.ts': ['eligibilityCta', 'agencyCta'],
    'frontend/camtel/frontend/src/features/products/pages/ProductDetailPage.tsx': [
        'cta_type', 'officialSource',
    ],
    'frontend/camtel/frontend/src/shared/types/index.ts': ['price_on_request', 'cta_type'],
}

FILES_MUST_EXIST = [
    'backend/apps/core/management/commands/import_camtel_catalog.py',
    'backend/apps/core/management/commands/attach_official_images.py',
    'backend/apps/products/test_data_quality.py',
    'data/camtel_catalog/2026-08-25/offers.json',
    'data/camtel_catalog/2026-08-25/services.json',
    'data/camtel_catalog/2026-08-25/faqs.json',
    'data/camtel_catalog/2026-08-25/sources.json',
    'docs/REAL_DATA_MIGRATION.md',
    'docs/CAMTEL_REAL_DATA_REPORT.md',
    'docs/CAMTEL_DATA_SOURCES.md',
]


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    ok = True
    for rel, markers in CHECKS.items():
        path = os.path.join(root, rel)
        if not os.path.isfile(path):
            print(f'MISSING FILE: {rel}')
            ok = False
            continue
        content = io.open(path, encoding='utf-8', errors='ignore').read()
        missing = [m for m in markers if m not in content]
        if missing:
            print(f'INCOMPLETE: {rel} -> missing {missing}')
            ok = False
        else:
            print(f'OK: {rel}')
    for rel in FILES_MUST_EXIST:
        if not os.path.isfile(os.path.join(root, rel)):
            print(f'MISSING FILE: {rel}')
            ok = False
        else:
            print(f'EXISTS: {rel}')
    print('RESULT:', 'ALL GOOD' if ok else 'ISSUES FOUND')
    sys_exit = 0 if ok else 1
    raise SystemExit(sys_exit)


if __name__ == '__main__':
    main()
