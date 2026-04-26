import { apiFetch } from '@/lib/api';
import type { CreateUomInput, UpdateUomInput } from '@shared/contracts/uom.contract';

export interface UomResponse {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const uomsApi = {
  fetchUoms: () => apiFetch<UomResponse[]>('/uom'),
  fetchUom: (id: string) => apiFetch<UomResponse>(`/uom/${id}`),
  createUom: (data: CreateUomInput) =>
    apiFetch<UomResponse>('/uom', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUom: (id: string, data: UpdateUomInput) =>
    apiFetch<UomResponse>(`/uom/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUom: (id: string) =>
    apiFetch<{ message: string }>(`/uom/${id}`, {
      method: 'DELETE',
    }),
  bulkDeleteUoms: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>('/uom', {
      method: 'DELETE',
      body: JSON.stringify({ ids }),
    }),
};
