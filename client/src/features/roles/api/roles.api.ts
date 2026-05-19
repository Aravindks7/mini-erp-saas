import { apiFetch } from '@/lib/api';
import {
  type RoleResponse,
  type CreateRoleInput,
  type UpdateRoleInput,
} from '@shared/contracts/roles.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const rolesApi = {
  fetchRoles: () => apiFetch<RoleResponse[]>(API_ENDPOINTS.rbac.roles.base),

  fetchRole: (id: string) => apiFetch<RoleResponse>(API_ENDPOINTS.rbac.roles.detail(id)),

  createRole: (data: CreateRoleInput) =>
    apiFetch<RoleResponse>(API_ENDPOINTS.rbac.roles.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRole: (id: string, data: UpdateRoleInput) =>
    apiFetch<RoleResponse>(API_ENDPOINTS.rbac.roles.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRole: (id: string) =>
    apiFetch<{ success: boolean }>(API_ENDPOINTS.rbac.roles.detail(id), {
      method: 'DELETE',
    }),
};
