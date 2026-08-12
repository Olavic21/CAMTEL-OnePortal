import { httpClient } from '@/shared/lib/axios';
import type { LoginPayload, LoginResponse, RegisterPayload } from '../types';
import type { User } from '@/shared/types';

export const authApi = {
  login: (payload: LoginPayload) =>
    httpClient.post<LoginResponse>('/auth/login/', payload).then((r) => r.data),
  // Inscription publique — cree un compte role "visitor" et renvoie les
  // memes tokens qu'un login classique, pour connecter l'utilisateur
  // immediatement apres son inscription.
  register: (payload: RegisterPayload) =>
    httpClient.post<LoginResponse>('/auth/register/', payload).then((r) => r.data),
  refresh: (refresh: string) =>
    httpClient.post<{ access: string }>('/auth/refresh/', { refresh }).then((r) => r.data),
  logout: (refresh: string) => httpClient.post('/auth/logout/', { refresh }),
  me: () => httpClient.get<User>('/auth/me/').then((r) => r.data),
};
