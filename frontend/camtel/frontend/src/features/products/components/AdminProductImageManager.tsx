import { useRef, useState } from 'react';
import { Star, Trash2, ArrowLeft, ArrowRight, Upload } from 'lucide-react';
import { clsx } from 'clsx';
import { useTranslation } from 'react-i18next';
import {
  useUploadProductImage,
  useUpdateProductImage,
  useDeleteProductImage,
} from '../hooks/useProductImages';
import { useToast } from '@/shared/components/Toast';
import type { ProductImage } from '@/shared/types';

// Galerie multi-images (roadmap V2) : upload, image principale, reordonnancement,
// suppression. Visible uniquement en edition (un produit doit deja exister
// cote backend pour recevoir des images liees).
export function AdminProductImageManager({
  productId,
  productSlug,
  images,
}: {
  productId: number;
  productSlug: string;
  images: ProductImage[];
}) {
  const { t } = useTranslation();
  const sorted = [...images].sort((a, b) => a.order - b.order);
  const uploadImage = useUploadProductImage(productId, productSlug);
  const updateImage = useUpdateProductImage(productId, productSlug);
  const deleteImage = useDeleteProductImage(productId, productSlug);
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      await uploadImage.mutateAsync({ file });
      push(t('admin.products.gallery.uploaded_toast'));
    } catch {
      push(t('admin.products.gallery.uploadError_toast'), 'error');
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function setPrimary(imageId: number) {
    updateImage.mutate(
      { imageId, payload: { is_primary: true } },
      { onSuccess: () => push(t('admin.products.gallery.primaryUpdated_toast')) },
    );
  }

  function move(image: ProductImage, direction: -1 | 1) {
    const currentIndex = sorted.findIndex((img) => img.id === image.id);
    const targetIndex = currentIndex + direction;
    if (targetIndex < 0 || targetIndex >= sorted.length) return;
    const target = sorted[targetIndex];
    // On permute les deux positions "order" pour reordonner la galerie.
    updateImage.mutate({ imageId: image.id, payload: { order: target.order } });
    updateImage.mutate({ imageId: target.id, payload: { order: image.order } });
  }

  function remove(imageId: number) {
    if (confirm(t('admin.products.gallery.deleteConfirm'))) {
      deleteImage.mutate(imageId, { onSuccess: () => push(t('admin.products.gallery.deleted_toast')) });
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">{t('admin.products.gallery.title')}</p>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium hover:bg-neutral-50 disabled:opacity-50 dark:border-neutral-800 dark:hover:bg-neutral-800"
        >
          <Upload className="h-3.5 w-3.5" /> {isUploading ? t('admin.products.gallery.uploading') : t('admin.products.gallery.add')}
        </button>
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleUpload} />
      </div>

      {sorted.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-300 px-4 py-6 text-center text-sm text-neutral-400 dark:text-neutral-500">
          {t('admin.products.gallery.empty')}
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {sorted.map((image, index) => (
            <div key={image.id} className="group relative overflow-hidden rounded-lg border border-neutral-200 dark:border-neutral-800">
              <div className="aspect-square bg-neutral-100 dark:bg-neutral-800">
                <img src={image.image} alt={image.alt_text ?? ''} className="h-full w-full object-cover" />
              </div>

              {image.is_primary && (
                <span className="absolute left-1 top-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-white">
                  {t('admin.products.gallery.primary')}
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-1 bg-black/60 px-1.5 py-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(image, -1)}
                  disabled={index === 0}
                  aria-label="Deplacer vers la gauche"
                  className="rounded p-1 text-white disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPrimary(image.id)}
                  aria-label="Definir comme image principale"
                  className={clsx('rounded p-1', image.is_primary ? 'text-accent-400' : 'text-white')}
                >
                  <Star className="h-3.5 w-3.5" fill={image.is_primary ? 'currentColor' : 'none'} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(image.id)}
                  aria-label="Supprimer l'image"
                  className="rounded p-1 text-red-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => move(image, 1)}
                  disabled={index === sorted.length - 1}
                  aria-label="Deplacer vers la droite"
                  className="rounded p-1 text-white disabled:opacity-30"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
