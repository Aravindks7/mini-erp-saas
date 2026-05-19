import type { Permission } from '@shared/index';
import { useMyPermissionsQuery } from '@/features/permission-sets';

/**
 * Hook to check if the current user has a specific permission in the active tenant.
 */
export function usePermission(requiredPermission: Permission) {
  const { data: permissions, isLoading } = useMyPermissionsQuery();

  if (isLoading || !permissions) {
    return false;
  }

  return permissions.includes(requiredPermission);
}

/**
 * Hook to check the loading status of the RBAC system.
 * Useful for coordinating unified loading states in feature modules.
 */
export function usePermissionsStatus() {
  const { isLoading, isFetched, isError } = useMyPermissionsQuery();

  return {
    isLoading,
    isReady: isFetched || isError, // Consider ready if fetched or failed (to avoid infinite blocks)
  };
}
