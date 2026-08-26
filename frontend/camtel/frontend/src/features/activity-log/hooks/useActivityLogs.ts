import { useQuery } from '@tanstack/react-query';
import { activityLogApi, type ActivityLogParams } from '../api/activityLogApi';
import { queryKeys } from '@/shared/lib/queryClient';

export function useActivityLogs(params: ActivityLogParams = {}) {
  return useQuery({
    queryKey: queryKeys.activityLogs.list(params),
    queryFn: () => activityLogApi.list(params),
  });
}
