import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { ShipmentResponse } from '../api/shipments.api';
import { useTenantPath } from '@/hooks/useTenantPath';

interface ShipmentRowActionsProps {
  row: { original: ShipmentResponse };
}

export function ShipmentRowActions({ row }: ShipmentRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const shipment = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/shipments/${shipment.id}`)),
      tooltip: 'View Details',
    },
  ];

  return <DataTableRowActions primaryActions={primaryActions} />;
}
