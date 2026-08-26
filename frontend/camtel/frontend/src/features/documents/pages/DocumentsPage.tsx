import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Download } from 'lucide-react';
import { useDocuments } from '../hooks/useDocuments';
import { Card } from '@/shared/components/Card';
import { Input } from '@/shared/components/Input';
import { Skeleton } from '@/shared/components/Skeleton';
import { EmptyState } from '@/shared/components/EmptyState';
import { Badge } from '@/shared/components/Badge';

// Section 24 mission : ressources documentaires (CGV, guides). Catalogue
// statique cote backend (voir documentsApi.ts) — consultation uniquement.
export default function DocumentsPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const { data: documents, isLoading } = useDocuments(query ? { q: query } : {});

  return (
    <div className="container-app py-10">
      <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 sm:text-3xl">
        {t('documents.title')}
      </h1>
      <p className="mt-1 text-neutral-500 dark:text-neutral-400">{t('documents.subtitle')}</p>

      <div className="mt-6 max-w-sm">
        <Input
          placeholder={t('documents.searchPlaceholder')}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
        ) : !documents?.length ? (
          <div className="sm:col-span-2">
            <EmptyState icon={FileText} title={t('documents.empty')} description={t('documents.emptyHint')} />
          </div>
        ) : (
          documents.map((doc) => (
            <Card key={doc.id} className="flex flex-col gap-3 p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 shrink-0 text-primary" />
                  <h2 className="font-medium text-neutral-900 dark:text-neutral-100">{doc.title}</h2>
                </div>
                <Badge tone="neutral">{doc.kind}</Badge>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">{doc.summary}</p>
              <a
                href={doc.url}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex w-fit items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> {t('documents.download')}
              </a>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
