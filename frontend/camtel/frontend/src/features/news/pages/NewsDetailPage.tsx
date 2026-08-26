import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useNewsDetail } from '../hooks/useNews';
import { Breadcrumbs } from '@/shared/components/Breadcrumbs';
import { Skeleton } from '@/shared/components/Skeleton';
import { formatDate } from '@/shared/utils/format';

export default function NewsDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useNewsDetail(slug);

  if (isLoading) {
    return (
      <div className="container-app max-w-3xl py-10">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-4 h-10 w-full" />
        <Skeleton className="mt-6 h-64 w-full" />
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container-app py-20 text-center text-neutral-500 dark:text-neutral-400">
        {t('news.notFound')}
      </div>
    );
  }

  return (
    <div className="container-app max-w-3xl py-10">
      <Breadcrumbs items={[{ label: t('news.title'), to: '/actualites' }, { label: article.title }]} />
      {article.cover_image && (
        <img src={article.cover_image} alt="" className="mb-6 aspect-[16/9] w-full rounded-xl object-cover" />
      )}
      <p className="text-sm text-neutral-400 dark:text-neutral-500">
        {article.published_at ? formatDate(article.published_at) : ''}
      </p>
      <h1 className="mt-1 text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {article.title}
      </h1>
      <div className="prose prose-neutral dark:prose-invert mt-6 max-w-none whitespace-pre-line text-neutral-700 dark:text-neutral-300">
        {article.content}
      </div>
      <Link to="/actualites" className="mt-10 inline-block text-sm font-medium text-primary hover:underline dark:text-primary-300">
        &larr; {t('news.backToList')}
      </Link>
    </div>
  );
}
