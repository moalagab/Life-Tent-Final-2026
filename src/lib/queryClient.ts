import { QueryClient } from '@tanstack/react-query';

/**
 * Centralized QueryClient with performance-optimized defaults.
 *
 * staleTime:   5 min  — data is fresh, no background refetch on window focus
 * gcTime:      10 min — keep unused queries in cache for 10 minutes
 * retry:       1      — only retry once on failure (network hiccups)
 * refetchOnWindowFocus: false — prevents double-fetch on tab switch
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,       // 5 minutes
      gcTime: 10 * 60 * 1000,         // 10 minutes
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
