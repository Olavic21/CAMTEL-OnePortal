import { useMutation } from '@tanstack/react-query';
import { eligibilityApi } from '../api/eligibilityApi';

export function useCheckEligibility() {
  return useMutation({ mutationFn: eligibilityApi.check });
}
