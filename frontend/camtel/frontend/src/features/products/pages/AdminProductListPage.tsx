import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2, CheckCircle } from 'lucide-react';
import { useProducts, useDeleteProduct, usePublishProduct } from '../hooks/useProducts';
import { Table, type Column } from '@/shared/components/Table';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { Pagination } from '@/shared/components/Pagination';
import { useToast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { formatPrice } from '@/shared/utils/format';
import type { Product, ProductStatus } from '@/shared/types';

const statusTone: Record<ProductStatus, 'draft' | 'success' | 'neutral'> = {
  draft: 'draft',
  published: 'success',
  archived: 'neutral',
};

export default function AdminProductListPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts({ status: status || undefined, page });
  const deleteProduct = useDeleteProduct();
  const publishProduct = usePublishProduct();
  const { push } = useToast();
  const { can } = useAuth();

  const statusLabel: Record<ProductStatus, string> = {
    draft: t('admin.products.draft'),
    published: t('admin.products.published'),
    archived: t('admin.products.archived'),
  };

  const columns: Column<Product>[] = [
    { key: 'name', header: t('admin.products.product'), render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'category', header: t('admin.products.category'), render: (p) => p.category?.name ?? '-' },
    { key: 'price', header: t('admin.products.price'), render: (p) => formatPrice(p.price, p.price_unit) },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => <Badge tone={statusTone[p.status]}>{statusLabel[p.status]}</Badge>,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (p) => (
        <div className="flex items-center gap-1">
          {can('edit_product_draft') && (
            <Link to={`/admin/produits/${p.id}/modifier`} className="rounded-lg p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800">
              <Pencil className="h-4 w-4" />
            </Link>
          )}
          {p.status === 'draft' && can('publish_product') && (
            <button
              onClick={() =>
                publishProduct.mutate(p.id, { onSuccess: () => push(t('admin.products.published_toast')) })
              }
              className="rounded-lg p-2 text-accent-600 hover:bg-accent-50 dark:text-accent-400"
              aria-label={t('admin.products.publish')}
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          {can('delete_product') && (
            <button
              onClick={() => {
                if (confirm(t('admin.products.deleteConfirm', { name: p.name }))) {
                  deleteProduct.mutate(p.id, { onSuccess: () => push(t('admin.products.deleted_toast')) });
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

  const totalPages = data ? Math.ceil(data.count / 12) : 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.products.title')}</h1>
        {can('edit_product_draft') && (
          <Link to="/admin/produits/nouveau">
            <Button>
              <Plus className="h-4 w-4" /> {t('admin.products.newProduct')}
            </Button>
          </Link>
        )}
      </div>

      <div className="mb-4 max-w-xs">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('common.status')}>
          <option value="">{t('admin.products.allStatuses')}</option>
          <option value="draft">{t('admin.products.draft')}</option>
          <option value="published">{t('admin.products.published')}</option>
          <option value="archived">{t('admin.products.archived')}</option>
        </Select>
      </div>

      <Table
        columns={columns}
        rows={data?.results ?? []}
        emptyMessage={isLoading ? t('common.loading') : t('admin.products.empty')}
      />

      <div className="mt-6">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
