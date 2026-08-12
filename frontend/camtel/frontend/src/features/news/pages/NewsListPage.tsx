import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNewsList } from '../hooks/useNews';
import { Card } from '@/shared/components/Card';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { formatDate } from '@/shared/utils/format';
import { Newspaper } from 'lucide-react';

export default function NewsListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useNewsList();

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('news.title')}
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('news.subtitle')}</p>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)
          : data?.results.map((article) => (
              <Link key={article.id} to={`/actualites/${article.slug}`}>
                <Card className="flex h-full flex-col overflow-hidden">
                  <div className="aspect-[16/9] w-full bg-neutral-100 dark:bg-neutral-800">
                    {article.cover_image && (
                      <img src={article.cover_image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-4">
                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                      {article.published_at ? formatDate(article.published_at) : 'Brouillon'}
                    </p>
                    <h2 className="font-semibold text-neutral-900 dark:text-neutral-100">{article.title}</h2>
                  </div>
                </Card>
              </Link>
            ))}
      </div>

      {!isLoading && !data?.results.length && <EmptyState icon={Newspaper} title={t('news.empty')} />}
    </div>
  );
}
