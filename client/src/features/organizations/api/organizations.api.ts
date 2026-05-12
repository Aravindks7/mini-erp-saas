import { apiFetch } from '@/lib/api';
import {
  type MemberResponse,
  type UpdateMemberRoleInput,
} from '@shared/contracts/members.contract';
import {
  type InviteResponse,
  type InviteMemberInput,
} from '@shared/contracts/invitations.contract';
import {
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from '@shared/contracts/organizations.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  // Members
  fetchMembers: () => apiFetch<MemberResponse[]>(API_ENDPOINTS.members.base),
  updateMemberRole: (userId: string, data: UpdateMemberRoleInput) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.members.detail(userId), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  removeMember: (userId: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.members.detail(userId), {
      method: 'DELETE',
    }),
  // Invitations
  fetchInvitations: () => apiFetch<InviteResponse[]>(API_ENDPOINTS.invitations.base),
  inviteMember: (data: InviteMemberInput) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.invitations.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendInvite: (inviteId: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.invitations.resend(inviteId), {
      method: 'POST',
    }),
  cancelInvite: (inviteId: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.invitations.detail(inviteId), {
      method: 'DELETE',
    }),
};
