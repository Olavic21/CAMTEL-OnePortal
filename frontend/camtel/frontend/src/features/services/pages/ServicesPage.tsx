import { Link } from 'react-router-dom';
import { ArrowRight, Phone, Smartphone, Truck, Server, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { SERVICES } from '@/shared/config/services';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';

const SERVICE_DETAILS: Record<string, { highlights: string[]; accent: string }> = {
  fixes: {
    highlights: ['Téléphonie fixe', 'Internet fibre optique FTTH', 'Solutions IP & PABX', 'Offres particuliers & entreprises'],
    accent: 'from-blue-600 to-primary',
  },
  mobiles: {
    highlights: ['Voix & SMS', 'Data 4G sous marque Blue', 'Services à valeur ajoutée', 'Forfaits prépayés & postpayés'],
    accent: 'from-sky-500 to-primary-600',
  },
  transport: {
    highlights: ['Transmission DWDM', 'Fibre backbone nationale', 'IP/MPLS & Ethernet', 'Solutions opérateurs & ISP'],
    accent: 'from-indigo-600 to-primary-700',
  },
  'data-center': {
    highlights: ['Hébergement & colocation', 'Cloud & backup', 'Interconnexion', 'Datacenter Tier III'],
    accent: 'from-emerald-600 to-primary-700',
  },
};

const iconMap: Record<string, typeof Phone> = {
  fixes: Phone,
  mobiles: Smartphone,
  transport: Truck,
  'data-center': Server,
};

export default function ServicesPage() {
  const { t } = useTranslation();
  return (
    <div>
      <section className="border-b border-neutral-200 bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white dark:border-neutral-800">
        <div className="container-app py-14 lg:py-20">
          <Breadcrumbs items={[{ label: t('nav.home'), to: '/' }, { label: t('nav.services') }]} />
          <h1 className="mt-4 text-3xl font-extrabold sm:text-4xl lg:text-5xl">{t('servicesPage.heroTitle')}</h1>
          <p className="mt-4 max-w-2xl text-white/80">{t('servicesPage.heroSubtitle')}</p>
        </div>
      </section>

      <section className="container-app py-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {SERVICES.map((s) => {
            const detail = SERVICE_DETAILS[s.slug] ?? { highlights: [], accent: 'from-primary to-primary-700' };
            const Icon = iconMap[s.slug] ?? s.icon;
            return (
              <Link
                key={s.service}
                to={s.route}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-neutral-200 bg-white transition-all hover:-translate-y-1 hover:shadow-xl dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className={`bg-gradient-to-br ${detail.accent} p-6 text-white`}>
                  <div className="flex items-center gap-4">
                    <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                      <Icon className="h-7 w-7" />
                    </span>
                    <div>
                      <h2 className="text-xl font-bold">{s.label}</h2>
                      <p className="text-sm text-white/80">{s.tagline}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm text-white/90">{s.description}</p>
                  {/* Illustrations SVG légères - 4 petits motifs vectoriels */}
                  <div className="mt-4 flex gap-2 opacity-60">
                    <div className="h-1.5 w-8 rounded-full bg-white/40" />
                    <div className="h-1.5 w-4 rounded-full bg-white/30" />
                    <div className="h-1.5 w-12 rounded-full bg-white/20" />
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <ul className="space-y-2">
                    {detail.highlights.map((h) => (
                      <li key={h} className="flex items-center gap-2 text-sm text-neutral-600 dark:text-neutral-400">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" /> {h}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 dark:text-primary-300">
                    {t('services.viewOffers')} <ArrowRight className="h-4 w-4 transition-all group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-8 text-center">
          <Link to="/produits" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline dark:text-primary-300">
            {t('home.seeAllOffers')} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
