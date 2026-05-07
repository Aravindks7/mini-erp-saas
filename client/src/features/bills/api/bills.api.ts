import { apiFetch } from '@/lib/api';
import type {
  CreateBillInput,
  UpdateBillInput,
  UpdateBillStatusInput,
} from '@shared/contracts/bills.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export interface BillLineResponse {
  id: string;
  billId: string;
  productId: string;
  product?: {
    id: string;
    name: string;
  };
  quantity: string;
  unitPrice: string;
  taxRateAtOrder: string;
  taxAmount: string;
  lineTotal: string;
}

export interface BillResponse {
  id: string;
  supplierId: string;
  supplier?: {
    id: string;
    name: string;
  };
  receiptId?: string | null;
  purchaseOrderId?: string | null;
  referenceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: string;
  balanceDue: string;
  taxAmount: string;
  notes?: string | null;
  status: 'draft' | 'open' | 'paid' | 'void';
  createdAt: string;
  updatedAt: string;
  lines: BillLineResponse[];
}

export const billsApi = {
  fetchBills: async () => {
    return apiFetch<BillResponse[]>(API_ENDPOINTS.purchasing.bills.base);
  },
  fetchBill: async (id: string) => {
    return apiFetch<BillResponse>(API_ENDPOINTS.purchasing.bills.detail(id));
  },
  createBill: async (data: CreateBillInput) => {
    return apiFetch<BillResponse>(API_ENDPOINTS.purchasing.bills.base, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateBill: async (id: string, data: UpdateBillInput) => {
    return apiFetch<BillResponse>(API_ENDPOINTS.purchasing.bills.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  updateBillStatus: async (id: string, data: UpdateBillStatusInput) => {
    return apiFetch<BillResponse>(API_ENDPOINTS.purchasing.bills.status(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteBill: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.purchasing.bills.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteBills: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>(
      API_ENDPOINTS.purchasing.bills.bulkDelete,
      {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      },
    ),
};
