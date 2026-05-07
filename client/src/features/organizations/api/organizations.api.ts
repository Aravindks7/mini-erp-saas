import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import {
  memberResponseSchema,
  inviteResponseSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type UpdateMemberRoleInput,
  type InviteMemberInput,
} from '@shared/contracts/organizations.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export type OrganizationMember = z.infer<typeof memberResponseSchema>;
export type OrganizationInvite = z.infer<typeof inviteResponseSchema>;

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  defaultCountry: string;
  createdAt: string;
  roleId: string;
  roleName: string;
}

export const organizationsApi = {
  fetchMyOrganizations: () => apiFetch<OrganizationResponse[]>(API_ENDPOINTS.organizations.base),
  createOrganization: (data: CreateOrganizationInput) =>
    apiFetch<OrganizationResponse>(API_ENDPOINTS.organizations.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrganization: (id: string, data: UpdateOrganizationInput) =>
    apiFetch<OrganizationResponse>(API_ENDPOINTS.organizations.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteOrganization: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.organizations.detail(id), {
      method: 'DELETE',
    }),
  fetchMembers: (organizationId: string) =>
    apiFetch<OrganizationMember[]>(API_ENDPOINTS.organizations.members(organizationId)),
  updateMemberRole: (organizationId: string, userId: string, data: UpdateMemberRoleInput) =>
    apiFetch<{ message: string }>(
      API_ENDPOINTS.organizations.memberDetail(organizationId, userId),
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
    ),
  removeMember: (organizationId: string, userId: string) =>
    apiFetch<{ message: string }>(
      API_ENDPOINTS.organizations.memberDetail(organizationId, userId),
      {
        method: 'DELETE',
      },
    ),
  fetchInvitations: (organizationId: string) =>
    apiFetch<OrganizationInvite[]>(API_ENDPOINTS.organizations.invites(organizationId)),
  inviteMember: (organizationId: string, data: InviteMemberInput) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.organizations.invites(organizationId), {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendInvite: (organizationId: string, inviteId: string) =>
    apiFetch<{ message: string }>(
      API_ENDPOINTS.organizations.resendInvite(organizationId, inviteId),
      {
        method: 'POST',
      },
    ),
  cancelInvite: (organizationId: string, inviteId: string) =>
    apiFetch<{ message: string }>(
      API_ENDPOINTS.organizations.inviteDetail(organizationId, inviteId),
      {
        method: 'DELETE',
      },
    ),
};
