import { useQuery } from '@tanstack/react-query';
import { recommendationsApi } from '../api/recommendationsApi';

export function useRecommendations(slug?: string, limit = 3) {
  return useQuery({
    queryKey: ['recommendations', slug, limit],
    queryFn: () => recommendationsApi.forProduct(slug!, limit),
    enabled: !!slug,
  });
}
