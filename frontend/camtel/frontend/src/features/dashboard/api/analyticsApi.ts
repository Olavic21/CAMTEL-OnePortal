import { httpClient } from '@/shared/lib/axios';
import type { AnalyticsSummary } from '@/shared/types';

// Section 20 mission : GET /analytics/summary/?days=N — reserve a
// IsAdminOrEditor cote backend (voir apps/core/views.py AnalyticsSummaryView).
export const analyticsApi = {
  summary: (days = 30) =>
    httpClient.get<AnalyticsSummary>('/analytics/summary/', { params: { days } }).then((r) => r.data),
};
