// Abstraction du stockage des tokens JWT (access + refresh).
// Isole le reste de l'app d'un eventuel changement de strategie de stockage.

const ACCESS_KEY = 'camtel_access_token';
const REFRESH_KEY = 'camtel_refresh_token';

export interface TokenPair {
  access: string;
  refresh: string;
}

export function setTokens(tokens: Partial<TokenPair>) {
  if (tokens.access) localStorage.setItem(ACCESS_KEY, tokens.access);
  if (tokens.refresh) localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}
