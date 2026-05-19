import { apiFetch } from '@/lib/api';
import {
  type MemberResponse,
  type UpdateMemberRoleInput,
} from '@shared/contracts/members.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const membersApi = {
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
};
