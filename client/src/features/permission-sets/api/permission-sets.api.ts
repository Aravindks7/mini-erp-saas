import { apiFetch } from '@/lib/api';
import {
  type PermissionSetResponse,
  type CreatePermissionSetInput,
  type UpdatePermissionSetInput,
} from '@shared/contracts/permission-sets.contract';
import type { Permission } from '@shared/contracts/rbac.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const permissionSetsApi = {
  fetchMyPermissions: () => apiFetch<{ permissions: Permission[] }>(API_ENDPOINTS.rbac.permissions),

  fetchAllPermissions: () =>
    apiFetch<{ id: string; description: string | null }[]>(API_ENDPOINTS.rbac.allPermissions),

  fetchPermissionSets: () =>
    apiFetch<PermissionSetResponse[]>(API_ENDPOINTS.rbac.permissionSets.base),

  fetchPermissionSet: (id: string) =>
    apiFetch<PermissionSetResponse>(API_ENDPOINTS.rbac.permissionSets.detail(id)),

  createPermissionSet: (data: CreatePermissionSetInput) =>
    apiFetch<PermissionSetResponse>(API_ENDPOINTS.rbac.permissionSets.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePermissionSet: (id: string, data: UpdatePermissionSetInput) =>
    apiFetch<PermissionSetResponse>(API_ENDPOINTS.rbac.permissionSets.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePermissionSet: (id: string) =>
    apiFetch<{ success: boolean }>(API_ENDPOINTS.rbac.permissionSets.detail(id), {
      method: 'DELETE',
    }),
};
