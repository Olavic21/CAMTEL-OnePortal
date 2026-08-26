import { httpClient } from '@/shared/lib/axios';
import type { LoginPayload, LoginResponse, RegisterPayload } from '../types';
import type { User } from '@/shared/types';

export const authApi = {
  login: (payload: LoginPayload) =>
    httpClient.post<LoginResponse>('/auth/login/', payload).then((r) => r.data),
  // Inscription publique — cree un compte role "visitor" et renvoie le meme
  // acces qu'un login classique, pour connecter l'utilisateur immediatement
  // apres son inscription. Le refresh token n'est plus dans la reponse : il
  // arrive en cookie HttpOnly pose directement par le backend.
  register: (payload: RegisterPayload) =>
    httpClient.post<LoginResponse>('/auth/register/', payload).then((r) => r.data),
  refresh: () => httpClient.post<{ access: string }>('/auth/refresh/', {}).then((r) => r.data),
  logout: () => httpClient.post('/auth/logout/', {}),
  me: () => httpClient.get<User>('/auth/me/').then((r) => r.data),
};
