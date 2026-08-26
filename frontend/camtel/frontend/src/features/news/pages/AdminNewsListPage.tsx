import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { useNewsList, useDeleteNews } from '../hooks/useNews';
import { Table, type Column } from '@/shared/components/Table';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { useToast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { News } from '@/shared/types';

export default function AdminNewsListPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useNewsList();
  const deleteNews = useDeleteNews();
  const { push } = useToast();
  const { can } = useAuth();

  const columns: Column<News>[] = [
    { key: 'title', header: t('admin.news.articleTitle'), render: (n) => <span className="font-medium">{n.title}</span> },
    {
      key: 'status',
      header: t('common.status'),
      render: (n) => (
        <Badge tone={n.status === 'published' ? 'success' : 'draft'}>
          {n.status === 'published' ? t('admin.products.published') : t('admin.products.draft')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (n) => (
        <div className="flex items-center gap-1">
          <Link to={`/admin/actualites/${n.id}/modifier`} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
            <Pencil className="h-4 w-4" />
          </Link>
          {can('delete_news') && (
            <button
              onClick={() => {
                if (confirm(t('admin.news.deleteConfirm', { title: n.title }))) {
                  deleteNews.mutate(n.id, { onSuccess: () => push(t('admin.news.deleted_toast')) });
                }
              }}
              className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400"
              aria-label={t('common.delete')}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.news.title')}</h1>
        <Link to="/admin/actualites/nouveau">
          <Button>
            <Plus className="h-4 w-4" /> {t('admin.news.newArticle')}
          </Button>
        </Link>
      </div>
      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.news.empty')}
      />
    </div>
  );
}
