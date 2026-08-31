import { httpClient } from '@/shared/lib/axios';

export interface RoleMeta {
  code: string;
  internal: string;
  label: string;
  count: number;
  can_access_backoffice: boolean;
  is_privileged: boolean;
}

export interface RolesResponse {
  roles: RoleMeta[];
}

/** GET /api/v1/roles/ — metadonnees de roles + comptage reel (section 34). */
export const rolesApi = {
  list: (): Promise<RolesResponse> => httpClient.get<RolesResponse>('/roles/').then((r) => r.data),
};