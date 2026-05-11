import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
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
  permissions: {
    all: () => [...rbacKeys.all, 'permissions'] as const,
    mine: (orgId: string | null) => [...rbacKeys.permissions.all(), 'mine', orgId] as const,
    available: () => [...rbacKeys.permissions.all(), 'available'] as const,
  },
  sets: {
    all: () => [...rbacKeys.all, 'sets'] as const,
    lists: (orgId: string | null) => [...rbacKeys.sets.all(), 'list', orgId] as const,
    details: () => [...rbacKeys.sets.all(), 'detail'] as const,
    detail: (id: string) => [...rbacKeys.sets.details(), id] as const,
  },
  roles: {
    all: () => [...rbacKeys.all, 'roles'] as const,
    lists: (orgId: string | null) => [...rbacKeys.roles.all(), 'list', orgId] as const,
    details: () => [...rbacKeys.roles.all(), 'detail'] as const,
    detail: (id: string) => [...rbacKeys.roles.details(), id] as const,
  },
};

// --- Permission Queries ---

export const myPermissionsQuery = (orgId: string | null) =>
  queryOptions({
    queryKey: rbacKeys.permissions.mine(orgId),
    queryFn: async () => {
      const response = await rbacApi.fetchMyPermissions();
      return response.permissions;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

export const allPermissionsQuery = () =>
  queryOptions({
    queryKey: rbacKeys.permissions.available(),
    queryFn: () => rbacApi.fetchAllPermissions(),
  });

// --- Permission Set Queries ---

export const permissionSetsQuery = (orgId: string | null) =>
  queryOptions({
    queryKey: rbacKeys.sets.lists(orgId),
    queryFn: () => rbacApi.fetchPermissionSets(),
    enabled: !!orgId,
  });

export const permissionSetDetailQuery = (id: string) =>
  queryOptions({
    queryKey: rbacKeys.sets.detail(id),
    queryFn: () => rbacApi.fetchPermissionSet(id),
  });

// --- Role Queries ---

export const rolesListQuery = (orgId: string | null) =>
  queryOptions({
    queryKey: rbacKeys.roles.lists(orgId),
    queryFn: () => rbacApi.fetchRoles(),
    enabled: !!orgId,
  });

export const roleDetailQuery = (id: string) =>
  queryOptions({
    queryKey: rbacKeys.roles.detail(id),
    queryFn: () => rbacApi.fetchRole(id),
  });

// --- Hooks ---

export function useMyPermissionsQuery() {
  const { activeOrganizationId } = useTenant();
  return useQuery(myPermissionsQuery(activeOrganizationId));
}

export function useAllPermissionsQuery() {
  return useQuery(allPermissionsQuery());
}

export function usePermissionSetsQuery() {
  const { activeOrganizationId } = useTenant();
  return useQuery(permissionSetsQuery(activeOrganizationId));
}

export function usePermissionSet(id: string | undefined) {
  return useQuery({
    ...permissionSetDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useRolesQuery() {
  const { activeOrganizationId } = useTenant();
  return useQuery(rolesListQuery(activeOrganizationId));
}

export function useRbacActions() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: rbacKeys.all }),
    invalidatePermissions: () =>
      queryClient.invalidateQueries({ queryKey: rbacKeys.permissions.all() }),
    invalidateSets: () =>
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets.lists(activeOrganizationId) }),
    invalidateRoles: () =>
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles.lists(activeOrganizationId) }),
  };
}

export function useRole(id: string | undefined) {
  return useQuery({
    ...roleDetailQuery(id || ''),
    enabled: !!id,
  });
}

// --- Mutations ---

export function useCreatePermissionSet() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreatePermissionSetInput) => rbacApi.createPermissionSet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets.lists(activeOrganizationId) });
    },
  });
}

export function useUpdatePermissionSet(id: string) {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: UpdatePermissionSetInput) => rbacApi.updatePermissionSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets.lists(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets.detail(id) });
    },
  });
}

export function useDeletePermissionSet() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => rbacApi.deletePermissionSet(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets.lists(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.sets.detail(id) });
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreateRoleInput) => rbacApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles.lists(activeOrganizationId) });
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: UpdateRoleInput) => rbacApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles.lists(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => rbacApi.deleteRole(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles.lists(activeOrganizationId) });
      queryClient.invalidateQueries({ queryKey: rbacKeys.roles.detail(id) });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
