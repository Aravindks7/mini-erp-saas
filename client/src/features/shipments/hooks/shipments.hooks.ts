import { useQuery, useMutation, useQueryClient, queryOptions } from '@tanstack/react-query';
import { shipmentsApi } from '../api/shipments.api';
import type {
  CreateShipmentInput,
  UpdateShipmentInput,
} from '@shared/contracts/shipments.contract';
import { salesOrderKeys } from '../../sales-orders/hooks/sales-orders.hooks';
import { inventoryKeys } from '../../inventory/hooks/inventory.hooks';
import { activityKeys } from '../../activity/hooks/activity.hooks';

export const shipmentKeys = {
  all: ['shipments'] as const,
  lists: () => [...shipmentKeys.all, 'list'] as const,
  list: (filters: string) => [...shipmentKeys.lists(), { filters }] as const,
  details: () => [...shipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...shipmentKeys.details(), id] as const,
};

export const shipmentDetailQuery = (id: string) =>
  queryOptions({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => shipmentsApi.fetchShipment(id),
  });

export const shipmentListQuery = () =>
  queryOptions({
    queryKey: shipmentKeys.lists(),
    queryFn: shipmentsApi.fetchShipments,
  });

export function useShipmentsQuery() {
  return useQuery(shipmentListQuery());
}

export function useShipmentsActions() {
  const queryClient = useQueryClient();

  return {
    invalidateShipments: () => queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() }),
  };
}

export function useShipment(id: string) {
  return useQuery({
    ...shipmentDetailQuery(id),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShipmentInput) => shipmentsApi.createShipment(data),
    onSuccess: (data) => {
      queryClient.setQueryData(shipmentKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all, refetchType: 'all' });
      queryClient.invalidateQueries({ queryKey: activityKeys.all, refetchType: 'all' });
    },
  });
}

export function useDeleteShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => shipmentsApi.deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useBulkDeleteShipments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => shipmentsApi.bulkDeleteShipments(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}

export function useUpdateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateShipmentInput }) =>
      shipmentsApi.updateShipment(id, data),
    onSuccess: (data) => {
      queryClient.setQueryData(shipmentKeys.detail(data.id), data);
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.all });
      queryClient.invalidateQueries({ queryKey: salesOrderKeys.all });
      queryClient.invalidateQueries({ queryKey: activityKeys.all });
    },
  });
}
