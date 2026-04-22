import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rbacApi } from '../api/rbac.api';
import { useTenant } from '@/contexts/TenantContext';
import type {
  CreatePermissionSetInput,
  CreateRoleInput,
  UpdatePermissionSetInput,
  UpdateRoleInput,
} from '@shared/index';

export const rbacKeys = {
  all: ['rbac'] as const,
  myPermissions: (orgId: string | null) => [...rbacKeys.all, 'my-permissions', orgId] as const,
  allPermissions: () => [...rbacKeys.all, 'all-permissions'] as const,
  sets: (orgId: string | null) => [...rbacKeys.all, 'sets', orgId] as const,
  set: (id: string) => [...rbacKeys.all, 'set', id] as const,
  roles: (orgId: string | null) => [...rbacKeys.all, 'roles', orgId] as const,
  role: (id: string) => [...rbacKeys.all, 'role', id] as const,
};

export function useMyPermissions() {
  const { activeOrganizationId } = useTenant();

  return useQuery({
    queryKey: rbacKeys.myPermissions(activeOrganizationId),
    queryFn: async () => {
      if (!activeOrganizationId) return [];
      const response = await rbacApi.fetchMyPermissions();
      // apiFetch throws on !response.ok, so response is the successful data object
      return response.permissions;
    },
    enabled: !!activeOrganizationId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAllPermissions() {
  return useQuery({
    queryKey: rbacKeys.allPermissions(),
    queryFn: async () => {
      return rbacApi.fetchAllPermissions();
    },
  });
}

export function usePermissionSets() {
  const { activeOrganizationId } = useTenant();

  return useQuery({
    queryKey: rbacKeys.sets(activeOrganizationId),
    queryFn: async () => {
      if (!activeOrganizationId) return [];
      return rbacApi.fetchPermissionSets();
    },
    enabled: !!activeOrganizationId,
  });
}

export function usePermissionSet(id: string) {
  return useQuery({
    queryKey: rbacKeys.set(id),
    queryFn: () => rbacApi.fetchPermissionSet(id),
    enabled: !!id,
  });
}

export function useCreatePermissionSet() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreatePermissionSetInput) => rbacApi.createPermissionSet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets(activeOrganizationId) });
    },
  });
}

export function useUpdatePermissionSet(id: string) {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: UpdatePermissionSetInput) => rbacApi.updatePermissionSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.set(id) });
    },
  });
}

export function useDeletePermissionSet() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => rbacApi.deletePermissionSet(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.set(id) });
    },
  });
}

export function useRoles() {
  const { activeOrganizationId } = useTenant();

  return useQuery({
    queryKey: rbacKeys.roles(activeOrganizationId),
    queryFn: async () => {
      if (!activeOrganizationId) return [];
      return rbacApi.fetchRoles();
    },
    enabled: !!activeOrganizationId,
  });
}

export function useRole(id: string) {
  return useQuery({
    queryKey: rbacKeys.role(id),
    queryFn: () => rbacApi.fetchRole(id),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreateRoleInput) => rbacApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(activeOrganizationId) });
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: UpdateRoleInput) => rbacApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.role(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => rbacApi.deleteRole(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.role(id) });
    },
  });
}
