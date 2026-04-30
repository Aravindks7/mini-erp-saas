import { apiFetch } from '@/lib/api';
import type {
  DocumentSequenceResponse,
  UpdateDocumentSequenceInput,
} from '@shared/contracts/sequences.contract';

export const sequencesApi = {
  fetchSequences: async (): Promise<DocumentSequenceResponse[]> => {
    return apiFetch<DocumentSequenceResponse[]>('/sequences');
  },

  updateSequence: async (
    id: string,
    data: UpdateDocumentSequenceInput,
  ): Promise<DocumentSequenceResponse> => {
    return apiFetch<DocumentSequenceResponse>(`/sequences/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },
};
