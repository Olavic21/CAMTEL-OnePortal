import { httpClient } from '@/shared/lib/axios';
import type { DashboardSummary } from '@/shared/types';

// Endpoint d'agregation (section 10.2) : /dashboard/summary/
export const dashboardApi = {
  summary: () => httpClient.get<DashboardSummary>('/dashboard/summary/').then((r) => r.data),
};
