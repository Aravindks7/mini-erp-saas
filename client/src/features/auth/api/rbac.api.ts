import { apiFetch } from '@/lib/api';
import type {
  Permission,
  PermissionSetResponse,
  RoleResponse,
  CreatePermissionSetInput,
  CreateRoleInput,
  UpdatePermissionSetInput,
  UpdateRoleInput,
} from '@shared/index';

export type {
  Permission,
  PermissionSetResponse,
  RoleResponse,
  CreatePermissionSetInput,
  CreateRoleInput,
  UpdatePermissionSetInput,
  UpdateRoleInput,
};
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const rbacApi = {
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
