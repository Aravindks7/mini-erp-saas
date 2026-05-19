import { apiFetch } from '@/lib/api';
import type { CreateUomInput, UpdateUomInput } from '@shared/contracts/uom.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

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
  fetchUoms: () => apiFetch<UomResponse[]>(API_ENDPOINTS.setup.uom.base),
  fetchUom: (id: string) => apiFetch<UomResponse>(API_ENDPOINTS.setup.uom.detail(id)),
  createUom: (data: CreateUomInput) =>
    apiFetch<UomResponse>(API_ENDPOINTS.setup.uom.base, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUom: (id: string, data: UpdateUomInput) =>
    apiFetch<UomResponse>(API_ENDPOINTS.setup.uom.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  deleteUom: (id: string) =>
    apiFetch<{ message: string }>(API_ENDPOINTS.setup.uom.detail(id), {
      method: 'DELETE',
    }),
  bulkDeleteUoms: (ids: string[]) =>
    apiFetch<{ message: string; deletedCount: number; deletedIds: string[] }>(
      API_ENDPOINTS.setup.uom.bulkDelete,
      {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      },
    ),
};
