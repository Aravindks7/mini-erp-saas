import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import type { OrganizationResponse } from '@/features/organizations/api/organizations.api';

interface TenantContextProps {
  activeOrganizationId: string | null;
  setActiveOrganizationId: (id: string | null) => void;
  activeOrganization: OrganizationResponse | null;
  setActiveOrganization: (org: OrganizationResponse | null) => void;
  /**
   * Directly updates the organization ID in state and local storage.
   * Useful for immediate synchronization during route transitions.
   */
  syncActiveOrganizationId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  // Initialize state from local storage to persist the selected organization across reloads
  const [activeOrganizationId, setActiveOrganizationId] = useState<string | null>(() => {
    return localStorage.getItem('erp_active_org_id');
  });

  const [activeOrganization, setActiveOrganization] = useState<OrganizationResponse | null>(null);

  /**
   * Synchronous update for both state and storage to avoid flickering.
   */
  const syncActiveOrganizationId = (id: string | null) => {
    if (id) {
      localStorage.setItem('erp_active_org_id', id);
    } else {
      localStorage.removeItem('erp_active_org_id');
    }
    setActiveOrganizationId(id);
  };

  // Sync state changes back to local storage (for setActiveOrganizationId calls)
  useEffect(() => {
    if (activeOrganizationId) {
      localStorage.setItem('erp_active_org_id', activeOrganizationId);
    } else {
      localStorage.removeItem('erp_active_org_id');
    }
  }, [activeOrganizationId]);

  return (
    <TenantContext.Provider
      value={{
        activeOrganizationId,
        setActiveOrganizationId,
        activeOrganization,
        setActiveOrganization,
        syncActiveOrganizationId,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};
