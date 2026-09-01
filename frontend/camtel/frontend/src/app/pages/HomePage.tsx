import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Sparkles, Radio, Headset, ShieldCheck, Zap, Newspaper, Calendar, Phone, Smartphone, Truck, Server } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCatalog } from '@/features/products/hooks/useCatalog';
import { useNewsList } from '@/features/news/hooks/useNews';
import { ProductCard } from '@/features/products/components/ProductCard';
import { ServiceCard } from '@/features/services/components/ServiceCard';
import { SERVICES } from '@/shared/config/services';
import { SEGMENTS } from '@/shared/config/segments';
import { Skeleton } from '@/shared/components/Skeleton';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { Badge } from '@/shared/components/Badge';
import { formatDate } from '@/shared/utils/format';

const whyItems = [
  { key: 'whyNetwork', icon: Radio },
  { key: 'whySupport', icon: Headset },
  { key: 'whyReliability', icon: ShieldCheck },
  { key: 'whyInnovation', icon: Zap },
];

export default function HomePage() {
  const { t } = useTranslation();
  const { data: catalog, isLoading: loadingOffers } = useCatalog({});
  const { data: news } = useNewsList();
  const offers = catalog?.results ?? [];

  return (
    <div>
      {/* HERO — spec Phase 4: Toute l'offre CAMTEL + illustrations 4 univers */}
      <section className="relative overflow-hidden border-b border-neutral-200 bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white dark:border-neutral-800">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-accent/15 blur-3xl" />
        </div>
        <div className="container-app relative grid gap-8 py-12 sm:py-16 lg:grid-cols-2 lg:items-center lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col items-start text-left"
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
              {t('home.heroBadge')}
            </p>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
              {t('home.heroTitleLine1')} <br /> {t('home.heroTitleLine2')}
            </h1>
            <p className="mt-4 max-w-xl text-base text-white/80 sm:text-lg">{t('home.heroSubtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/produits">
                <Button size="lg" variant="secondary">
                  {t('home.heroCtaCatalog')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="tertiary" className="border-white/40 text-white hover:bg-white/10">
                  {t('home.heroCtaServices')}
                </Button>
              </Link>
            </div>
          </motion.div>
          {/* Illustrations légères 4 univers — SVG + Lucide, pas d'images externes */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Phone, label: 'Fixes', sub: 'fibre / voix', color: 'bg-white/10' },
              { icon: Smartphone, label: 'Mobiles', sub: 'Blue / 4G', color: 'bg-white/10' },
              { icon: Truck, label: 'Transport', sub: 'fibre / MPLS', color: 'bg-white/10' },
              { icon: Server, label: 'Data Center', sub: 'cloud / hosting', color: 'bg-white/10' },
            ].map(({ icon: Icon, label, sub, color }) => (
              <div key={label} className={`flex flex-col items-center rounded-2xl ${color} p-6 backdrop-blur border border-white/10`}>
                <Icon className="h-8 w-8 text-white" />
                <span className="mt-2 text-sm font-semibold">{label}</span>
                <span className="text-xs text-white/60">{sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DÉCOUVREZ NOS SERVICES — 4 cartes entièrement cliquables vers le catalogue */}
      <section id="services" className="container-app scroll-mt-24 py-14 sm:py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
            {t('home.universTitle')}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-neutral-500 dark:text-neutral-400">
            {t('home.servicesSubtitle')}
          </p>
        </div>
        {/* Mobile : 1 colonne / Tablette : 2 colonnes / Desktop : 4 colonnes */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.service} service={s} index={i} />
          ))}
        </div>
      </section>

      {/* OFFRES POPULAIRES — données dynamiques du catalogue (API, jamais hardcodées) */}
      <section className="bg-neutral-100 py-14 dark:bg-neutral-900">
        <div className="container-app">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
                {t('home.popularOffers')}
              </h2>
              <p className="mt-1.5 text-neutral-500 dark:text-neutral-400">
                {t('home.catalogSectionSubtitle')}
              </p>
            </div>
            <Link
              to="/produits"
              className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline sm:inline-flex dark:text-primary-300"
            >
              {t('home.seeAllOffers')} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {loadingOffers ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="aspect-[4/3] w-full" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {offers.slice(0, 4).map((p, i) => (
                <ProductCard key={String(p.id)} product={p} index={i} />
              ))}
            </div>
          )}
          {/* CTA visible uniquement sur mobile (le lien remplace l'entrée du header) */}
          <div className="mt-8 text-center sm:hidden">
            <Link to="/produits">
              <Button variant="tertiary">{t('home.seeAllOffers')}</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* SOLUTIONS PAR PROFIL (segments — PAS des services) */}
      <section className="bg-neutral-100 py-14 dark:bg-neutral-900">
        <div className="container-app">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.profilesTitle')}</h2>
            <p className="mx-auto mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">{t('home.profilesSubtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {SEGMENTS.map((seg) => (
              <Link key={seg.segment} to={`/produits?segment=${seg.segment}`} className="group">
                <Card className="h-full p-6 transition-colors group-hover:border-primary-300">
                  <Badge tone="primary">{seg.label}</Badge>
                  <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400">{seg.description}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary group-hover:underline dark:text-primary-300">
                    {t('home.seeOffers')} <ArrowRight className="h-4 w-4" />
                  </span>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <HomeBody news={news?.results ?? []} />
    </div>
  );
}

/** Second moitie du rendu (Pourquoi CAMTEL, Actualites, Assistance). */
function HomeBody({
  news,
}: {
  news: Array<{ id: number; title: string; slug: string; cover_image?: string | null; published_at?: string | null }>;
}) {
  const { t } = useTranslation();
  return (
    <div>
      {/* POURQUOI CAMTEL */}
      <section className="container-app py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.whyTitle')}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">{t('home.whySubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyItems.map(({ key, icon: Icon }) => (
            <Card key={key} className="p-6">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{t(`home.${key}`)}</h3>
              <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t(`home.${key}Desc`)}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* INFRASTRUCTURE / CHIFFRES CLÉS */}
      <section className="bg-neutral-900 py-12 text-white dark:bg-black">
        <div className="container-app">
          <h2 className="text-center text-2xl font-bold">Infrastructure & chiffres clés</h2>
          <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-white/60">Source: camtel.cm — vérifié le 2026-05-15</p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { v: '26+', l: 'Ans d’expérience' },
              { v: '5M+', l: 'Clients' },
              { v: '3 500+', l: 'Employés' },
              { v: '10', l: 'Régions' },
              { v: '20 000+ km', l: 'Fibre' },
              { v: '1,7 Tbps', l: 'Capacité intl.' },
            ].map((k) => (
              <div key={k.l} className="rounded-xl bg-white/5 p-4 text-center ring-1 ring-white/10">
                <p className="text-xl font-bold">{k.v}</p>
                <p className="text-xs text-white/60">{k.l}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link to="/a-propos" className="text-sm font-medium text-white/80 hover:text-white hover:underline">
              En savoir plus — À propos <ArrowRight className="ml-1 inline h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* TROUVER MA SOLUTION — assistant de recommandation (fonctionnalité existante) */}
      <section className="bg-primary-50 py-14 dark:bg-primary-950/40">
        <div className="container-app flex flex-col items-center gap-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Compass className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="max-w-xl text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            {t('home.findSolutionTitle')}
          </h2>
          <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">{t('home.findSolutionSubtitle')}</p>
          <Link to="/trouver-une-solution">
            <Button size="lg">
              <Sparkles className="h-4 w-4" /> {t('home.findSolution')}
            </Button>
          </Link>
        </div>
      </section>

      {/* ACTUALITES CAMTEL */}
      <section className="bg-neutral-50 py-14 dark:bg-neutral-900">
        <div className="container-app">
          <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary dark:bg-primary-900/30 dark:text-primary-300">
                <Newspaper className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('news.title')}</h2>
                <p className="text-sm text-neutral-500 dark:text-neutral-400">{t('news.subtitle')}</p>
              </div>
            </div>
            <Link to="/actualites">
              <Button variant="tertiary" size="sm">
                {t('home.seeAll')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>

          {news.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {news.slice(0, 6).map((article) => (
                <Link
                  key={article.id}
                  to={`/actualites/${article.slug}`}
                  className="group overflow-hidden rounded-xl border border-neutral-200 bg-white transition-all hover:shadow-lg dark:border-neutral-700 dark:bg-neutral-950"
                >
                  <div className="aspect-[16/9] w-full overflow-hidden bg-neutral-100 dark:bg-neutral-800">
                    {article.cover_image ? (
                      <img
                        src={article.cover_image}
                        alt={article.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Newspaper className="h-12 w-12 text-neutral-300 dark:text-neutral-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="mb-2 flex items-center gap-2 text-xs text-neutral-400 dark:text-neutral-500">
                      <Calendar className="h-3.5 w-3.5" />
                      {article.published_at ? formatDate(article.published_at) : 'Brouillon'}
                    </div>
                    <h3 className="font-semibold text-neutral-900 group-hover:text-primary dark:text-neutral-100 dark:group-hover:text-primary-300">
                      {article.title}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-8 text-center dark:border-neutral-700 dark:bg-neutral-950">
              <Newspaper className="mx-auto mb-3 h-10 w-10 text-neutral-300 dark:text-neutral-600" />
              <p className="text-neutral-500 dark:text-neutral-400">{t('news.empty')}</p>
            </div>
          )}
        </div>
      </section>

      {/* ASSISTANCE CTA — spec Phase 4 */}
      <section className="container-app py-16">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary-900 via-primary to-primary-600 px-6 py-12 text-center text-white sm:px-12 sm:py-16">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-accent/20 blur-3xl" />
          </div>
          <div className="relative mx-auto max-w-2xl">
            <h2 className="text-2xl font-bold sm:text-3xl">{t('home.ctaTitle')}</h2>
            <p className="mt-3 text-white/80">{t('home.ctaSubtitle')}</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/produits">
                <Button size="lg" variant="secondary">
                  {t('home.ctaButton')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/assistance">
                <Button size="lg" variant="tertiary" className="border-white/40 text-white hover:bg-white/10">
                  Assistance <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/assistant">
                <Button size="lg" variant="tertiary" className="border-white/40 text-white hover:bg-white/10">
                  {t('home.tryAssistant')}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}