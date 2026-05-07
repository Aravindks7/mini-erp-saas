import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { inventoryApi } from '../api/inventory.api';
import type { CreateInventoryAdjustmentInput } from '@shared/contracts/inventory-adjustments.contract';
import type { CreateInventoryTransferInput } from '@shared/contracts/inventory-transfers.contract';

export const inventoryKeys = {
  all: ['inventory'] as const,
  levels: () => [...inventoryKeys.all, 'levels'] as const,
  ledger: () => [...inventoryKeys.all, 'ledger'] as const,
  adjustments: () => [...inventoryKeys.all, 'adjustments'] as const,
  adjustment: (id: string) => [...inventoryKeys.adjustments(), id] as const,
  transfers: () => [...inventoryKeys.all, 'transfers'] as const,
  transfer: (id: string) => [...inventoryKeys.transfers(), id] as const,
};

export function useInventoryLevels() {
  return useQuery({
    queryKey: inventoryKeys.levels(),
    queryFn: inventoryApi.fetchLevels,
    staleTime: 5000,
  });
}

export function useInventoryLevel(id: string | undefined) {
  return useQuery({
    queryKey: [...inventoryKeys.levels(), id],
    queryFn: () => inventoryApi.fetchLevel(id as string),
    enabled: !!id,
  });
}

export function useInventoryLedger() {
  return useQuery({
    queryKey: inventoryKeys.ledger(),
    queryFn: () => inventoryApi.fetchLedger(),
  });
}

export function useInventoryLevelLedger(id: string | undefined) {
  return useQuery({
    queryKey: [...inventoryKeys.ledger(), 'level', id],
    queryFn: () => inventoryApi.fetchLevelLedger(id as string),
    enabled: !!id,
  });
}

export function useInventoryAdjustments() {
  return useQuery({
    queryKey: inventoryKeys.adjustments(),
    queryFn: inventoryApi.fetchAdjustments,
    staleTime: 5000,
  });
}

export function useInventoryAdjustment(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.adjustment(id || ''),
    queryFn: () => inventoryApi.fetchAdjustment(id || ''),
    enabled: !!id,
  });
}

export function useInventoryTransfers() {
  return useQuery({
    queryKey: inventoryKeys.transfers(),
    queryFn: inventoryApi.fetchTransfers,
    staleTime: 5000,
  });
}

export function useInventoryTransfer(id: string | undefined) {
  return useQuery({
    queryKey: inventoryKeys.transfer(id || ''),
    queryFn: () => inventoryApi.fetchTransfer(id || ''),
    enabled: !!id,
  });
}

export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateInventoryAdjustmentInput) => inventoryApi.createAdjustment(data),
    onSuccess: () => {
      // Invalidate both adjustments list and levels
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels() });
    },
  });
}

export function useApproveAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inventoryApi.updateAdjustmentStatus(id, 'approved'),
    onSuccess: (data) => {
      toast.success('Inventory adjustment approved and stock committed');
      // Invalidate specific adjustment, adjustments list, and levels
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustment(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.ledger() });
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
    onSuccess: () => {
      toast.success('Inventory transfer created');
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfers() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels() });
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
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfer(data.id) });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transfers() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.ledger() });
    },
    onError: (error) => {
      toast.error('Failed to update transfer status');
      console.error('Update status error:', error);
    },
  });
}
