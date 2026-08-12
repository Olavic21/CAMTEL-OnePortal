import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useDashboardSummary() {
  return useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: dashboardApi.summary });
}
