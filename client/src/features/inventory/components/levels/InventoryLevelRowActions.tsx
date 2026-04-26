import { History } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { InventoryLevelResponse } from '../../api/inventory.api';
import { useTenantPath } from '@/hooks/useTenantPath';

interface InventoryLevelRowActionsProps {
  row: { original: InventoryLevelResponse };
}

export function InventoryLevelRowActions({ row }: InventoryLevelRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const level = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View History',
      icon: <History className="h-4 w-4" />,
      onClick: () => {
        const params = new URLSearchParams();
        params.set('productId', level.productId);
        params.set('warehouseId', level.warehouseId);
        if (level.binId) params.set('binId', level.binId);
        navigate(getPath(`/ledger?${params.toString()}`));
      },
      tooltip: 'View Movement Ledger',
    },
  ];

  return <DataTableRowActions primaryActions={primaryActions} />;
}
