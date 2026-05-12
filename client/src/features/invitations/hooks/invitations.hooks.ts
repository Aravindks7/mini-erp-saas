import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { invitationsApi } from '../api/invitations.api';
import type { InviteMemberInput } from '@shared/contracts/invitations.contract';
import { useTenant } from '@/contexts/TenantContext';
import { activityKeys } from '@/features/activity/hooks/activity.hooks';

export const invitationKeys = {
  all: ['invitations'] as const,
  lists: (orgId: string) => [...invitationKeys.all, 'list', orgId] as const,
};

export const invitationsQuery = (orgId: string) =>
  queryOptions({
    queryKey: invitationKeys.lists(orgId),
    queryFn: () => invitationsApi.fetchInvitations(),
    enabled: !!orgId,
  });

export function useInvitationsQuery() {
  const { activeOrganizationId } = useTenant();
  return useQuery(invitationsQuery(activeOrganizationId || ''));
}

export function useInviteMember() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: InviteMemberInput) => invitationsApi.inviteMember(data),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: invitationKeys.lists(activeOrganizationId || ''),
      });
    },
  });
}

export function useResendInvite() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (inviteId: string) => invitationsApi.resendInvite(inviteId),
    onSuccess: () => {
      return queryClient.invalidateQueries({
        queryKey: invitationKeys.lists(activeOrganizationId || ''),
      });
    },
  });
}

export function useCancelInvite() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (inviteId: string) => invitationsApi.cancelInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      return queryClient.invalidateQueries({
        queryKey: invitationKeys.lists(activeOrganizationId || ''),
      });
    },
  });
}

export function useInvitationsActions() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return {
    invalidateInvitations: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.lists(activeOrganizationId || '') }),
  };
}
