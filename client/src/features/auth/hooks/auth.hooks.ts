import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useTenant } from '@/contexts/TenantContext';
import { resetSidebarState } from '@/lib/navigation-utils';

export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};

export const authSessionQuery = () =>
  queryOptions({
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

export function useAuthSession() {
  return useQuery(authSessionQuery());
}

export function useLoginMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      resetSidebarState();
      return queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useRegisterMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      resetSidebarState();
      return queryClient.invalidateQueries({ queryKey: authKeys.session() });
    },
  });
}

export function useSignOutMutation() {
  const queryClient = useQueryClient();
  const { setActiveOrganizationId } = useTenant();

  return useMutation({
    mutationKey: ['logout'],
    mutationFn: authApi.logout,
    onSuccess: () => {
      // CLEAR SIDEBAR STATE
      resetSidebarState();

      // PREEMPTIVE TEARDOWN: Stop all in-flight queries immediately
      queryClient.cancelQueries();

      // SYNCHRONOUS NEUTRALIZATION: Manually clear the session to avoid 'isPending' flags.
      // This allows guards to redirect to /login immediately without a refetch.
      queryClient.setQueryData(authKeys.session(), null);

      // NUCLEAR REMOVAL: Wipe all other cached data to prevent cross-tenant leakage.
      queryClient.removeQueries();

      // CLEAR TENANT CONTEXT
      setActiveOrganizationId(null);
    },
  });
}
