import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { organizationsApi, type OrganizationResponse } from '../api/organizations.api';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '@shared/contracts/organizations.contract';
import type { UpdateMemberRoleInput } from '@shared/contracts/members.contract';
import type { InviteMemberInput } from '@shared/contracts/invitations.contract';
import { activityKeys } from '@/features/activity/hooks/activity.hooks';

export const organizationKeys = {
  all: ['organizations'] as const,
  mine: () => [...organizationKeys.all, 'mine'] as const,
  members: (orgId: string) => [...organizationKeys.all, orgId, 'members'] as const,
  invites: (orgId: string) => [...organizationKeys.all, orgId, 'invites'] as const,
};

export const currencyKeys = {
  all: (orgId?: string | null) => ['currencies', orgId].filter(Boolean) as string[],
};

export const organizationListQuery = () =>
  queryOptions({
    queryKey: organizationKeys.mine(),
    queryFn: organizationsApi.fetchMyOrganizations,
  });

export const organizationMembersQuery = (orgId: string) =>
  queryOptions({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationsApi.fetchMembers(),
  });

export const organizationInvitesQuery = (orgId: string) =>
  queryOptions({
    queryKey: organizationKeys.invites(orgId),
    queryFn: () => organizationsApi.fetchInvitations(),
  });

export function useOrganizationsQuery() {
  return useQuery(organizationListQuery());
}

export function useOrganizationsActions(orgId?: string | null) {
  const queryClient = useQueryClient();
  return {
    invalidateOrganizations: () =>
      queryClient.invalidateQueries({ queryKey: organizationKeys.mine() }),
    invalidateCurrencies: () =>
      queryClient.invalidateQueries({ queryKey: currencyKeys.all(orgId) }),
    setOrganizationsData: (
      updater: (old: OrganizationResponse[] | undefined) => OrganizationResponse[] | undefined,
    ) => queryClient.setQueryData(organizationKeys.mine(), updater),
  };
}

export function useCreateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateOrganizationInput) => organizationsApi.createOrganization(data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.mine() });
    },
  });
}

export function useUpdateOrganization(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateOrganizationInput) => organizationsApi.updateOrganization(id, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.mine() });
    },
  });
}

export function useDeleteOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => organizationsApi.deleteOrganization(id),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.mine() });
    },
  });
}

export function useMembersQuery(orgId: string) {
  return useQuery({
    ...organizationMembersQuery(orgId),
    enabled: !!orgId,
  });
}

export function useMembersActions(orgId: string) {
  const queryClient = useQueryClient();
  return {
    invalidateMembers: () =>
      queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) }),
  };
}

export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateMemberRoleInput }) =>
      organizationsApi.updateMemberRole(userId, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => organizationsApi.removeMember(userId),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useInvitationsQuery(orgId: string) {
  return useQuery({
    ...organizationInvitesQuery(orgId),
    enabled: !!orgId,
  });
}

export function useInvitationsActions(orgId: string) {
  const queryClient = useQueryClient();
  return {
    invalidateInvitations: () =>
      queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) }),
  };
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: InviteMemberInput) => organizationsApi.inviteMember(data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) });
    },
  });
}

export function useResendInvite(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => organizationsApi.resendInvite(inviteId),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) });
    },
  });
}

export function useCancelInvite(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => organizationsApi.cancelInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
      return queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) });
    },
  });
}
