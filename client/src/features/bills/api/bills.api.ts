import { apiFetch } from '@/lib/api';
import type {
  CreateBillInput,
  UpdateBillInput,
  UpdateBillStatusInput,
} from '@shared/contracts/bills.contract';

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
  notes?: string | null;
  status: 'draft' | 'open' | 'paid' | 'void';
  createdAt: string;
  updatedAt: string;
  lines: BillLineResponse[];
}

export const billsApi = {
  fetchBills: async () => {
    return apiFetch<BillResponse[]>('/bills');
  },
  fetchBill: async (id: string) => {
    return apiFetch<BillResponse>(`/bills/${id}`);
  },
  createBill: async (data: CreateBillInput) => {
    return apiFetch<BillResponse>('/bills', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  updateBill: async (id: string, data: UpdateBillInput) => {
    return apiFetch<BillResponse>(`/bills/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  updateBillStatus: async (id: string, data: UpdateBillStatusInput) => {
    return apiFetch<BillResponse>(`/bills/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
  deleteBill: (id: string) =>
    apiFetch<{ message: string }>(`/bills/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteBills: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/bills', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
