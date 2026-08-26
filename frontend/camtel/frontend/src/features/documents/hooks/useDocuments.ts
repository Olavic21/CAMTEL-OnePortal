import { useQuery } from '@tanstack/react-query';
import { documentsApi } from '../api/documentsApi';

export function useDocuments(params: { product_id?: number; kind?: string; q?: string } = {}) {
  return useQuery({
    queryKey: ['documents', params],
    queryFn: () => documentsApi.list(params),
  });
}
