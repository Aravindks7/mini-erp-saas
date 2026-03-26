import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // Minimize retries for non-idempotent operations or standard data fetches
      refetchOnWindowFocus: false, // Prevent excessive refetching during development
      staleTime: 5 * 60 * 1000, // Data remains fresh for 5 minutes
    },
    mutations: {
      retry: 0, // Never retry mutations to prevent duplicate side effects
    },
  },
});
