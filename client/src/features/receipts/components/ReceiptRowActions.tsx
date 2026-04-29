import { Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';
import type { ReceiptResponse } from '../api/receipts.api';
import { useTenantPath } from '@/hooks/useTenantPath';

interface ReceiptRowActionsProps {
  row: { original: ReceiptResponse };
}

export function ReceiptRowActions({ row }: ReceiptRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const receipt = row.original;

  const primaryActions: RowAction[] = [
    {
      label: 'View',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/receipts/${receipt.id}`)),
      tooltip: 'View Details',
    },
  ];

  return <DataTableRowActions primaryActions={primaryActions} />;
}
