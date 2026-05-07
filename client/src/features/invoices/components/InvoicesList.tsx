import * as React from 'react';
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

import { getColumns } from './columns';
import { useInvoices, useBulkDeleteInvoices } from '../hooks/invoices.hooks';
import { AddPaymentSheet } from './AddPaymentSheet';
import type { InvoiceResponse } from '../api/invoices.api';
import { Trash2 } from 'lucide-react';
import { APP_PATHS } from '@/lib/paths';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { toast } from 'sonner';

const searchSchema = z.object({
  documentNumber: z.string().optional(),
});

export function InvoicesList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: invoices, isLoading, isError } = useInvoices();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);
  const { mutate: bulkDelete } = useBulkDeleteInvoices();

  const [paymentSheetState, setPaymentSheetState] = React.useState<{
    isOpen: boolean;
    invoice?: InvoiceResponse;
  }>({
    isOpen: false,
  });

  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: InvoiceResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      bulkDelete(ids, {
        onSuccess: () => {
          toast.success(`Successfully processed ${ids.length} invoice(s)`);
          bulkDeleteState.clearSelection();
          setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Failed to process invoices');
        },
      });
    } catch (error) {
      console.error('Bulk delete error:', error);
    }
  };

  const handleAddPayment = React.useCallback((invoice: InvoiceResponse) => {
    setPaymentSheetState({ isOpen: true, invoice });
  }, []);

  const handleAdd = () => {
    navigate(getPath(APP_PATHS.sales.invoices.new()));
  };

  const columns = React.useMemo(
    () => getColumns({ onAddPayment: handleAddPayment }),
    [handleAddPayment],
  );

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
    <>
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
        bulkActions={[
          {
            label: 'Delete/Void',
            icon: <Trash2 className="mr-2 h-4 w-4" />,
            onAction: (rows, clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
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

      {paymentSheetState.invoice && (
        <AddPaymentSheet
          invoice={paymentSheetState.invoice}
          isOpen={paymentSheetState.isOpen}
          onClose={() => setPaymentSheetState({ isOpen: false })}
        />
      )}

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete / Void ${bulkDeleteState.rows.length} Invoice(s)?`}
        description="Are you sure you want to process the selected invoices? Drafts will be permanently deleted, while committed invoices will be marked as void and their ledger entries reversed. This action cannot be undone."
        confirmLabel="Confirm Action"
      />
    </>
  );
}
