import { apiFetch } from '@/lib/api';
import { z } from 'zod';
import {
  memberResponseSchema,
  inviteResponseSchema,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type UpdateMemberRoleInput,
} from '@shared/contracts/organizations.contract';

export type OrganizationMember = z.infer<typeof memberResponseSchema>;
export type OrganizationInvite = z.infer<typeof inviteResponseSchema>;

export interface OrganizationResponse {
  id: string;
  name: string;
  slug: string;
  defaultCountry: string;
  createdAt: string;
  role?: string;
}

export const organizationsApi = {
  fetchMyOrganizations: () => apiFetch<OrganizationResponse[]>('/organizations'),
  createOrganization: (data: CreateOrganizationInput) =>
    apiFetch<OrganizationResponse>('/organizations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateOrganization: (id: string, data: UpdateOrganizationInput) =>
    apiFetch<OrganizationResponse>(`/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteOrganization: (id: string) =>
    apiFetch<{ message: string }>(`/organizations/${id}`, {
      method: 'DELETE',
    }),
  fetchMembers: (organizationId: string) =>
    apiFetch<OrganizationMember[]>(`/organizations/${organizationId}/members`),
  updateMemberRole: (organizationId: string, userId: string, data: UpdateMemberRoleInput) =>
    apiFetch<{ message: string }>(`/organizations/${organizationId}/members/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  removeMember: (organizationId: string, userId: string) =>
    apiFetch<{ message: string }>(`/organizations/${organizationId}/members/${userId}`, {
      method: 'DELETE',
    }),
  fetchInvitations: (organizationId: string) =>
    apiFetch<OrganizationInvite[]>(`/organizations/${organizationId}/invites`),
  inviteMember: (organizationId: string, data: { userEmail: string; role: 'admin' | 'employee' }) =>
    apiFetch<{ message: string }>(`/organizations/${organizationId}/invites`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  resendInvite: (organizationId: string, inviteId: string) =>
    apiFetch<{ message: string }>(`/organizations/${organizationId}/invites/${inviteId}/resend`, {
      method: 'POST',
    }),
  cancelInvite: (organizationId: string, inviteId: string) =>
    apiFetch<{ message: string }>(`/organizations/${organizationId}/invites/${inviteId}`, {
      method: 'DELETE',
    }),
};
