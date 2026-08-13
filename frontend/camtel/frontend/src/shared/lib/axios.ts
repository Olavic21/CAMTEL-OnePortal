import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import i18n from './i18n';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './tokenStorage';

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

export const httpClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
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
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        clearTokens();
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          pendingQueue.push(() => resolve(httpClient(originalRequest)));
        });
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });
        setTokens({ access: data.access, refresh: refreshToken });
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
