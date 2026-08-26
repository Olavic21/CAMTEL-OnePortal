import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import i18n from './i18n';
import { getAccessToken, setAccessToken, clearTokens } from './tokenStorage';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  // NB: pas de "Content-Type" global — axios l'inferre automatiquement
  // (application/json pour un objet, multipart/form-data avec boundary pour un
  // FormData), ce qui rend l'upload de fichiers fiable cote navigateur.
  // withCredentials: le refresh token vit en cookie HttpOnly ; il faut que le
  // navigateur l'envoie/l'accepte sur les appels /auth/refresh/ et /auth/logout/.
  withCredentials: true,
});

// Intercepteur de requete : JWT + langue API (Accept-Language)
httpClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const lang = i18n.language?.startsWith('en') ? 'en' : 'fr';
  config.headers['Accept-Language'] = lang;
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<() => void> = [];

// Intercepteur de reponse : tentative de refresh du token sur 401,
// puis rejoue la requete initiale (correspond a /auth/refresh/, section 8.1)
httpClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(httpClient(originalRequest)));
        });
      }

      isRefreshing = true;
      try {
        // Le refresh token voyage via le cookie HttpOnly (withCredentials) —
        // aucun token a transmettre explicitement ici.
        const { data } = await axios.post(
          `${API_BASE_URL}/auth/refresh/`,
          {},
          { withCredentials: true },
        );
        setAccessToken(data.access);
        pendingQueue.forEach((cb) => cb());
        pendingQueue = [];
        return httpClient(originalRequest);
      } catch (refreshError) {
        clearTokens();
        pendingQueue = [];
        const path = window.location.pathname;
        if (path !== '/admin/login' && path !== '/inscription') {
          window.location.assign('/admin/login');
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
