import * as React from 'react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutGrid, Plus } from 'lucide-react';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';

import { columns as getColumns } from './columns';
import { useAccounts } from '../hooks/accounts.hooks';
import type { AccountResponse } from '../api/accounts.api';
import { AccountForm } from './AccountForm';

const searchSchema = z.object({
  name: z.string().optional(),
});

export function AccountList() {
  const queryClient = useQueryClient();
  const { data: accounts, isLoading, isError } = useAccounts();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [formState, setFormState] = React.useState<{
    isOpen: boolean;
    account?: AccountResponse;
  }>({
    isOpen: false,
  });

  const handleEdit = (account: AccountResponse) => {
    setFormState({ isOpen: true, account });
  };

  const handleAdd = () => {
    setFormState({ isOpen: true, account: undefined });
  };

  const columns = React.useMemo(() => getColumns(handleEdit), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load accounts"
        description="We encountered an error while fetching the Chart of Accounts. Please try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['accounts'] })}
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

  if (!accounts || accounts.length === 0) {
    return (
      <div className="space-y-4 p-6">
        <PageHeader
          title="Chart of Accounts"
          description="Manage your ledger accounts, codes, and classifications."
        />
        <EmptyState
          title="No accounts found"
          description="Start building your ledger by adding your first account (e.g. Cash, Accounts Receivable)."
          icon={LayoutGrid}
        >
          <Can I={PERMISSIONS.FINANCE.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Add Account
            </Button>
          </Can>
        </EmptyState>
        <AccountForm
          isOpen={formState.isOpen}
          onClose={() => setFormState({ isOpen: false })}
          account={formState.account}
        />
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Chart of Accounts"
        description="Your organizational ledger structure. Organize accounts by assets, liabilities, equity, revenue, and expenses."
        enableGlobalSearch
        data={accounts || []}
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
              Add Account
            </Button>
          </Can>
        }
        searchKey="name"
      />

      <AccountForm
        isOpen={formState.isOpen}
        onClose={() => setFormState({ isOpen: false })}
        account={formState.account}
      />
    </>
  );
}
