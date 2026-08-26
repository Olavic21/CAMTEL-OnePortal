import { useQuery } from '@tanstack/react-query';
import { productsApi } from '../api/productsApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useProductCompare(ids: number[]) {
  return useQuery({
    queryKey: queryKeys.products.compare(ids),
    queryFn: () => productsApi.compare(ids),
    enabled: ids.length > 0,
  });
}
