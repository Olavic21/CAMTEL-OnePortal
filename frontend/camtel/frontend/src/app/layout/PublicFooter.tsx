import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '@/shared/components/Logo';
import { getServiceMeta } from '@/shared/config/services';
import { getSegmentMeta } from '@/shared/config/segments';
import type { Service, Segment } from '@/shared/types';

/**
 * Footer professionnel et responsive (cahier des charges section 5).
 * Organise les liens autour des 4 services (Fixes, Mobiles, Transport, Data Center)
 * et des segments (Particulier, Professionnel, Entreprise, Administration).
 * Service et Segment sont des notions distinctes — jamais liees hierarchiquement.
 */
export function PublicFooter() {
  const { t } = useTranslation();

  const services: Service[] = ['FIXES', 'MOBILES', 'TRANSPORT', 'DATA_CENTER'];
  const segments: Segment[] = ['PARTICULIER', 'PROFESSIONNEL', 'ENTREPRISE', 'ADMINISTRATION'];

  return (
    <footer className="border-t border-neutral-200 bg-neutral-900 text-neutral-300 dark:border-neutral-800 dark:bg-black">
      <div className="container-app grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <div className="mb-4">
            <Logo variant="full-dark" className="justify-start" />
          </div>
          <p className="text-sm text-neutral-400">{t('footer.tagline')}</p>
        </div>

        {/* Services — section 5 navigation 4 univers */}
        <div>
          <p className="mb-3 text-sm font-semibold text-white">{t('footer.services')}</p>
          <ul className="space-y-2 text-sm">
            {services.map((service) => {
              const meta = getServiceMeta(service);
              return (
                <li key={service}>
                  <Link to={`/services/${service.toLowerCase()}`} className="hover:text-white">
                    {meta?.label ?? service}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link to="/produits" className="hover:text-white">
                {t('footer.allCatalog')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Segments — section 5 solutions par profil */}
        <div>
          <p className="mb-3 text-sm font-semibold text-white">{t('footer.profiles')}</p>
          <ul className="space-y-2 text-sm">
            {segments.map((segment) => {
              const meta = getSegmentMeta(segment);
              return (
                <li key={segment}>
                  <Link to={`/produits?segment=${segment}`} className="hover:text-white">
                    {meta?.label ?? segment}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Ressources et legal */}
        <div>
          <p className="mb-3 text-sm font-semibold text-white">{t('footer.resources')}</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/actualites" className="hover:text-white">{t('nav.news')}</Link></li>
            <li><Link to="/promotions" className="hover:text-white">{t('footer.promotions')}</Link></li>
            <li><Link to="/documents" className="hover:text-white">{t('documents.title')}</Link></li>
            <li><Link to="/contact" className="hover:text-white">{t('nav.contact')}</Link></li>
            <li><Link to="/trouver-une-solution" className="hover:text-white">{t('nav.findSolution')}</Link></li>
          </ul>
          <div className="mt-6">
            <p className="mb-3 text-sm font-semibold text-white">{t('footer.legal')}</p>
            <ul className="space-y-2 text-sm">
              <li><span className="cursor-default">{t('footer.legalNotice')}</span></li>
              <li><span className="cursor-default">{t('footer.privacyPolicy')}</span></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 pb-20 text-center text-xs text-neutral-500 sm:pb-4">
        © {new Date().getFullYear()} CAMTEL-OnePortal: {t('footer.rights')}
      </div>
    </footer>
  );
}
