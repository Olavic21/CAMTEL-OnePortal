import { useMutation } from '@tanstack/react-query';
import { paymentsApi } from '../api/paymentsApi';

export function useInitiatePayment() {
  return useMutation({ mutationFn: paymentsApi.initiate });
}
