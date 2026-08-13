import { QueryClient } from '@tanstack/react-query';

// Conventions de cles de cache React Query (section "Frontend" de la roadmap) :
// [domaine, ressource, params?] -> ex: ['products', 'list', { category, search }]
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: (params?: object) => ['categories', 'list', params] as const,
    detail: (slug: string) => ['categories', 'detail', slug] as const,
  },
  products: {
    all: ['products'] as const,
    list: (params?: object) => ['products', 'list', params] as const,
    detail: (slug: string) => ['products', 'detail', slug] as const,
    compare: (ids: number[]) => ['products', 'compare', ids] as const,
  },
  news: {
    all: ['news'] as const,
    list: (params?: object) => ['news', 'list', params] as const,
    detail: (slug: string) => ['news', 'detail', slug] as const,
  },
  promotions: {
    all: ['promotions'] as const,
    active: ['promotions', 'active'] as const,
    list: (params?: object) => ['promotions', 'list', params] as const,
  },
  media: {
    all: ['media'] as const,
  },
  contact: {
    all: ['contact'] as const,
    list: (params?: object) => ['contact', 'list', params] as const,
  },
  users: {
    all: ['users'] as const,
  },
  activityLogs: {
    list: (params?: object) => ['activity-logs', 'list', params] as const,
  },
  dashboard: {
    summary: ['dashboard', 'summary'] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
} as const;
