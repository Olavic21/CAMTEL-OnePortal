import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function PublicFooter() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-neutral-300 dark:border-neutral-800 dark:bg-black">
      <div className="container-app grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="mb-3 flex items-center gap-2 font-bold text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-sm">C</span>
            CAMTEL
          </p>
          <p className="text-sm text-neutral-400">{t('footer.tagline')}</p>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">{t('footer.products')}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/produits?segment=grand_public" className="hover:text-white">{t('footer.grandPublic')}</Link></li>
            <li><Link to="/produits?segment=entreprise" className="hover:text-white">{t('footer.entreprise')}</Link></li>
            <li><Link to="/produits" className="hover:text-white">{t('footer.allCatalog')}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">{t('footer.resources')}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/actualites" className="hover:text-white">{t('nav.news')}</Link></li>
            <li><Link to="/promotions" className="hover:text-white">{t('footer.promotions')}</Link></li>
            <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-white">{t('footer.legal')}</p>
          <ul className="space-y-2 text-sm">
            <li><span className="cursor-default">{t('footer.legalNotice')}</span></li>
            <li><span className="cursor-default">{t('footer.privacyPolicy')}</span></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 pb-20 text-center text-xs text-neutral-500 sm:pb-4">
        © {new Date().getFullYear()} CAMTEL-OnePortal: {t('footer.rights')}
      </div>
    </footer>
  );
}
