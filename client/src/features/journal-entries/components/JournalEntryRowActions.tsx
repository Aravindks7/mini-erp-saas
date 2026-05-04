import { Eye, Ban, Send, FileEdit, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  DataTableRowActions,
  type RowAction,
} from '@/components/shared/data-table/DataTableRowActions';

import type { JournalEntryResponse } from '../api/journal-entries.api';
import { useVoidJournalEntry } from '../hooks/journal-entries.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';
import { toast } from 'sonner';

interface JournalEntryRowActionsProps {
  row: { original: JournalEntryResponse };
}

export function JournalEntryRowActions({ row }: JournalEntryRowActionsProps) {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [isVoidDialogOpen, setIsVoidDialogOpen] = useState(false);
  const { mutate: voidEntry, status: voidStatus } = useVoidJournalEntry();
  const entry = row.original;

  const isDraft = entry.status === 'draft';
  const isVoid = entry.status === 'void';

  const handleVoid = () => {
    voidEntry(entry.id, {
      onSuccess: () => {
        setIsVoidDialogOpen(false);
        toast.success('Journal entry voided successfully');
      },
      onError: (err: Error) => {
        toast.error(err.message || 'Failed to void journal entry');
      },
    });
  };

  const primaryActions: RowAction[] = [
    {
      label: 'View Details',
      icon: <Eye className="h-4 w-4" />,
      onClick: () => navigate(getPath(`/finance/journal-entries/${entry.id}`)),
      tooltip: 'View Journal Entry',
    },
  ];

  if (isDraft) {
    primaryActions.push(
      {
        label: 'Edit',
        icon: <FileEdit className="h-4 w-4" />,
        onClick: () => navigate(getPath(`/finance/journal-entries/${entry.id}/edit`)),
        tooltip: 'Edit Journal Entry',
      },
      {
        label: 'Post Entry',
        icon: <Send className="h-4 w-4" />,
        onClick: () => {}, // TODO: Implement post logic
        tooltip: 'Post to Ledger',
      },
      {
        label: 'Delete',
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => {}, // TODO: Implement delete logic
        variant: 'destructive',
        tooltip: 'Delete Draft',
      },
    );
  }

  if (entry.status === 'posted') {
    primaryActions.push({
      label: 'Void Entry',
      icon: <Ban className="h-4 w-4" />,
      onClick: () => setIsVoidDialogOpen(true),
      variant: 'destructive',
      tooltip: 'Void this transaction',
    });
  }

  return (
    <>
      <DataTableRowActions primaryActions={primaryActions} />

      <ConfirmDialog
        isOpen={isVoidDialogOpen}
        onClose={() => setIsVoidDialogOpen(false)}
        onConfirm={handleVoid}
        title="Void Journal Entry"
        description={`Are you sure you want to void entry ${entry.reference || entry.id}? This will reverse the impact of this transaction but the record will remain for audit purposes.`}
        confirmLabel="Void Entry"
        variant="destructive"
        isLoading={voidStatus === 'pending'}
      />
    </>
  );
}
