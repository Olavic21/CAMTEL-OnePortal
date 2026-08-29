import { useTranslation } from 'react-i18next';
import { Plus, Globe } from 'lucide-react';
import { Button } from '@/shared/components/Button';
import { Card } from '@/shared/components/Card';
import { EmptyState } from '@/shared/components/EmptyState';
import { Skeleton } from '@/shared/components/Skeleton';
import { Badge } from '@/shared/components/Badge';
import { useServices } from '../hooks/useServices';
import { getServiceMeta } from '@/shared/config/services';
import type { Service } from '@/shared/types';

/**
 * Gestion des services Back-Office (/admin/services) — cahier des charges section 20.
 * Les 4 services principaux : Fixes, Mobiles, Transport, Data Center.
 */
const SERVICES: Service[] = ['FIXES', 'MOBILES', 'TRANSPORT', 'DATA_CENTER'];

export default function AdminServicesPage() {
  const { t } = useTranslation();
  const { data: services, isLoading } = useServices();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">{t('admin.services.title')}</h1>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">{t('admin.services.subtitle')}</p>
        </div>
        <Button><Plus className="h-4 w-4" /> {t('admin.services.new')}</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => (<Skeleton key={i} className="h-32 w-full" />))}</div>
      ) : !services || services.length === 0 ? (
        <EmptyState icon={Globe} title={t('admin.services.empty')} description={t('admin.services.emptyHint')} />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((serviceType) => {
            const meta = getServiceMeta(serviceType);
            const serviceData = services.find((s) => s.slug === serviceType.toLowerCase());
            return (
              <Card key={serviceType} className="p-5">
                <div className="flex items-center gap-3">
                  {meta?.icon && <meta.icon className="h-8 w-8 text-primary" aria-hidden />}
                  <div>
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">{meta?.label ?? serviceType}</h3>
                    <Badge tone={serviceData?.is_active ? 'success' : 'neutral'}>
                      {serviceData?.is_active ? t('common.active') : t('common.inactive')}
                    </Badge>
                  </div>
                </div>
                {serviceData?.description && (
                  <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{serviceData.description}</p>
                )}
                <p className="mt-2 text-xs text-neutral-400">{t('admin.services.productCount', { count: serviceData?.product_count ?? 0 })}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}