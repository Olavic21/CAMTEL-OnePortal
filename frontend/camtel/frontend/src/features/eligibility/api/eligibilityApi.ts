import { httpClient } from '@/shared/lib/axios';
import type { EligibilityResult } from '@/shared/types';

// Section 28 mission : verification d'eligibilite avant souscription
// (couche d'abstraction — MockEligibilityProvider en dev, endpoint public).
export const eligibilityApi = {
  check: (payload: { product_id: number; address?: string; phone?: string }) =>
    httpClient.post<EligibilityResult>('/eligibility/check/', payload).then((r) => r.data),
};
