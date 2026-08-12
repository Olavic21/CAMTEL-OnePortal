import { httpClient } from '@/shared/lib/axios';
import { mockAuthStore } from '@/shared/lib/mockAuthStore';
import type { Paginated, User, UserRole } from '@/shared/types';

// Champ password : necessaire pour que le compte cree soit immediatement
// utilisable pour se connecter (voir mockAuthStore en mode demo). Cote vrai
// backend (section 8.8), ce champ reste optionnel : un mot de passe peut
// aussi etre defini via un lien d'activation envoye par e-mail plutot que
// saisi ici par le createur du compte — les deux approches restent valides.
export interface UserPayload {
  username: string;
  email: string;
  role: UserRole;
  password?: string;
}

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false';

function toPaginated(results: User[]): Paginated<User> {
  return { count: results.length, next: null, previous: null, results };
}

// Section 8.8 de la documentation API. En mode demo, toutes les operations
// passent par mockAuthStore (localStorage) plutot que par le reseau, pour
// que le flux Super Admin -> creation de comptes -> connexion individuelle
// soit reellement testable sans backend (voir useAuth.tsx).
export const usersApi = {
  list: (): Promise<Paginated<User>> => {
    if (DEMO_MODE) return Promise.resolve(toPaginated(mockAuthStore.list()));
    return httpClient.get<Paginated<User>>('/users/').then((r) => r.data);
  },

  create: (payload: UserPayload): Promise<User> => {
    if (DEMO_MODE) {
      if (mockAuthStore.usernameOrEmailTaken(payload.username, payload.email)) {
        return Promise.reject(new Error('Identifiant ou e-mail deja utilise'));
      }
      return Promise.resolve(
        mockAuthStore.create({
          username: payload.username,
          email: payload.email,
          role: payload.role,
          password: payload.password ?? '',
        }),
      );
    }
    return httpClient.post<User>('/users/', payload).then((r) => r.data);
  },

  update: (id: number, payload: Partial<Pick<User, 'role' | 'is_active'>>): Promise<User> => {
    if (DEMO_MODE) {
      const updated = mockAuthStore.update(id, payload);
      if (!updated) return Promise.reject(new Error('Utilisateur introuvable'));
      return Promise.resolve(updated);
    }
    return httpClient.patch<User>(`/users/${id}/`, payload).then((r) => r.data);
  },

  remove: (id: number): Promise<void> => {
    if (DEMO_MODE) {
      mockAuthStore.remove(id);
      return Promise.resolve();
    }
    return httpClient.delete(`/users/${id}/`).then(() => undefined);
  },
};
