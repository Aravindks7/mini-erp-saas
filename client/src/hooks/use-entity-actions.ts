import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useTenantPath } from './useTenantPath';

interface UseEntityActionsProps {
  /** The base path for the list view (e.g. APP_PATHS.sales.orders.list()) */
  listHref: string;
  /** The base path for the edit view (e.g. (id) => APP_PATHS.sales.orders.edit(id)) */
  editHref?: (id: string) => string;
}

/**
 * Headless Action Hook for Entity Orchestration.
 * Standardizes navigation, toasts, and common ERP rituals.
 * Implements Architecture Pattern C (Headless Actions).
 */
export function useEntityActions({ listHref, editHref }: UseEntityActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();

  /** Standard navigation to list view */
  const handleBack = () => {
    navigate(getPath(listHref));
  };

  /** Standard navigation to edit view */
  const handleEdit = (id: string) => {
    if (editHref) {
      navigate(getPath(editHref(id)));
    }
  };

  /** Success notification with optional message */
  const notifySuccess = (message: string) => {
    toast.success(message);
  };

  /** Error notification with extraction from Error object */
  const notifyError = (error: unknown, defaultMessage = 'An unexpected error occurred') => {
    const message = error instanceof Error ? error.message : String(error);
    toast.error(message || defaultMessage);
  };

  return {
    handleBack,
    handleEdit,
    notifySuccess,
    notifyError,
    getPath, // Re-export for convenience
  };
}
