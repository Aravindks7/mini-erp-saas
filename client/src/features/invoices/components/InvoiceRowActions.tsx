import { Eye, DollarSign, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { useTenantPath } from '@/hooks/useTenantPath';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import type { InvoiceResponse } from '../api/invoices.api';
import { useDeleteInvoice } from '../hooks/invoices.hooks';

interface InvoiceRowActionsProps {
  row: { original: InvoiceResponse };
  onAddPayment?: (invoice: InvoiceResponse) => void;
}

export function InvoiceRowActions({ row, onAddPayment }: InvoiceRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { mutate: deleteInvoice, status: deleteStatus } = useDeleteInvoice();
  const invoice = row.original;

  const isDraft = invoice.status === 'draft';
  const actionLabel = isDraft ? 'Delete' : 'Void';

  const handleDelete = () => {
    deleteInvoice(invoice.id, {
      onSuccess: () => setIsDeleteDialogOpen(false),
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/invoices/${invoice.id}`)),
      tooltip: 'View Details',
    },
  ];

  if (onAddPayment && invoice.status === 'open') {
    primaryActions.push({
      label: 'Record Payment',
      icon: <DollarSign className="h-4 w-4 text-emerald-600" />,
      onClick: () => onAddPayment(invoice),
      tooltip: 'Record Payment',
    });
  }

  if (invoice.status !== 'void') {
    primaryActions.push({
      label: actionLabel,
      icon: <Trash2 className="h-4 w-4" />,
      onClick: () => setIsDeleteDialogOpen(true),
      variant: 'destructive',
      tooltip: `${actionLabel} Invoice`,
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <DeleteConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title={`${actionLabel} Invoice`}
        description={
          isDraft
            ? `Are you sure you want to delete invoice ${invoice.documentNumber}? This action cannot be undone.`
            : `Are you sure you want to void invoice ${invoice.documentNumber}? This will create a reversal entry in the ledger.`
        }
        isLoading={deleteStatus === 'pending'}
        confirmLabel={actionLabel}
      />
    </>
  );
}
