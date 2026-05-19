import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, Upload } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { ExportButton } from '@/components/shared/data-table/ExportButton';
import { ImportModal } from '@/components/shared/data-table/ImportModal';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from '@/components/ui/button';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';
import { usePermissionsStatus } from '@/hooks/usePermission';
import { PageHeader } from '@/components/shared/PageHeader';

import { billStatusOptions, useBillColumns } from './columns';
import { useBillsQuery, useBillsActions, useBulkDeleteBills } from '../hooks/bills.hooks';
import type { BillResponse } from '../api/bills.api';
import { PayBillSheet } from './PayBillSheet';
import { APP_PATHS } from '@/lib/paths';

const searchSchema = z.object({
  referenceNumber: z.string().optional(),
  status: z.string().optional(),
  supplierId: z.string().optional(),
});

export function BillList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const { data: bills, isLoading: isDataLoading, isError } = useBillsQuery();
  const { isLoading: isPermissionsLoading } = usePermissionsStatus();
  const { invalidateBills } = useBillsActions();
  const bulkDeleteMutation = useBulkDeleteBills();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [payBillState, setPayBillState] = React.useState<{
    isOpen: boolean;
    bill: BillResponse | null;
  }>({
    isOpen: false,
    bill: null,
  });

  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: BillResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  const handlePayBill = React.useCallback((bill: BillResponse) => {
    setPayBillState({ isOpen: true, bill });
  }, []);

  const columns = useBillColumns({ onPayBill: handlePayBill });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load bills"
        description="We encountered an error while fetching the vendor bills. Please check your network or try again."
        onRetry={invalidateBills}
      />
    );
  }

  const handleImportSuccess = () => invalidateBills();

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully processed ${ids.length} bill(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch {
      toast.error('Failed to process selected bills');
    }
  };

  const isLoading = isDataLoading || isPermissionsLoading;

  if (!isLoading && (!bills || bills.length === 0)) {
    return (
      <>
        <PageHeader title="Vendor Bills" />
        <EmptyState
          title="No Bills Found"
          description="You haven't recorded any vendor bills yet. Add a new bill or import from a CSV."
          icon={ReceiptText}
        >
          <div className="flex items-center justify-center gap-4">
            <ImportModal
              endpoint="/bills/import"
              templateEndpoint="/bills/import/template"
              onSuccess={handleImportSuccess}
              trigger={
                <Button variant="outline" className="px-6">
                  <Upload className="mr-2 h-4 w-4" />
                  Import CSV
                </Button>
              }
            />
            <AddButton
              to={APP_PATHS.purchasing.bills.new()}
              permission={PERMISSIONS.BILLS.CREATE}
              label="Add Bill"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath(APP_PATHS.purchasing.bills.new()));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Vendor Bills"
        description="Track and manage invoices received from your suppliers."
        enableGlobalSearch
        data={bills || []}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAddClick}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <div className="flex items-center gap-2">
            <ExportButton endpoint="/bills/export" filename="bills-export.csv" />
            <ImportModal
              endpoint="/bills/import"
              templateEndpoint="/bills/import/template"
              onSuccess={handleImportSuccess}
            />
            <AddButton
              to={APP_PATHS.purchasing.bills.new()}
              permission={PERMISSIONS.BILLS.CREATE}
              label="Add Bill"
            />
          </div>
        }
        bulkActions={[
          {
            label: 'Delete / Void Selected',
            onAction: (rows: BillResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="referenceNumber"
        toolbarFilters={(table) => (
          <DataTableFilter
            column={table.getColumn('status')}
            title="Status"
            options={billStatusOptions}
          />
        )}
      />

      {payBillState.bill && (
        <PayBillSheet
          bill={payBillState.bill}
          isOpen={payBillState.isOpen}
          onClose={() => setPayBillState({ isOpen: false, bill: null })}
        />
      )}

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete / Void ${bulkDeleteState.rows.length} Bill(s)?`}
        description="Are you sure you want to process the selected bill(s)? Drafts will be permanently deleted, while open or paid bills will be marked as void and their ledger entries reversed. This action cannot be undone."
        confirmLabel="Confirm Action"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
