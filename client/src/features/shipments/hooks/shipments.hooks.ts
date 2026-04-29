import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { shipmentsApi } from '../api/shipments.api';
import type { CreateShipmentInput } from '@shared/contracts/shipments.contract';

export const shipmentKeys = {
  all: ['shipments'] as const,
  lists: () => [...shipmentKeys.all, 'list'] as const,
  list: (filters: string) => [...shipmentKeys.lists(), { filters }] as const,
  details: () => [...shipmentKeys.all, 'detail'] as const,
  detail: (id: string) => [...shipmentKeys.details(), id] as const,
};

export function useShipments() {
  return useQuery({
    queryKey: shipmentKeys.lists(),
    queryFn: shipmentsApi.fetchShipments,
  });
}

export function useShipment(id: string) {
  return useQuery({
    queryKey: shipmentKeys.detail(id),
    queryFn: () => shipmentsApi.fetchShipment(id),
    enabled: !!id,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateShipmentInput) => shipmentsApi.createShipment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: shipmentKeys.lists() });
      queryClient.invalidateQueries({ queryKey: ['inventory-levels'] });
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    },
  });
}
