import type { User } from '@/shared/types';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface LoginResponse {
  access: string;
  refresh: string;
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
