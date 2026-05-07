import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { InventoryAdjustmentResponse } from '../../api/inventory.api';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';

interface AdjustmentRowActionsProps {
  row: { original: InventoryAdjustmentResponse };
}

export function AdjustmentRowActions({ row }: AdjustmentRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const adjustment = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(APP_PATHS.inventory.adjustments.detail(adjustment.id))),
      tooltip: 'View Details',
    },
  ];

  return <DataTableRowActions primaryActions={primaryActions} />;
}
