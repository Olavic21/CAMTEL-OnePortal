import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  Wifi,
  Smartphone,
  Building2,
  Phone,
  Cloud,
  Tv,
  Layers,
  Boxes,
  Radio,
  Headset,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '@/features/products/hooks/useProducts';
import { useCategories } from '@/features/categories/hooks/useCategories';
import { useActivePromotions } from '@/features/promotions/hooks/usePromotions';
import { useNewsList } from '@/features/news/hooks/useNews';
import { ProductCard } from '@/features/products/components/ProductCard';
import { PromotionBanner } from '@/features/promotions/components/PromotionBanner';
import { Skeleton } from '@/shared/components/Skeleton';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { formatDate } from '@/shared/utils/format';

const universes = [
  { label: 'Fixe', icon: Phone, segment: 'grand_public' },
  { label: 'Mobile', icon: Smartphone, segment: 'grand_public' },
  { label: 'Internet', icon: Wifi, segment: 'grand_public' },
  { label: 'Entreprise', icon: Building2, segment: 'entreprise' },
];

const whyItems = [
  { key: 'whyNetwork', icon: Radio },
  { key: 'whySupport', icon: Headset },
  { key: 'whyReliability', icon: ShieldCheck },
  { key: 'whyInnovation', icon: Zap },
];

/** Associe une icone professionnelle a une categorie produit en fonction de son nom. */
function categoryIcon(name: string) {
  const n = name.toLowerCase();
  if (n.includes('internet') || n.includes('fibre') || n.includes('wifi')) return Wifi;
  if (n.includes('mobile') || n.includes('teleph')) return Smartphone;
  if (n.includes('data') || n.includes('cloud')) return Cloud;
  if (n.includes('entreprise') || n.includes('pro')) return Building2;
  if (n.includes('fixe') || n.includes('voix')) return Phone;
  if (n.includes('tv') || n.includes('telev')) return Tv;
  if (n.includes('service')) return Layers;
  return Boxes;
}

export default function HomePage() {
  const { t } = useTranslation();
  const { data: featured, isLoading: loadingProducts } = useProducts({ page: 1 });
  const { data: promotions, isLoading: loadingPromos } = useActivePromotions();
  const { data: news } = useNewsList();
  const { data: categoriesData, isLoading: loadingCategories } = useCategories();

  const topCategories = (categoriesData?.results ?? [])
    .filter((c) => c.parent_id === null)
    .slice(0, 8);

  return (
    <div>
      {/* Hero */}
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
              <Link to="/produits">
                <Button size="lg" variant="secondary">
                  {t('home.exploreCatalog')} <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/entreprise">
                <Button size="lg" className="bg-white/10 text-white hover:bg-white/20">
                  {t('home.enterpriseSolutions')}
                </Button>
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 gap-4"
          >
            {universes.map((u) => (
              <Link
                key={u.label}
                to={`/produits?segment=${u.segment}`}
                className="flex flex-col items-center gap-2 rounded-xl bg-white/10 p-6 text-center backdrop-blur transition-colors hover:bg-white/20"
              >
                <u.icon className="h-6 w-6" />
                <span className="text-sm font-medium">{u.label}</span>
              </Link>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      {(topCategories.length > 0 || loadingCategories) && (
        <section className="container-app py-12">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.categoriesTitle')}</h2>
            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('home.categoriesSubtitle')}</p>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {loadingCategories && !topCategories.length
              ? Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24 w-full" />)
              : topCategories.map((cat, i) => {
                  const Icon = categoryIcon(cat.name);
                  return (
                    <motion.div
                      key={cat.id}
                      initial={{ opacity: 0, y: 12 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-40px' }}
                      transition={{ duration: 0.3, delay: Math.min(i, 6) * 0.04 }}
                    >
                      <Link to={`/produits?category=${cat.slug}`}>
                        <Card className="flex h-full items-center gap-3 p-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary dark:bg-primary-900/30 dark:text-primary-300">
                            <Icon className="h-5 w-5" />
                          </span>
                          <span className="font-medium text-neutral-800 dark:text-neutral-100">{cat.name}</span>
                        </Card>
                      </Link>
                    </motion.div>
                  );
                })}
          </div>
        </section>
      )}

      {/* Promotions */}
      {!loadingPromos && !!promotions?.length && (
        <section className="container-app py-12">
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.currentPromotions')}</h2>
            <Link to="/promotions" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
              {t('home.seeAll')}
            </Link>
          </div>
          <div className="flex snap-x gap-4 overflow-x-auto pb-2">
            {promotions.slice(0, 4).map((promo, i) => (
              <PromotionBanner key={promo.id} promotion={promo} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Produits phares */}
      <section className="container-app py-12">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.featuredProducts')}</h2>
          <Link to="/produits" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
            {t('home.seeCatalog')}
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {loadingProducts
            ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3] w-full" />)
            : (featured?.results ?? []).slice(0, 4).map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
        </div>
      </section>

      {/* Pourquoi CAMTEL */}
      <section className="bg-neutral-100 py-14 dark:bg-neutral-900">
        <div className="container-app">
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
        </div>
      </section>

      {/* Actualites */}
      {(news?.results?.length ?? 0) > 0 && (
        <section className="bg-neutral-100 py-12 dark:bg-neutral-900">
          <div className="container-app">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">{t('home.recentNews')}</h2>
              <Link to="/actualites" className="text-sm font-medium text-primary hover:underline dark:text-primary-300">
                {t('home.seeAll')}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {(news?.results ?? []).slice(0, 3).map((article) => (
                <Link
                  key={article.id}
                  to={`/actualites/${article.slug}`}
                  className="rounded-xl border border-neutral-200 bg-white p-5 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-950"
                >
                  <p className="text-xs text-neutral-400 dark:text-neutral-500">
                    {article.published_at ? formatDate(article.published_at) : ''}
                  </p>
                  <p className="mt-1 font-semibold text-neutral-900 dark:text-neutral-100">{article.title}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA final */}
      <section className="container-app py-16">
        <Card className="overflow-hidden bg-gradient-to-br from-primary-900 via-primary to-primary-700 text-white">
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center sm:px-12">
            <h2 className="text-2xl font-bold sm:text-3xl">{t('home.ctaTitle')}</h2>
            <p className="max-w-xl text-white/80">{t('home.ctaSubtitle')}</p>
            <Link to="/produits" className="mt-2">
              <Button size="lg" variant="secondary">
                {t('home.ctaButton')} <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </Card>
      </section>
    </div>
  );
}
