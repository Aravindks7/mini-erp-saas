import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { rolesApi } from '../api/roles.api';
import { useTenant } from '@/contexts/TenantContext';
import type { CreateRoleInput, UpdateRoleInput } from '@shared/contracts/roles.contract';
import { activityKeys } from '@/features/activity/hooks/activity.hooks';

export const roleKeys = {
  all: ['roles'] as const,
  lists: (orgId: string) => [...roleKeys.all, 'list', orgId] as const,
  details: () => [...roleKeys.all, 'detail'] as const,
  detail: (id: string) => [...roleKeys.details(), id] as const,
};

export const rolesListQuery = (orgId: string) =>
  queryOptions({
    queryKey: roleKeys.lists(orgId),
    queryFn: () => rolesApi.fetchRoles(),
    enabled: !!orgId,
  });

export const roleDetailQuery = (id: string) =>
  queryOptions({
    queryKey: roleKeys.detail(id),
    queryFn: () => rolesApi.fetchRole(id),
  });

export function useRolesQuery() {
  const { activeOrganizationId } = useTenant();
  return useQuery(rolesListQuery(activeOrganizationId || ''));
}

export function useRole(id: string | undefined) {
  return useQuery({
    ...roleDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: CreateRoleInput) => rolesApi.createRole(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(activeOrganizationId || '') });
    },
  });
}

export function useUpdateRole(id: string) {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (data: UpdateRoleInput) => rolesApi.updateRole(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(activeOrganizationId || '') });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
    },
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return useMutation({
    mutationFn: (id: string) => rolesApi.deleteRole(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(activeOrganizationId || '') });
      queryClient.invalidateQueries({ queryKey: roleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useRolesActions() {
  const queryClient = useQueryClient();
  const { activeOrganizationId } = useTenant();

  return {
    invalidateRoles: () =>
      queryClient.invalidateQueries({ queryKey: roleKeys.lists(activeOrganizationId || '') }),
  };
}
