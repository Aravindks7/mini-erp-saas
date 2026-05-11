import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inventoryApi } from '../api/inventory.api';
import type { CreateInventoryAdjustmentInput } from '@shared/contracts/inventory-adjustments.contract';
import type { CreateInventoryTransferInput } from '@shared/contracts/inventory-transfers.contract';
import { activityKeys } from '../../activity/hooks/activity.hooks';

export const inventoryKeys = {
  all: ['inventory'] as const,
  levels: {
    all: () => [...inventoryKeys.all, 'levels'] as const,
    lists: () => [...inventoryKeys.levels.all(), 'list'] as const,
    details: () => [...inventoryKeys.levels.all(), 'detail'] as const,
    detail: (id: string) => [...inventoryKeys.levels.details(), id] as const,
  },
  ledger: {
    all: () => [...inventoryKeys.all, 'ledger'] as const,
    global: () => [...inventoryKeys.ledger.all(), 'global'] as const,
    level: (id: string) => [...inventoryKeys.ledger.all(), 'level', id] as const,
  },
  adjustments: {
    all: () => [...inventoryKeys.all, 'adjustments'] as const,
    lists: () => [...inventoryKeys.adjustments.all(), 'list'] as const,
    details: () => [...inventoryKeys.adjustments.all(), 'detail'] as const,
    detail: (id: string) => [...inventoryKeys.adjustments.details(), id] as const,
  },
  transfers: {
    all: () => [...inventoryKeys.all, 'transfers'] as const,
    lists: () => [...inventoryKeys.transfers.all(), 'list'] as const,
    details: () => [...inventoryKeys.transfers.all(), 'detail'] as const,
    detail: (id: string) => [...inventoryKeys.transfers.details(), id] as const,
  },
};

// --- Levels Queries ---

export const inventoryLevelsQuery = () =>
  queryOptions({
    queryKey: inventoryKeys.levels.lists(),
    queryFn: inventoryApi.fetchLevels,
    staleTime: 5000,
  });

export const inventoryLevelDetailQuery = (id: string) =>
  queryOptions({
    queryKey: inventoryKeys.levels.detail(id),
    queryFn: () => inventoryApi.fetchLevel(id),
  });

// --- Ledger Queries ---

export const inventoryLedgerQuery = () =>
  queryOptions({
    queryKey: inventoryKeys.ledger.global(),
    queryFn: () => inventoryApi.fetchLedger(),
  });

export const inventoryLevelLedgerQuery = (id: string) =>
  queryOptions({
    queryKey: inventoryKeys.ledger.level(id),
    queryFn: () => inventoryApi.fetchLevelLedger(id),
  });

// --- Adjustments Queries ---

export const inventoryAdjustmentsQuery = () =>
  queryOptions({
    queryKey: inventoryKeys.adjustments.lists(),
    queryFn: inventoryApi.fetchAdjustments,
    staleTime: 5000,
  });

export const inventoryAdjustmentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: inventoryKeys.adjustments.detail(id),
    queryFn: () => inventoryApi.fetchAdjustment(id),
  });

// --- Transfers Queries ---

export const inventoryTransfersQuery = () =>
  queryOptions({
    queryKey: inventoryKeys.transfers.lists(),
    queryFn: inventoryApi.fetchTransfers,
    staleTime: 5000,
  });

export const inventoryTransferDetailQuery = (id: string) =>
  queryOptions({
    queryKey: inventoryKeys.transfers.detail(id),
    queryFn: () => inventoryApi.fetchTransfer(id),
  });

// --- Hooks ---

export function useInventoryLevelsQuery() {
  return useQuery(inventoryLevelsQuery());
}

export function useInventoryLevelsActions() {
  const queryClient = useQueryClient();
  return {
    invalidateLevels: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels.lists() }),
  };
}

export function useInventoryLevel(id: string | undefined) {
  return useQuery({
    ...inventoryLevelDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useInventoryLedgerQuery() {
  return useQuery(inventoryLedgerQuery());
}

export function useInventoryLedgerActions() {
  const queryClient = useQueryClient();
  return {
    invalidateLedger: () => queryClient.invalidateQueries({ queryKey: inventoryKeys.ledger.all() }),
  };
}

export function useInventoryLevelLedger(id: string | undefined) {
  return useQuery({
    ...inventoryLevelLedgerQuery(id || ''),
    enabled: !!id,
  });
}

export function useInventoryAdjustmentsQuery() {
  return useQuery(inventoryAdjustmentsQuery());
}

export function useInventoryAdjustmentsActions() {
  const queryClient = useQueryClient();
  return {
    invalidateAdjustments: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments.lists() }),
  };
}

export function useInventoryAdjustment(id: string | undefined) {
  return useQuery({
    ...inventoryAdjustmentDetailQuery(id || ''),
    enabled: !!id,
  });
}

export function useInventoryTransfersQuery() {
  return useQuery(inventoryTransfersQuery());
}

export function useInventoryTransfersActions() {
  const queryClient = useQueryClient();
  return {
    invalidateTransfers: () =>
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfers.lists() }),
  };
}

export function useInventoryTransfer(id: string | undefined) {
  return useQuery({
    ...inventoryTransferDetailQuery(id || ''),
    enabled: !!id,
  });
}

// --- Mutations ---

export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryAdjustmentInput) => inventoryApi.createAdjustment(data),
    onSuccess: (data) => {
      queryClient.setQueryData(inventoryKeys.adjustments.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useApproveAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.updateAdjustmentStatus(id, 'approved'),
    onSuccess: (data) => {
      toast.success('Inventory adjustment approved and stock committed');
      // Invalidate specific adjustment, adjustments list, and levels/ledger
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.ledger.all() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
    onError: (error) => {
      toast.error('Failed to approve adjustment');
      console.error('Approval error:', error);
    },
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryTransferInput) => inventoryApi.createTransfer(data),
    onSuccess: (data) => {
      toast.success('Inventory transfer created');
      queryClient.setQueryData(inventoryKeys.transfers.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfers.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
    onError: (error) => {
      toast.error('Failed to create transfer');
      console.error('Create transfer error:', error);
    },
  });
}

export function useUpdateTransferStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: 'shipped' | 'received' | 'cancelled' }) =>
      inventoryApi.updateTransferStatus(id, status),
    onSuccess: (data) => {
      toast.success(`Transfer status updated to ${data.status}`);
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfers.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfers.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.ledger.all() });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
    onError: (error) => {
      toast.error('Failed to update transfer status');
      console.error('Update status error:', error);
    },
  });
}
