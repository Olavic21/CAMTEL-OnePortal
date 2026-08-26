// Abstraction du stockage du token JWT d'acces.
// Le refresh token n'est PLUS gere ici : depuis la PHASE Securite, il vit
// uniquement dans un cookie HttpOnly pose par le backend (illisible en JS,
// donc inaccessible a un XSS). Le navigateur l'envoie automatiquement sur
// /api/v1/auth/refresh/ et /api/v1/auth/logout/ (voir shared/lib/axios.ts,
// withCredentials: true). Seul l'access token (courte duree, 30 min) reste
// gere cote frontend.

const ACCESS_KEY = 'camtel_access_token';

export function setAccessToken(access: string) {
  localStorage.setItem(ACCESS_KEY, access);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
}
