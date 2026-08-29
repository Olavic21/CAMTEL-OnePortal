import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';

/**
 * Etat d'erreur reutilisable (cahier des charges section 30).
 * Affiche un message comprehensible + action Retry.
 */
export function ErrorState({
  title,
  description,
  onRetry,
  compact = false,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  compact?: boolean;
}) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className={`mx-auto flex flex-col items-center justify-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 text-center dark:border-red-900 dark:bg-red-950 ${
        compact ? 'py-8' : 'py-16'
      }`}
    >
      <AlertTriangle className="h-10 w-10 text-red-400" aria-hidden />
      <p className="font-semibold text-red-800 dark:text-red-200">{title ?? t('common.error')}</p>
      {description && (
        <p className="max-w-sm text-sm text-red-700/80 dark:text-red-300/80">{description}</p>
      )}
      {onRetry && (
        <Button variant="tertiary" onClick={onRetry} className="mt-1">
          <RotateCcw className="h-4 w-4" /> {t('common.retry')}
        </Button>
      )}
    </div>
  );
}