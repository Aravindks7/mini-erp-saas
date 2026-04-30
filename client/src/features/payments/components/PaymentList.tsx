import * as React from 'react';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';

import { EntityTable } from '@/components/shared/data-table/EntityTable';
import { AddButton } from '@/components/shared/data-table/AddButton';
import { DataTableFilter } from '@/components/shared/data-table/DataTableFilter';
import { useDataTableState } from '@/hooks/useDataTableState';
import { useTenantPath } from '@/hooks/useTenantPath';
import { PERMISSIONS } from '@shared/index';

import { ErrorState } from '@/components/shared/ErrorState';
import { EmptyState } from '@/components/shared/EmptyState';
import { PageHeader } from '@/components/shared/PageHeader';
import { DeleteConfirmDialog } from '@/components/shared/form/DeleteConfirmDialog';

import { columns, paymentStatusOptions, paymentTypeOptions } from './columns';
import { usePayments, useBulkDeletePayments } from '../hooks/payments.hooks';
import type { PaymentResponse } from '../api/payments.api';

const searchSchema = z.object({
  referenceNumber: z.string().optional(),
  status: z.string().optional(),
  paymentType: z.string().optional(),
});

export function PaymentList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: payments, isLoading, isError } = usePayments();
  const bulkDeleteMutation = useBulkDeletePayments();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  // Bulk Delete State
  const [bulkDeleteState, setBulkDeleteState] = React.useState<{
    isOpen: boolean;
    rows: PaymentResponse[];
    clearSelection: () => void;
  }>({
    isOpen: false,
    rows: [],
    clearSelection: () => {},
  });

  if (isError) {
    return (
      <ErrorState
        title="Failed to load payments"
        description="We encountered an error while fetching the payment history. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['payments'] })}
      />
    );
  }

  const handleBulkDeleteConfirm = async () => {
    const ids = bulkDeleteState.rows.map((r) => r.id);
    try {
      await bulkDeleteMutation.mutateAsync(ids);
      toast.success(`Successfully deleted ${ids.length} payment(s)`);
      bulkDeleteState.clearSelection();
      setBulkDeleteState((prev) => ({ ...prev, isOpen: false }));
    } catch (error) {
      toast.error('Failed to delete selected payments');
      console.error('Bulk delete error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[400px] w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  if (!payments || payments.length === 0) {
    return (
      <>
        <PageHeader title="Payments" />
        <EmptyState
          title="No payments recorded"
          description="You haven't recorded any payments yet. Start by recording a new inbound or outbound payment."
          icon={CreditCard}
        >
          <div className="flex items-center justify-center gap-4">
            <AddButton
              to="/payments/new"
              permission={PERMISSIONS.PAYMENTS.CREATE}
              label="Record Payment"
              className="shadow-lg shadow-primary/20"
            />
          </div>
        </EmptyState>
      </>
    );
  }

  const handleAddClick = () => navigate(getPath('/payments/new'));

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Payments"
        description="Track and manage all inbound and outbound payments."
        enableGlobalSearch
        data={payments || []}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAddClick}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <AddButton
            to="/payments/new"
            permission={PERMISSIONS.PAYMENTS.CREATE}
            label="Record Payment"
          />
        }
        bulkActions={[
          {
            label: 'Delete Selected',
            onAction: (rows: PaymentResponse[], clearSelection) => {
              setBulkDeleteState({ isOpen: true, rows, clearSelection });
            },
            variant: 'destructive',
          },
        ]}
        searchKey="referenceNumber"
        toolbarFilters={(table) => (
          <>
            <DataTableFilter
              column={table.getColumn('status')}
              title="Status"
              options={paymentStatusOptions}
            />
            <DataTableFilter
              column={table.getColumn('paymentType')}
              title="Type"
              options={paymentTypeOptions}
            />
          </>
        )}
      />

      <DeleteConfirmDialog
        isOpen={bulkDeleteState.isOpen}
        onClose={() => setBulkDeleteState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={handleBulkDeleteConfirm}
        title={`Delete ${bulkDeleteState.rows.length} Payment(s)?`}
        description={`Are you sure you want to delete ${bulkDeleteState.rows.length} selected payment(s)? This action is permanent and cannot be undone.`}
        confirmLabel="Delete Payments"
        isLoading={bulkDeleteMutation.isPending}
      />
    </>
  );
}
