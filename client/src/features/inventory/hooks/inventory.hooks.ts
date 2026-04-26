import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api/inventory.api';
import type { CreateAdjustmentInput } from '@mini-erp/shared';

export const inventoryKeys = {
  all: ['inventory'] as const,
  levels: () => [...inventoryKeys.all, 'levels'] as const,
  ledger: (filters: unknown) => [...inventoryKeys.all, 'ledger', { filters }] as const,
  adjustments: () => [...inventoryKeys.all, 'adjustments'] as const,
  adjustment: (id: string) => [...inventoryKeys.adjustments(), id] as const,
};

export function useInventoryLevels() {
  return useQuery({
    queryKey: inventoryKeys.levels(),
    queryFn: inventoryApi.fetchLevels,
    staleTime: 5000,
  });
}

export function useInventoryLedger(filters?: {
  productId?: string;
  warehouseId?: string;
  binId?: string;
}) {
  return useQuery({
    queryKey: inventoryKeys.ledger(filters),
    queryFn: () => inventoryApi.fetchLedger(filters),
    staleTime: 5000,
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

export function useCreateAdjustment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAdjustmentInput) => inventoryApi.createAdjustment(data),
    onSuccess: () => {
      // Invalidate both adjustments list and levels
      queryClient.invalidateQueries({ queryKey: inventoryKeys.adjustments() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.levels() });
    },
  });
}
