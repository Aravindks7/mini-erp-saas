import type { Permission } from '@shared/index';
import { useMyPermissions } from '@/features/auth/hooks/rbac.hooks';

/**
 * Hook to check if the current user has a specific permission in the active tenant.
 */
export function usePermission(requiredPermission: Permission) {
  const { data: permissions, isLoading } = useMyPermissions();

  if (isLoading || !permissions) {
    return false;
  }

  return permissions.includes(requiredPermission);
}
