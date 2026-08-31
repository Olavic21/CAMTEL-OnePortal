import { useQuery } from '@tanstack/react-query';
import { rolesApi } from '../api/rolesApi';

/** Metadonnees des roles + nombre reel de comptes par role (GET /roles/). */
export function useRoles() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
    staleTime: 60 * 1000,
  });
}