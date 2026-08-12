import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi } from '../api/mediaApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useMediaList(params: { file_type?: string } = {}) {
  return useQuery({ queryKey: [...queryKeys.media.all, params], queryFn: () => mediaApi.list(params) });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, onProgress }: { file: File; onProgress?: (p: number) => void }) =>
      mediaApi.upload(file, onProgress),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.media.all }),
  });
}

export function useDeleteMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => mediaApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.media.all }),
  });
}
