import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api/dashboardApi';
import { analyticsApi } from '../api/analyticsApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useDashboardSummary() {
  return useQuery({ queryKey: queryKeys.dashboard.summary, queryFn: dashboardApi.summary });
}

export function useAnalyticsSummary(days = 30) {
  return useQuery({
    queryKey: [...queryKeys.dashboard.summary, 'analytics', days] as const,
    queryFn: () => analyticsApi.summary(days),
  });
}
