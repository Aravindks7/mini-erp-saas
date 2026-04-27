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
import { useSalesOrders } from '../hooks/sales-orders.hooks';
import type { SalesOrderResponse } from '../api/sales-orders.api';
import { FulfillSalesOrderSheet } from './FulfillSalesOrderSheet';

const searchSchema = z.object({
  documentNumber: z.string().optional(),
});

export function SalesOrdersList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: sos, isLoading, isError } = useSalesOrders();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [fulfillSheetState, setFulfillSheetState] = React.useState<{
    isOpen: boolean;
    so?: SalesOrderResponse;
  }>({
    isOpen: false,
  });

  const handleFulfill = (so: SalesOrderResponse) => {
    setFulfillSheetState({ isOpen: true, so });
  };

  const handleAdd = () => {
    navigate(getPath('/sales-orders/new'));
  };

  const columns = React.useMemo(() => getColumns({ onFulfill: handleFulfill }), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load sales orders"
        description="We encountered an error while fetching the sales orders. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['sales-orders'] })}
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

  if (!sos || sos.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Sales Orders" />
        <EmptyState
          title="No Sales Orders found"
          description="Start by creating your first sales order to capture customer demand."
          icon={LayoutList}
        >
          <Can I={PERMISSIONS.SALES_ORDERS.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Can>
        </EmptyState>
        <FulfillSalesOrderSheet
          isOpen={fulfillSheetState.isOpen}
          onClose={() => setFulfillSheetState({ isOpen: false })}
          so={fulfillSheetState.so}
        />
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Sales Orders"
        description="Manage customer orders and fulfillment workflows."
        enableGlobalSearch
        data={sos || []}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAdd}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.SALES_ORDERS.CREATE}>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Can>
        }
        searchKey="documentNumber"
      />

      <FulfillSalesOrderSheet
        isOpen={fulfillSheetState.isOpen}
        onClose={() => setFulfillSheetState({ isOpen: false })}
        so={fulfillSheetState.so}
      />
    </>
  );
}
