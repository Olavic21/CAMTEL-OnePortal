import type { User } from '@/shared/types';

export interface LoginPayload {
  username: string;
  password: string;
}

// Le refresh token n'apparait plus ici : il est pose par le backend en
// cookie HttpOnly (voir shared/lib/tokenStorage.ts), jamais lu en JS.
export interface LoginResponse {
  access: string;
}

// Inscription publique : tout visiteur peut creer un compte, qui recoit
// automatiquement le role "visitor" cote backend (jamais choisi par le
// formulaire lui-meme, pour eviter toute auto-promotion).
export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
}

export type { User };
