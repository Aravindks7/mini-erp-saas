import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/lib/auth-client';

export const AUTH_QUERY_KEY = ['session'];

/**
 * Modern TanStack Query hook to manage authentication session state.
 * This provides unified loading, error, and data states across the application.
 */
export const useAuthSession = () => {
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await authClient.getSession();
      if (error) {
        // Better Auth errors are typically objects with message, etc.
        // We throw to let TanStack Query handle the error state.
        throw new Error(error.message || 'Failed to fetch session');
      }
      return data;
    },
    // Session is critical, but we don't want to spam the server.
    // Differentiate between "stale" and "need to refetch".
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    retry: 1,
  });
};
