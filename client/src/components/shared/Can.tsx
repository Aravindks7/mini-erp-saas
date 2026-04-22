import type { ReactNode } from 'react';
import type { Permission } from '@shared/index';
import { usePermission } from '@/hooks/usePermission';

interface CanProps {
  I: Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Declarative component to control UI visibility based on permissions.
 *
 * Usage:
 * <Can I={PERMISSIONS.CUSTOMERS.DELETE}>
 *   <Button>Delete</Button>
 * </Can>
 */
export const Can = ({ I, children, fallback = null }: CanProps) => {
  const hasPermission = usePermission(I);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
