import { Badge } from './Badge';
import { getServiceMeta } from '@/shared/config/services';
import type { Service } from '@/shared/types';

const SERVICE_TONES: Record<Service, 'primary' | 'info' | 'success' | 'warning'> = {
  FIXES: 'primary',
  MOBILES: 'info',
  TRANSPORT: 'success',
  DATA_CENTER: 'warning',
};

/** Valeur acceptee : enum frontend, code backend, ou objet ServiceSerializer. */
type ServiceLike = Service | string | { code?: string; slug?: string } | null | undefined;

/**
 * Normalise n'importe quelle forme de service vers l'enum frontend. Le
 * serializer DRF legacy renvoie parfois `service` comme OBJET imbrique
 * ({id, slug, code, name, ...}) au lieu d'un string : on extrait le code
 * backend pour eviter « Objects are not valid as a React child ».
 */
function toServiceEnum(value: ServiceLike): Service | undefined {
  if (!value) return undefined;
  if (typeof value === 'object') return toServiceEnum(value.code ?? value.slug);
  const v = String(value).toUpperCase();
  if (v === 'FIXES' || v === 'FIXED' || v === 'FIXE') return 'FIXES';
  if (v === 'MOBILES' || v === 'MOBILE') return 'MOBILES';
  if (v === 'TRANSPORT') return 'TRANSPORT';
  if (v === 'DATA_CENTER' || v === 'DATACENTER' || v === 'DATA-CENTER') return 'DATA_CENTER';
  return undefined;
}

/** Badge de service (Fixes, Mobiles, Transport, Data Center). */
export function ServiceBadge({ service, className }: { service?: ServiceLike; className?: string }) {
  const normalized = toServiceEnum(service);
  if (!normalized) return null;
  const meta = getServiceMeta(normalized);
  return (
    <Badge tone={SERVICE_TONES[normalized] ?? 'neutral'}>
      <span className={className}>{meta?.label ?? normalized}</span>
    </Badge>
  );
}