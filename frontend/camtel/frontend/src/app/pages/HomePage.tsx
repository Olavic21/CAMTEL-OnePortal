import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Compass, Sparkles, Radio, Headset, ShieldCheck, Zap, HeartHandshake, Newspaper, Calendar } from 'lucide-react';
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
      {/* HERO */}
      <section className="border-b border-neutral-200 bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white dark:border-neutral-800">
        <div className="container-app grid grid-cols-1 items-center gap-10 py-16 lg:grid-cols-2 lg:py-24">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="mb-3 inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide">
              {t('home.heroBadge')}
            </p>
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
              {t('home.heroTitleLine1')} <br /> {t('home.heroTitleLine2')}
            </h1>
            <p className="mt-4 max-w-md text-white/80">{t('home.heroSubtitle')}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/services/fixes">
                <Button size="lg" variant="secondary">
                  {t('home.exploreServices')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/trouver-une-solution">
                <Button size="lg" variant="tertiary" className="border-white/40 text-white hover:bg-white/10">
                  <Compass className="h-4 w-4" /> {t('home.findSolution')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* LES 4 UNIVERS */}
      <section className="container-app py-14">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.universTitle')}</h2>
          <p className="mx-auto mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400">{t('home.universSubtitle')}</p>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s, i) => (
            <ServiceCard key={s.service} service={s} index={i} />
          ))}
        </div>
      </section>

      {/* TROUVER MA SOLUTION */}
      <section className="bg-primary-50 py-14 dark:bg-primary-950/40">
        <div className="container-app flex flex-col items-center gap-6 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
            <Compass className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="max-w-xl text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.findSolutionTitle')}</h2>
          <p className="max-w-2xl text-neutral-600 dark:text-neutral-400">{t('home.findSolutionSubtitle')}</p>
          <Link to="/trouver-une-solution">
            <Button size="lg">
              <Sparkles className="h-4 w-4" /> {t('home.findSolution')}
            </Button>
          </Link>
        </div>
      </section>

      {/* OFFRES POPULAIRES */}
      <section className="container-app py-14">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.popularOffers')}</h2>
          <Link to="/produits" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
            {t('home.seeAll')}
          </Link>
        </div>
        {loadingOffers ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[4/3] w-full" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {offers.slice(0, 4).map((p, i) => (
              <ProductCard key={String(p.id)} product={p} index={i} />
            ))}
          </div>
        )}
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

      {/* ASSISTANCE */}
      <section className="container-app py-16 text-center">
        <Card className="mx-auto max-w-2xl p-8">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-100 text-accent-700 dark:bg-accent-900/40 dark:text-accent-300">
            <HeartHandshake className="h-7 w-7" aria-hidden />
          </span>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.assistanceTitle')}</h2>
          <p className="mx-auto mt-2 max-w-md text-neutral-500 dark:text-neutral-400">{t('home.assistanceSubtitle')}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link to="/assistant">
              <Button>{t('home.tryAssistant')}</Button>
            </Link>
            <Link to="/contact">
              <Button variant="tertiary">{t('nav.contact')}</Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}