import { httpClient } from '@/shared/lib/axios';
import type { ActivityLog, Paginated } from '@/shared/types';

export interface ActivityLogParams {
  user?: number;
  target_model?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
}

// Section 8.9 de la documentation API - reserve au Super Administrateur.
export const activityLogApi = {
  list: (params: ActivityLogParams = {}) =>
    httpClient.get<Paginated<ActivityLog>>('/activitylogs/', { params }).then((r) => r.data),
};
