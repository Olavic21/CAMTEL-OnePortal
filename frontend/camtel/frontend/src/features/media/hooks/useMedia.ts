import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { mediaApi, type MediaParams } from '../api/mediaApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useMedia(params: MediaParams = {}) {
  return useQuery({
    queryKey: queryKeys.media.list(params),
    queryFn: () => mediaApi.list(params),
  });
}

export function useUploadMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => mediaApi.upload(file),
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