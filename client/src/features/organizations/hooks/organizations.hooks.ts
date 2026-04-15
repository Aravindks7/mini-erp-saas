import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { organizationsApi } from '../api/organizations.api';
import type {
  CreateOrganizationInput,
  UpdateOrganizationInput,
  UpdateMemberRoleInput,
} from '@shared/contracts/organizations.contract';

export const organizationKeys = {
  all: ['organizations'] as const,
  mine: () => [...organizationKeys.all, 'mine'] as const,
  members: (orgId: string) => [...organizationKeys.all, orgId, 'members'] as const,
  invites: (orgId: string) => [...organizationKeys.all, orgId, 'invites'] as const,
};

export function useOrganizations() {
  return useQuery({
    queryKey: organizationKeys.mine(),
    queryFn: organizationsApi.fetchMyOrganizations,
  });
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

export function useMembers(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.members(orgId),
    queryFn: () => organizationsApi.fetchMembers(orgId),
  });
}

export function useUpdateMemberRole(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }: { userId: string; data: UpdateMemberRoleInput }) =>
      organizationsApi.updateMemberRole(orgId, userId, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useRemoveMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => organizationsApi.removeMember(orgId, userId),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.members(orgId) });
    },
  });
}

export function useInvitations(orgId: string) {
  return useQuery({
    queryKey: organizationKeys.invites(orgId),
    queryFn: () => organizationsApi.fetchInvitations(orgId),
  });
}

export function useInviteMember(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { userEmail: string; role: 'admin' | 'employee' }) =>
      organizationsApi.inviteMember(orgId, data),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) });
    },
  });
}

export function useResendInvite(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => organizationsApi.resendInvite(orgId, inviteId),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) });
    },
  });
}

export function useCancelInvite(orgId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => organizationsApi.cancelInvite(orgId, inviteId),
    onSuccess: () => {
      return queryClient.invalidateQueries({ queryKey: organizationKeys.invites(orgId) });
    },
  });
}
