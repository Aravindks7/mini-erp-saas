import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { membersApi } from '../api/members.api';
import type { UpdateMemberRoleInput } from '@shared/contracts/members.contract';
import { useTenant } from '@/contexts/TenantContext';

export const memberKeys = {
  all: ['members'] as const,
  lists: (orgId: string) => [...memberKeys.all, 'list', orgId] as const,
};

export const membersQuery = (orgId: string) =>
  queryOptions({
    queryKey: memberKeys.lists(orgId),
    queryFn: () => membersApi.fetchMembers(),
    enabled: !!orgId,
  });

export function useMembersQuery() {
  const { activeOrganizationId } = useTenant();
  return useQuery(membersQuery(activeOrganizationId || ''));
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateMemberRoleInput }) =>
      membersApi.updateMemberRole(userId, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: memberKeys.lists(activeOrganizationId || ''),
      });
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (userId: string) => membersApi.removeMember(userId),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: memberKeys.lists(activeOrganizationId || ''),
      });
    },
  });
}

export function useMembersActions() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return {
    invalidateMembers: () =>
      queryClient.invalidateQueries({ queryKey: memberKeys.lists(activeOrganizationId || '') }),
  };
}
