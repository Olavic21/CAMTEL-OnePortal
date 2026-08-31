import { useState } from 'react';
import { Package } from 'lucide-react';
import { getServiceMeta } from '@/shared/config/services';
import type { Service } from '@/shared/types';

/**
 * Placeholder produit CAMTEL (regles #13/#14) — affiche quand un produit n'a
 * aucune image ou quand son image est cassee (404, format invalide...).
 * volontaire et professionnel : icone produit + nom du service, jamais une
 * image cassée ni un texte brut.
 */
export function ProductImageFallback({ service }: { service?: Service | string | null }) {
  const serviceLabel = getServiceMeta(service as Service | undefined)?.label ?? 'CAMTEL';
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2.5 bg-gradient-to-br from-primary-50 via-white to-neutral-100 dark:from-primary-950/50 dark:via-neutral-900 dark:to-neutral-900"
      aria-hidden
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-card ring-1 ring-primary-100 dark:bg-neutral-800 dark:ring-neutral-700">
        <Package className="h-6 w-6 text-primary dark:text-primary-300" />
      </span>
      <span className="max-w-[85%] truncate px-2 text-center text-[11px] font-bold uppercase tracking-[0.14em] text-primary/70 dark:text-primary-300/80">
        {serviceLabel}
      </span>
    </div>
  );
}

/**
 * Zone image produit homogene (regle #13) :
 * - ratio impose par le conteneur (aspect-*) ;
 * - object-cover : jamais d'image deformee ;
 * - fallback automatique si `src` absent OU en erreur de chargement.
 */
export function ProductImage({
  src,
  alt,
  service,
  className,
}: {
  src?: string | null;
  alt: string;
  service?: Service | string | null;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return <ProductImageFallback service={service} />;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className ?? 'h-full w-full object-cover'}
    />
  );
}
