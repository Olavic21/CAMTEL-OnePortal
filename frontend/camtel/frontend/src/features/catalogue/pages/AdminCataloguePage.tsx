import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Plus, Filter } from 'lucide-react';
import { useProducts } from '@/features/products/hooks/useProducts';
import { Table, type Column } from '@/shared/components/Table';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { Pagination } from '@/shared/components/Pagination';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/shared/components/Skeleton';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { DataQualityBadge } from '@/shared/components/DataQualityBadge';
import { formatPrice } from '@/shared/utils/format';
import { productStatusMeta, PRODUCT_STATUS_FILTERS } from '@/features/products/lib/status';
import type { Product, Service, Segment } from '@/shared/types';

const ALL_SERVICES: Service[] = ['FIXES', 'MOBILES', 'TRANSPORT', 'DATA_CENTER'];
const ALL_SEGMENTS: Segment[] = ['PARTICULIER', 'PROFESSIONNEL', 'ENTREPRISE', 'ADMINISTRATION'];

export default function AdminCataloguePage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [segment, setSegment] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts({ status: status || undefined, service: service || undefined, segment: segment || undefined, page });
  const { can } = useAuth();

  const columns: Column<Product>[] = [
    { key: 'name', header: t('admin.products.product'), render: (p) => (<div><span className="font-medium">{p.name}</span>{p.source?.quality && <div className="mt-1"><DataQualityBadge quality={p.source.quality} /></div>}</div>) },
    { key: 'service', header: t('admin.catalogue.service'), render: (p) => <ServiceBadge service={p.service} /> },
    { key: 'segment', header: t('admin.catalogue.segment'), render: (p) => <SegmentBadge segment={p.segment} /> },
    { key: 'price', header: t('admin.products.price'), render: (p) => formatPrice(p.price, p.price_unit) },
    {
      key: 'status',
      header: t('common.status'),
      render: (p) => {
        const pub = (p as Product & { is_published?: boolean }).is_published;
        const status = p.status || (pub ? 'VALID' : pub === false ? 'DRAFT' : null);
        const meta = productStatusMeta(status);
        return meta ? <Badge tone={meta.tone}>{meta.label}</Badge> : null;
      },
    },
  ];

  const totalPages = data ? Math.ceil(data.count / 12) : 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('admin.catalogue.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.catalogue.subtitle')}</p>
        </div>
        {can('edit_product_draft') && (<Link to="/admin/produits/nouveau"><Button><Plus className="h-4 w-4" /> {t('admin.products.newProduct')}</Button></Link>)}
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={t('common.status')}>
          <option value="">{t('admin.products.allStatuses')}</option>
          {PRODUCT_STATUS_FILTERS.map((s) => (<option key={s} value={s}>{s}</option>))}
        </Select>
        <Select value={service} onChange={(e) => setService(e.target.value)} aria-label={t('admin.catalogue.serviceFilter')}>
          <option value="">{t('admin.catalogue.allServices')}</option>
          {ALL_SERVICES.map((s) => (<option key={s} value={s}>{t(`services.${s.toLowerCase()}`)}</option>))}
        </Select>
        <Select value={segment} onChange={(e) => setSegment(e.target.value)} aria-label={t('admin.catalogue.segmentFilter')}>
          <option value="">{t('admin.catalogue.allSegments')}</option>
          {ALL_SEGMENTS.map((s) => (<option key={s} value={s}>{t(`segments.${s.toLowerCase()}`)}</option>))}
        </Select>
      </div>
      {isLoading ? (<Skeleton className="h-64 w-full" />) : (data?.results?.length ?? 0) === 0 ? (
        <EmptyState icon={Filter} title={t('admin.catalogue.noResults')} description={t('admin.catalogue.noResultsHint')} />
      ) : (
        <><Table columns={columns} rows={data?.results ?? []} emptyMessage={t('admin.products.empty')} /><div className="mt-6"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div></>
      )}
    </div>
  );
}