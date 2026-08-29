import { Badge } from './Badge';
import { getServiceMeta } from '@/shared/config/services';
import type { Service } from '@/shared/types';

const SERVICE_TONES: Record<Service, 'primary' | 'info' | 'success' | 'warning'> = {
  FIXES: 'primary',
  MOBILES: 'info',
  TRANSPORT: 'success',
  DATA_CENTER: 'warning',
};

/** Badge de service (Fixes, Mobiles, Transport, Data Center). */
export function ServiceBadge({ service, className }: { service?: Service | null; className?: string }) {
  if (!service) return null;
  const meta = getServiceMeta(service);
  return (
    <Badge tone={SERVICE_TONES[service] ?? 'neutral'} >
      <span className={className}>{meta?.label ?? service}</span>
    </Badge>
  );
}