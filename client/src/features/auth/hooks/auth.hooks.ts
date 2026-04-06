import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useTenant } from '@/contexts/TenantContext';

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

export function useAuthSession() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async () => {
      const response = await authApi.getSession();
      if (response.error) {
        throw new Error(response.error.message);
      }
      return response.data;
    },
    staleTime: 0, // Always verify with the server
    retry: false,
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  const { setActiveOrganizationId } = useTenant();

  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      // PREEMPTIVE TEARDOWN: Stop all in-flight queries immediately
      queryClient.cancelQueries();

      // SYNCHRONOUS NEUTRALIZATION: Manually clear the session to avoid 'isPending' flags.
      // This allows guards to redirect to /login immediately without a refetch.
      queryClient.setQueryData(authKeys.session(), null);

      // NUCLEAR REMOVAL: Wipe all other cached data to prevent cross-tenant leakage.
      // We use removeQueries instead of clear() to be more specific if needed,
      // but clear() is also acceptable here as a secondary measure.
      queryClient.removeQueries();

      // CLEAR TENANT CONTEXT
      setActiveOrganizationId(null);
    },
  });
}
