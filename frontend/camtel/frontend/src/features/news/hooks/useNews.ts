import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { newsApi, type NewsPayload } from '../api/newsApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useNewsList(params: { page?: number } = {}) {
  return useQuery({ queryKey: queryKeys.news.list(params), queryFn: () => newsApi.list(params) });
}

export function useNewsDetail(slug: string | undefined) {
  return useQuery({
    queryKey: queryKeys.news.detail(slug ?? ''),
    queryFn: () => newsApi.detail(slug as string),
    enabled: !!slug,
  });
}

export function useCreateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: NewsPayload) => newsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.news.all }),
  });
}

export function useUpdateNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<NewsPayload> }) =>
      newsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.news.all }),
  });
}

export function useDeleteNews() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => newsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.news.all }),
  });
}
