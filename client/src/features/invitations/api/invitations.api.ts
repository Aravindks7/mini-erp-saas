import { apiFetch } from '@/lib/api';
import {
  type InviteResponse,
  type InviteMemberInput,
} from '@shared/contracts/invitations.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const invitationsApi = {
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
