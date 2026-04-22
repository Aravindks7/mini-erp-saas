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

export const rbacApi = {
  fetchMyPermissions: () => apiFetch<{ permissions: Permission[] }>('/rbac/permissions'),

  fetchAllPermissions: () =>
    apiFetch<{ id: string; description: string | null }[]>('/rbac/all-permissions'),

  fetchPermissionSets: () => apiFetch<PermissionSetResponse[]>('/rbac/sets'),

  fetchPermissionSet: (id: string) => apiFetch<PermissionSetResponse>(`/rbac/sets/${id}`),

  createPermissionSet: (data: CreatePermissionSetInput) =>
    apiFetch<PermissionSetResponse>('/rbac/sets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updatePermissionSet: (id: string, data: UpdatePermissionSetInput) =>
    apiFetch<PermissionSetResponse>(`/rbac/sets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deletePermissionSet: (id: string) =>
    apiFetch<{ success: boolean }>(`/rbac/sets/${id}`, {
      method: 'DELETE',
    }),

  fetchRoles: () => apiFetch<RoleResponse[]>('/rbac/roles'),

  fetchRole: (id: string) => apiFetch<RoleResponse>(`/rbac/roles/${id}`),

  createRole: (data: CreateRoleInput) =>
    apiFetch<RoleResponse>('/rbac/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRole: (id: string, data: UpdateRoleInput) =>
    apiFetch<RoleResponse>(`/rbac/roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteRole: (id: string) =>
    apiFetch<{ success: boolean }>(`/rbac/roles/${id}`, {
      method: 'DELETE',
    }),
};
