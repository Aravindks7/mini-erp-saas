import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { LayoutList, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { useDataTableState } from '@/hooks/useDataTableState';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Can } from '@/components/shared/Can';
import { useTenantPath } from '@/hooks/useTenantPath';

import { columns } from './columns';
import { useInvoices } from '../hooks/invoices.hooks';

const searchSchema = z.object({
  documentNumber: z.string().optional(),
});

export function InvoicesList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading, isError } = useInvoices();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const handleAdd = () => {
    navigate(getPath('/invoices/new'));
  };

  if (isError) {
    return (
      <ErrorState
        title="Failed to load invoices"
        description="We encountered an error while fetching the invoices. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['invoices'] })}
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

  if (!invoices || invoices.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Invoices" />
        <EmptyState
          title="No Invoices found"
          description="Start by creating your first invoice or generating one from a sales order."
          icon={LayoutList}
        >
          <Can I={PERMISSIONS.INVOICES.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Invoice
            </Button>
          </Can>
        </EmptyState>
      </div>
    );
  }

  return (
    <EntityTable
      headerVariant="primary"
      title="Invoices"
      description="Manage customer billing and payment statuses."
      enableGlobalSearch
      data={invoices || []}
      columns={columns}
      isLoading={isLoading}
      onAddClick={handleAdd}
      viewMode={tableState.viewMode}
      onViewModeChange={tableSetters.setViewMode}
      state={tableState}
      onStateChange={tableSetters}
      onReset={resetAll}
      headerActions={
        <Can I={PERMISSIONS.INVOICES.CREATE}>
          <Button onClick={handleAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Create Invoice
          </Button>
        </Can>
      }
      searchKey="documentNumber"
    />
  );
}
