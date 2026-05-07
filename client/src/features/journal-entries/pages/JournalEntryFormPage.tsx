import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { toast } from 'sonner';

import { useCreateJournalEntry } from '../hooks/journal-entries.hooks';
import { JournalEntryForm } from '../components/JournalEntryForm';
import { PageContainer } from '@/components/shared/PageContainer';
import { PageHeader } from '@/components/shared/PageHeader';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import { useTenantPath } from '@/hooks/useTenantPath';
import { APP_PATHS } from '@/lib/paths';

import type { CreateJournalEntryInput } from '@shared/contracts/finance.contract';

const FORM_ID = 'journal-entry-form';

export default function JournalEntryFormPage() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { mutateAsync: createEntry, status: createStatus } = useCreateJournalEntry();
  const isSubmitting = createStatus === 'pending';

  const onSubmit = async (data: CreateJournalEntryInput) => {
    const toastId = toast.loading('Posting journal entry...');
    try {
      const result = await createEntry(data);
      toast.success('Journal entry posted successfully', { id: toastId });
      navigate(getPath(APP_PATHS.finance.journalEntries.detail(result.id)));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to post entry';
      toast.error(message, { id: toastId });
    }
  };

  const handleCancel = () => {
    setShowCancelConfirm(true);
  };

  return (
    <PageContainer>
      <PageHeader
        title="New Journal Entry"
        description="Create a manual entry in the general ledger. Ensure debits and credits are balanced."
        backButton={{ onClick: handleCancel }}
        actions={[
          {
            label: 'Cancel',
            variant: 'outline',
            onClick: handleCancel,
            icon: <X className="h-4 w-4" />,
            disabled: isSubmitting,
          },
          {
            label: isSubmitting ? 'Posting...' : 'Post Entry',
            variant: 'default',
            type: 'submit',
            form: FORM_ID,
            icon: isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            ),
            disabled: isSubmitting,
            className: 'min-w-[140px] shadow-lg shadow-primary/20',
          },
        ]}
      />

      <JournalEntryForm onSubmit={onSubmit} formId={FORM_ID} />

      <ConfirmDialog
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => navigate(getPath(APP_PATHS.finance.journalEntries.list()))}
        title="Discard Entry?"
        description="Are you sure you want to discard this journal entry? Any data entered will be lost."
        confirmLabel="Discard Entry"
        variant="destructive"
      />
    </PageContainer>
  );
}
