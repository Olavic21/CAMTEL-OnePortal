import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, File as FileIcon } from 'lucide-react';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useMedia, useUploadMedia, useDeleteMedia } from '../hooks/useMedia';
import { Button } from '@/shared/components/Button';
import { Badge } from '@/shared/components/Badge';
import { Pagination } from '@/shared/components/Pagination';
import { useToast } from '@/shared/components/Toast';
import { formatDateTime } from '@/shared/utils/format';
import type { MediaFile } from '@/shared/types';

const PAGE_SIZE = 20;

// Extrait le nom de fichier depuis l'URL renvoyee par le backend
// (MediaFile.file est un chemin absolu type "/media/products/couv.png").
function fileNameFromUrl(url: string): string {
  try {
    return decodeURIComponent(url.split('/').filter(Boolean).pop() ?? url);
  } catch {
    return url;
  }
}

// Mediatheque (roadmap MVP) : upload d'images/documents + consultation en grille.
// Upload : permission upload_media. Suppression : permission delete_media (Admin)
// uniquement, coherence avec le backend (IsAdminUser sur destroy).
export default function AdminMediaLibraryPage() {
  const { t } = useTranslation();
  const { can } = useAuth();
  const { push } = useToast();
  const [page, setPage] = useState(1);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useMedia({ page });
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();

  const canUpload = can('upload_media');
  const canDelete = can('delete_media');
  const totalPages = data ? Math.ceil(data.count / PAGE_SIZE) : 1;

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await uploadMedia.mutateAsync(file);
      push(t('admin.media.uploaded_toast'));
    } catch {
      push(t('admin.media.uploadError_toast'), 'error');
    }
  }

  function handleDelete(file: MediaFile) {
    if (!confirm(t('admin.media.deleteConfirm'))) return;
    deleteMedia.mutate(file.id, {
      onSuccess: () => push(t('admin.media.deleted_toast')),
      onError: () => push(t('admin.media.uploadError_toast'), 'error'),
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.media.title')}</h1>
        {canUpload && (
          <Button onClick={() => fileInputRef.current?.click()} isLoading={uploadMedia.isPending}>
            <Upload className="h-4 w-4" /> {t('admin.media.upload')}
          </Button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="sr-only"
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
          onChange={handleFileChange}
        />
      </div>

      {isLoading ? (
        <p className="py-10 text-center text-neutral-400">{t('common.loading')}</p>
      ) : (data?.results.length ?? 0) === 0 ? (
        <p className="py-10 text-center text-neutral-400">{t('admin.media.empty')}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {data?.results.map((file) => {
            const isImage = file.file_type === 'image';
            const name = fileNameFromUrl(file.file);
            return (
              <div
                key={file.id}
                className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950"
              >
                <div className="aspect-video bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center">
                  {isImage ? (
                    <img src={file.file} alt={name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <FileIcon className="h-10 w-10 text-neutral-400 dark:text-neutral-500" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2 border-t border-neutral-100 px-3 py-2.5 dark:border-neutral-800">
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium" title={name}>
                      {name}
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone={isImage ? 'primary' : 'neutral'}>
                        {isImage ? t('admin.media.image') : t('admin.media.document')}
                      </Badge>
                      <span className="text-xs text-neutral-500 dark:text-neutral-400">
                        {formatDateTime(file.uploaded_at)}
                      </span>
                    </div>
                  </div>
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(file)}
                      className="shrink-0 rounded-lg p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6">
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}