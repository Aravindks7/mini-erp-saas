import { apiFetch } from '@/lib/api';
import type {
  DocumentSequenceResponse,
  UpdateDocumentSequenceInput,
} from '@shared/contracts/sequences.contract';
import { API_ENDPOINTS } from '@/lib/api-endpoints';

export const sequencesApi = {
  fetchSequences: async (): Promise<DocumentSequenceResponse[]> => {
    return apiFetch<DocumentSequenceResponse[]>(API_ENDPOINTS.settings.sequences.base);
  },

  updateSequence: async (
    id: string,
    data: UpdateDocumentSequenceInput,
  ): Promise<DocumentSequenceResponse> => {
    return apiFetch<DocumentSequenceResponse>(API_ENDPOINTS.settings.sequences.detail(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
