import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';

import { columns } from './columns';
import { useJournalEntries } from '../hooks/journal-entries.hooks';
import { useTenantPath } from '@/hooks/useTenantPath';

const searchSchema = z.object({
  reference: z.string().optional(),
});

export function JournalEntryList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: entries, isLoading, isError } = useJournalEntries();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const handleAdd = () => {
    navigate(getPath('/finance/journal-entries/new'));
  };

  if (isError) {
    return (
      <ErrorState
        title="Failed to load ledger"
        description="We encountered an error while fetching the journal entries. Please try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['journal-entries'] })}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <PageHeader
          title="General Ledger"
          description="View and manage all journal entries and financial transactions."
        />
        <EmptyState
          title="No entries found"
          description="You haven't posted any manual journal entries yet."
          icon={BookOpen}
        >
          <Can I={PERMISSIONS.FINANCE.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              New Journal Entry
            </Button>
          </Can>
        </EmptyState>
      </div>
    );
  }

  return (
    <EntityTable
      headerVariant="primary"
      title="General Ledger"
      description="List of all posted journal entries. Monitor transaction history and audit logs."
      enableGlobalSearch
      data={entries || []}
      columns={columns}
      isLoading={isLoading}
      onAddClick={handleAdd}
      viewMode={tableState.viewMode}
      onViewModeChange={tableSetters.setViewMode}
      state={tableState}
      onStateChange={tableSetters}
      onReset={resetAll}
      headerActions={
        <Can I={PERMISSIONS.FINANCE.CREATE}>
          <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
            <Plus className="mr-2 h-4 w-4" />
            New Journal Entry
          </Button>
        </Can>
      }
      searchKey="reference"
    />
  );
}
