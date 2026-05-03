import { Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import type { ShipmentResponse } from '../api/shipments.api';
import { useTenantPath } from '@/hooks/useTenantPath';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { useDeleteShipment } from '../hooks/shipments.hooks';

interface ShipmentRowActionsProps {
  row: { original: ShipmentResponse };
}

export function ShipmentRowActions({ row }: ShipmentRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteShipment, isPending: isDeleting } = useDeleteShipment();
  const shipment = row.original;

  const isDraft = shipment.status === 'draft';
  const actionLabel = isDraft ? 'Delete' : 'Void';
  const dialogDescription = isDraft
    ? `Are you sure you want to permanently delete draft shipment ${shipment.shipmentNumber}?`
    : `Are you sure you want to void shipment ${shipment.shipmentNumber}? This will reverse the associated inventory movements.`;

  const handleDelete = () => {
    deleteShipment(shipment.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/shipments/${shipment.id}`)),
      tooltip: 'View Details',
    },
    ...(shipment.status !== 'cancelled'
      ? [
          {
            label: actionLabel,
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setIsDeleteDialogOpen(true),
            variant: 'destructive' as const,
            tooltip: `${actionLabel} Shipment`,
          },
        ]
      : []),
  ];

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`${actionLabel} Shipment`}
        description={dialogDescription}
        confirmLabel={actionLabel}
        isLoading={isDeleting}
      />
    </>
  );
}
