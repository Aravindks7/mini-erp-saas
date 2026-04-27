import { FileEdit, Eye, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { PurchaseOrderResponse } from '../api/purchase-orders.api';

interface PurchaseOrderRowActionsProps {
  row: { original: PurchaseOrderResponse };
  onReceive: (po: PurchaseOrderResponse) => void;
}

export function PurchaseOrderRowActions({ row, onReceive }: PurchaseOrderRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const po = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/purchase-orders/${po.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (po.status === 'draft' || po.status === 'sent') {
    primaryActions.push({
      label: 'Receive',
      icon: <Package className="h-4 w-4" />,
      onClick: () => onReceive(po),
      tooltip: 'Receive Items',
    });

    primaryActions.push({
      label: 'Edit',
      icon: <FileEdit className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/purchase-orders/${po.id}/edit`)),
      tooltip: 'Edit Purchase Order',
    });
  }

  return <DataTableRowActions primaryActions={primaryActions} />;
}
