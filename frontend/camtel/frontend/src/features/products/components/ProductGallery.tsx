import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { clsx } from 'clsx';
import type { ProductImage } from '@/shared/types';

export function ProductGallery({ images, productName }: { images: ProductImage[]; productName: string }) {
  const { t } = useTranslation();
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const [active, setActive] = useState(sorted.find((i) => i.is_primary) ?? sorted[0]);

  if (!sorted.length) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl bg-neutral-100 text-neutral-300 dark:bg-neutral-800">
        CAMTEL
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[4/3] overflow-hidden rounded-xl bg-neutral-100 dark:bg-neutral-800">
        <img
          src={active?.image}
          alt={active?.alt_text ?? productName}
          className="h-full w-full object-cover"
        />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2">
          {sorted.map((img) => (
            <button
              key={img.id}
              onClick={() => setActive(img)}
              aria-label={t('common.a11y.viewImageNumber', { number: img.order + 1 })}
              className={clsx(
                'h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2',
                active?.id === img.id ? 'border-primary' : 'border-transparent',
              )}
            >
              <img src={img.image} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
