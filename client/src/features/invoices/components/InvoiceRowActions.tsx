import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import { useTenantPath } from '@/hooks/useTenantPath';
import type { InvoiceResponse } from '../api/invoices.api';

interface InvoiceRowActionsProps {
  row: { original: InvoiceResponse };
}

export function InvoiceRowActions({ row }: InvoiceRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const invoice = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/invoices/${invoice.id}`)),
      tooltip: 'View Details',
    },
  ];

  // We could add 'Print', 'Mark as Paid', etc. later.

  return <DataTableRowActions primaryActions={primaryActions} />;
}
