import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/components/Button';

export default function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <p className="text-lg font-medium text-neutral-800 dark:text-neutral-100">{t('notFound.title')}</p>
      <p className="max-w-sm text-sm text-neutral-500 dark:text-neutral-400">{t('notFound.body')}</p>
      <Link to="/">
        <Button>{t('notFound.backHome')}</Button>
      </Link>
    </div>
  );
}
