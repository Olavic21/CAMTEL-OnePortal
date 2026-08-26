import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react';
import { useRecommendations } from '../hooks/useRecommendations';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatPrice } from '@/shared/utils/format';

// Section 35 mission : "Recommandations personnalisees... avec une logique
// explicable" — le point differenciant de cette fonctionnalite est d'afficher
// POURQUOI une offre est recommandee (reasons), pas seulement la lister.
export function RecommendedProducts({ productSlug }: { productSlug: string }) {
  const { t } = useTranslation();
  const { data: recommendations, isLoading } = useRecommendations(productSlug);

  if (!isLoading && !recommendations?.length) return null;

  return (
    <div className="mt-10 border-t border-neutral-200 pt-8 dark:border-neutral-800">
      <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-neutral-900 dark:text-neutral-100">
        <Sparkles className="h-5 w-5 text-primary" /> {t('recommendations.title')}
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : recommendations!.map((rec) => (
              <Link key={rec.id} to={`/produits/${rec.slug}`}>
                <Card className="flex h-full flex-col gap-2 p-4">
                  <h3 className="font-medium text-neutral-900 dark:text-neutral-100">{rec.name}</h3>
                  <p className="font-semibold text-primary">{formatPrice(Number(rec.price))}</p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">{rec.reasons.join(' · ')}</p>
                </Card>
              </Link>
            ))}
      </div>
    </div>
  );
}
