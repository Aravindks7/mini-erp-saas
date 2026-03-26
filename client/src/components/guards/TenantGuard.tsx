import { type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTenant } from '../../contexts/TenantContext';

export const TenantGuard = ({ children }: { children: ReactNode }) => {
  const { activeOrganizationId } = useTenant();
  const location = useLocation();

  // If the user has not selected an organization, force them to do so
  if (!activeOrganizationId) {
    return <Navigate to="/select-organization" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
