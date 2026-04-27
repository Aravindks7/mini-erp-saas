import * as React from 'react';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, Plus } from 'lucide-react';
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
import { usePurchaseOrders } from '../hooks/purchase-orders.hooks';
import type { PurchaseOrderResponse } from '../api/purchase-orders.api';
import { ReceivePurchaseOrderSheet } from './ReceivePurchaseOrderSheet';

const searchSchema = z.object({
  documentNumber: z.string().optional(),
});

export function PurchaseOrdersList() {
  const navigate = useNavigate();
  const { getPath } = useTenantPath();
  const queryClient = useQueryClient();
  const { data: pos, isLoading, isError } = usePurchaseOrders();
  const { tableState, tableSetters, resetAll } = useDataTableState(searchSchema);

  const [receiveSheetState, setReceiveSheetState] = React.useState<{
    isOpen: boolean;
    po?: PurchaseOrderResponse;
  }>({
    isOpen: false,
  });

  const handleReceive = (po: PurchaseOrderResponse) => {
    setReceiveSheetState({ isOpen: true, po });
  };

  const handleAdd = () => {
    navigate(getPath('/purchase-orders/new'));
  };

  const columns = React.useMemo(() => getColumns({ onReceive: handleReceive }), []);

  if (isError) {
    return (
      <ErrorState
        title="Failed to load purchase orders"
        description="We encountered an error while fetching the purchase orders. Please check your network or try again."
        onRetry={() => queryClient.invalidateQueries({ queryKey: ['purchase-orders'] })}
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

  if (!pos || pos.length === 0) {
    return (
      <div className="space-y-4">
        <PageHeader title="Purchase Orders" />
        <EmptyState
          title="No Purchase Orders found"
          description="Start by creating your first purchase order to intake inventory."
          icon={ShoppingCart}
        >
          <Can I={PERMISSIONS.PURCHASE_ORDERS.CREATE}>
            <Button onClick={handleAdd} className="shadow-lg shadow-primary/20">
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Can>
        </EmptyState>
        <ReceivePurchaseOrderSheet
          isOpen={receiveSheetState.isOpen}
          onClose={() => setReceiveSheetState({ isOpen: false })}
          po={receiveSheetState.po}
        />
      </div>
    );
  }

  return (
    <>
      <EntityTable
        headerVariant="primary"
        title="Purchase Orders"
        description="Manage your procurement and supplier intake workflows."
        enableGlobalSearch
        data={pos || []}
        columns={columns}
        isLoading={isLoading}
        onAddClick={handleAdd}
        viewMode={tableState.viewMode}
        onViewModeChange={tableSetters.setViewMode}
        state={tableState}
        onStateChange={tableSetters}
        onReset={resetAll}
        headerActions={
          <Can I={PERMISSIONS.PURCHASE_ORDERS.CREATE}>
            <Button onClick={handleAdd}>
              <Plus className="mr-2 h-4 w-4" />
              Create Order
            </Button>
          </Can>
        }
        searchKey="documentNumber"
      />

      <ReceivePurchaseOrderSheet
        isOpen={receiveSheetState.isOpen}
        onClose={() => setReceiveSheetState({ isOpen: false })}
        po={receiveSheetState.po}
      />
    </>
  );
}
