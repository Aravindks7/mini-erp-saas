import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { InventoryLevelResponse } from '../../api/inventory.api';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';

interface InventoryLevelRowActionsProps {
  row: { original: InventoryLevelResponse };
}

export function InventoryLevelRowActions({ row }: InventoryLevelRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const level = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => {
        navigate(getPath(APP_PATHS.inventory.levels.detail(level.id)));
      },
      tooltip: 'View Level Details',
    },
  ];

  return <DataTableRowActions primaryActions={primaryActions} />;
}
