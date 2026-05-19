import { apiFetch } from '@/lib/api';
import type { CreateInventoryAdjustmentInput } from '@shared/contracts/inventory-adjustments.contract';
import type { CreateInventoryTransferInput } from '@shared/contracts/inventory-transfers.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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

export interface InventoryTransferResponse {
  id: string;
  transferDate: string;
  fromWarehouseId: string;
  toWarehouseId: string;
  reference: string | null;
  status: 'draft' | 'shipped' | 'received' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  fromWarehouse: {
    id: string;
    code: string;
    name: string;
  };
  toWarehouse: {
    id: string;
    code: string;
    name: string;
  };
  lines: {
    id: string;
    productId: string;
    quantity: string;
    product: {
      id: string;
      sku: string;
      name: string;
    };
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
    return apiFetch<InventoryLevelResponse[]>(API_ENDPOINTS.inventory.levels.base);
  },
  fetchLedger: async () => {
    return apiFetch<InventoryLedgerResponse[]>(API_ENDPOINTS.inventory.ledger);
  },
  fetchLevel: async (id: string) => {
    return apiFetch<InventoryLevelResponse>(API_ENDPOINTS.inventory.levels.detail(id));
  },
  fetchLevelLedger: async (id: string) => {
    return apiFetch<InventoryLedgerResponse[]>(API_ENDPOINTS.inventory.levels.ledger(id));
  },
  fetchAdjustments: async () => {
    return apiFetch<InventoryAdjustmentResponse[]>(API_ENDPOINTS.inventory.adjustments.base);
  },
  fetchAdjustment: async (id: string) => {
    return apiFetch<InventoryAdjustmentResponse>(API_ENDPOINTS.inventory.adjustments.detail(id));
  },
  createAdjustment: async (data: CreateInventoryAdjustmentInput) => {
    return apiFetch<InventoryAdjustmentResponse>(API_ENDPOINTS.inventory.adjustments.base, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateAdjustmentStatus: async (id: string, status: 'approved' | 'cancelled') => {
    return apiFetch<InventoryAdjustmentResponse>(API_ENDPOINTS.inventory.adjustments.status(id), {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
  fetchTransfers: async () => {
    return apiFetch<InventoryTransferResponse[]>(API_ENDPOINTS.inventory.transfers.base);
  },
  fetchTransfer: async (id: string) => {
    return apiFetch<InventoryTransferResponse>(API_ENDPOINTS.inventory.transfers.detail(id));
  },
  createTransfer: async (data: CreateInventoryTransferInput) => {
    return apiFetch<InventoryTransferResponse>(API_ENDPOINTS.inventory.transfers.base, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateTransferStatus: async (id: string, status: 'shipped' | 'received' | 'cancelled') => {
    return apiFetch<InventoryTransferResponse>(API_ENDPOINTS.inventory.transfers.status(id), {
      method: 'POST',
      body: JSON.stringify({ status }),
    });
  },
};
