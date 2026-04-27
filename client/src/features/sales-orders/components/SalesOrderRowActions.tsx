import { FileEdit, Eye, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { SalesOrderResponse } from '../api/sales-orders.api';

interface SalesOrderRowActionsProps {
  row: { original: SalesOrderResponse };
  onFulfill: (so: SalesOrderResponse) => void;
}

export function SalesOrderRowActions({ row, onFulfill }: SalesOrderRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const so = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/sales-orders/${so.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (so.status === 'draft' || so.status === 'approved') {
    primaryActions.push({
      label: 'Fulfill',
      icon: <Truck className="h-4 w-4" />,
      onClick: () => onFulfill(so),
      tooltip: 'Fulfill/Ship Items',
    });

    primaryActions.push({
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/sales-orders/${so.id}/edit`)),
      tooltip: 'Edit Sales Order',
    });
  }

  return <DataTableRowActions primaryActions={primaryActions} />;
}
