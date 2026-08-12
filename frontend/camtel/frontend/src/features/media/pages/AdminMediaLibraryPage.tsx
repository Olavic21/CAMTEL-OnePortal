import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Trash2, FileText, Image as ImageIcon } from 'lucide-react';
import { useMediaList, useUploadMedia, useDeleteMedia } from '../hooks/useMedia';
import { Button } from '@/shared/components/Button';
import { EmptyState } from '@/shared/components/EmptyState';
import { useToast } from '@/shared/components/Toast';
import { useAuth } from '@/features/auth/hooks/useAuth';

// Mediatheque centralisee (section 10.7) : upload ouvert a tous les roles
// internes, suppression reservee a Super Admin / Admin (delete_media).
export default function AdminMediaLibraryPage() {
  const { t } = useTranslation();
  const { data, isLoading } = useMediaList();
  const uploadMedia = useUploadMedia();
  const deleteMedia = useDeleteMedia();
  const { push } = useToast();
  const { can } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadMedia.mutateAsync({ file, onProgress: setProgress });
      push(t('admin.media.uploaded_toast'));
    } catch {
      push(t('admin.media.uploadError_toast'), 'error');
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('admin.media.title')}</h1>
        <Button onClick={() => inputRef.current?.click()} isLoading={progress !== null}>
          <Upload className="h-4 w-4" /> {progress !== null ? t('admin.media.uploading') : t('admin.media.upload')}
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleFileChange} />
      </div>

      {!isLoading && !data?.results.length ? (
        <EmptyState icon={ImageIcon} title={t('admin.media.empty')} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          {data?.results.map((media) => (
            <div key={media.id} className="group relative overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="flex aspect-square items-center justify-center bg-neutral-100 dark:bg-neutral-800">
                {media.file_type === 'image' ? (
                  <img src={media.file} alt="" className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-8 w-8 text-neutral-400 dark:text-neutral-500" />
                )}
              </div>
              {can('delete_media') && (
                <button
                  onClick={() => deleteMedia.mutate(media.id)}
                  aria-label={t('common.delete')}
                  className="absolute right-1 top-1 hidden rounded-lg bg-white/90 p-1.5 text-red-600 shadow group-hover:block dark:text-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
