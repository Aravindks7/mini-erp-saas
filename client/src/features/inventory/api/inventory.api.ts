import { apiFetch } from '@/lib/api';
import type { CreateAdjustmentInput } from '@mini-erp/shared';

export interface InventoryLevelResponse {
  id: string;
  productId: string;
  warehouseId: string;
  binId: string | null;
  quantityOnHand: string;
  quantityAllocated: string;
  quantityReserved: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    sku: string;
    name: string;
    baseUom?: {
      id: string;
      code: string;
      name: string;
    };
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  bin: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface InventoryAdjustmentResponse {
  id: string;
  adjustmentDate: string;
  reason: string;
  reference: string | null;
  status: 'draft' | 'approved' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  lines: {
    id: string;
    productId: string;
    warehouseId: string;
    binId: string | null;
    quantityChange: string;
    product: {
      id: string;
      sku: string;
      name: string;
    };
    warehouse: {
      id: string;
      code: string;
      name: string;
    };
    bin: {
      id: string;
      code: string;
      name: string;
    } | null;
  }[];
}

export interface InventoryLedgerResponse {
  id: string;
  productId: string;
  warehouseId: string;
  binId: string | null;
  quantityChange: string;
  referenceType: 'po_receipt' | 'so_shipment' | 'adjustment' | 'transfer' | 'stock_count';
  referenceId: string | null;
  createdAt: string;
  product: {
    id: string;
    sku: string;
    name: string;
  };
  warehouse: {
    id: string;
    code: string;
    name: string;
  };
  bin: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export const inventoryApi = {
  fetchLevels: async () => {
    return apiFetch<InventoryLevelResponse[]>('/inventory/levels');
  },
  fetchLedger: async () => {
    return apiFetch<InventoryLedgerResponse[]>('/inventory/ledger');
  },
  fetchLevel: async (id: string) => {
    return apiFetch<InventoryLevelResponse>(`/inventory/levels/${id}`);
  },
  fetchLevelLedger: async (id: string) => {
    return apiFetch<InventoryLedgerResponse[]>(`/inventory/levels/${id}/ledger`);
  },
  fetchAdjustments: async () => {
    return apiFetch<InventoryAdjustmentResponse[]>('/inventory/adjustments');
  },
  fetchAdjustment: async (id: string) => {
    return apiFetch<InventoryAdjustmentResponse>(`/inventory/adjustments/${id}`);
  },
  createAdjustment: async (data: CreateAdjustmentInput) => {
    return apiFetch<InventoryAdjustmentResponse>('/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};
