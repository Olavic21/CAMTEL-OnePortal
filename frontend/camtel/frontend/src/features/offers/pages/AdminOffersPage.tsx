import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Tag } from 'lucide-react';
import { useProducts } from '@/features/products/hooks/useProducts';
import { Table, type Column } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import { Select } from '@/shared/components/Input';
import { Pagination } from '@/shared/components/Pagination';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/shared/components/Skeleton';
import { ServiceBadge } from '@/shared/components/ServiceBadge';
import { SegmentBadge } from '@/shared/components/SegmentBadge';
import { formatPrice } from '@/shared/utils/format';
import type { Product, Service, Segment } from '@/shared/types';

const ALL_SERVICES: Service[] = ['FIXES', 'MOBILES', 'TRANSPORT', 'DATA_CENTER'];
const ALL_SEGMENTS: Segment[] = ['PARTICULIER', 'PROFESSIONNEL', 'ENTREPRISE', 'ADMINISTRATION'];

/**
 * Gestion des offres Back-Office (/admin/offres) — cahier des charges section 20.
 * Vue dediee aux offres promotionnelles et speciales avec filtres service/segment.
 */
export default function AdminOffersPage() {
  const { t } = useTranslation();
  const [service, setService] = useState('');
  const [segment, setSegment] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useProducts({ service: service || undefined, segment: segment || undefined, page });

  const columns: Column<Product>[] = [
    { key: 'name', header: t('admin.offers.name'), render: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'service', header: t('admin.offers.service'), render: (p) => <ServiceBadge service={p.service} /> },
    { key: 'segment', header: t('admin.offers.segment'), render: (p) => <SegmentBadge segment={p.segment} /> },
    { key: 'price', header: t('admin.offers.price'), render: (p) => formatPrice(p.price, p.price_unit) },
    { key: 'status', header: t('common.status'), render: (p) => <Badge tone={p.status === 'published' ? 'success' : 'draft'}>{p.status === 'published' ? t('admin.products.published') : t('admin.products.draft')}</Badge> },
  ];

  const totalPages = data ? Math.ceil(data.count / 12) : 1;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-semibold">{t('admin.offers.title')}</h1>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.offers.subtitle')}</p>
      </div>
      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={service} onChange={(e) => setService(e.target.value)} aria-label={t('admin.offers.serviceFilter')}>
          <option value="">{t('admin.offers.allServices')}</option>
          {ALL_SERVICES.map((s) => (<option key={s} value={s}>{t(`services.${s.toLowerCase()}`)}</option>))}
        </Select>
        <Select value={segment} onChange={(e) => setSegment(e.target.value)} aria-label={t('admin.offers.segmentFilter')}>
          <option value="">{t('admin.offers.allSegments')}</option>
          {ALL_SEGMENTS.map((s) => (<option key={s} value={s}>{t(`segments.${s.toLowerCase()}`)}</option>))}
        </Select>
      </div>
      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : (data?.results?.length ?? 0) === 0 ? (
        <EmptyState icon={Tag} title={t('admin.offers.empty')} description={t('admin.offers.emptyHint')} />
      ) : (
        <><Table columns={columns} rows={data?.results ?? []} emptyMessage={t('admin.offers.empty')} /><div className="mt-6"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div></>
      )}
    </div>
  );
}