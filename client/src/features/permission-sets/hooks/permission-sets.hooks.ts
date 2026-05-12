import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { permissionSetsApi } from '../api/permission-sets.api';
import { useTenant } from '@/contexts/TenantContext';
import type {
  CreatePermissionSetInput,
  UpdatePermissionSetInput,
} from '@shared/contracts/permission-sets.contract';

export const permissionSetKeys = {
  all: ['permission-sets'] as const,
  permissions: {
    all: () => [...permissionSetKeys.all, 'permissions'] as const,
    mine: (orgId: string | null) =>
      [...permissionSetKeys.permissions.all(), 'mine', orgId] as const,
    available: () => [...permissionSetKeys.permissions.all(), 'available'] as const,
  },
  sets: {
    all: () => [...permissionSetKeys.all, 'sets'] as const,
    lists: (orgId: string | null) => [...permissionSetKeys.sets.all(), 'list', orgId] as const,
    details: () => [...permissionSetKeys.sets.all(), 'detail'] as const,
    detail: (id: string) => [...permissionSetKeys.sets.details(), id] as const,
  },
};

// --- Permission Queries ---

export const myPermissionsQuery = (orgId: string | null) =>
  queryOptions({
    queryKey: permissionSetKeys.permissions.mine(orgId),
    queryFn: async () => {
      const response = await permissionSetsApi.fetchMyPermissions();
      return response.permissions;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

export const allPermissionsQuery = () =>
  queryOptions({
    queryKey: permissionSetKeys.permissions.available(),
    queryFn: () => permissionSetsApi.fetchAllPermissions(),
  });

// --- Permission Set Queries ---

export const permissionSetsListQuery = (orgId: string | null) =>
  queryOptions({
    queryKey: permissionSetKeys.sets.lists(orgId),
    queryFn: () => permissionSetsApi.fetchPermissionSets(),
    enabled: !!orgId,
  });

export const permissionSetDetailQuery = (id: string) =>
  queryOptions({
    queryKey: permissionSetKeys.sets.detail(id),
    queryFn: () => permissionSetsApi.fetchPermissionSet(id),
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
  return useQuery(permissionSetsListQuery(activeOrganizationId));
}

export function usePermissionSet(id: string | undefined) {
  return useQuery({
    ...permissionSetDetailQuery(id || ''),
    enabled: !!id,
  });
}

// --- Mutations ---

export function useCreatePermissionSet() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreatePermissionSetInput) => permissionSetsApi.createPermissionSet(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.sets.lists(activeOrganizationId),
      });
    },
  });
}

export function useUpdatePermissionSet(id: string) {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: UpdatePermissionSetInput) => permissionSetsApi.updatePermissionSet(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.sets.lists(activeOrganizationId),
      });
      queryClient.invalidateQueries({ queryKey: permissionSetKeys.sets.detail(id) });
    },
  });
}

export function useDeletePermissionSet() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => permissionSetsApi.deletePermissionSet(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: permissionSetKeys.sets.lists(activeOrganizationId),
      });
      queryClient.invalidateQueries({ queryKey: permissionSetKeys.sets.detail(id) });
    },
  });
}
