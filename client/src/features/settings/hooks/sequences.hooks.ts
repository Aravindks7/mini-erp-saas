import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sequencesApi } from '../api/sequences.api';
import { toast } from 'sonner';
import type { UpdateDocumentSequenceInput } from '@shared/contracts/sequences.contract';

export const sequenceKeys = {
  all: ['sequences'] as const,
  lists: () => [...sequenceKeys.all, 'list'] as const,
};

export function useSequences() {
  return useQuery({
    queryKey: sequenceKeys.lists(),
    queryFn: sequencesApi.fetchSequences,
  });
}

export function useUpdateSequence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDocumentSequenceInput }) =>
      sequencesApi.updateSequence(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sequenceKeys.lists() });
      toast.success('Document sequence updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update sequence');
    },
  });
}
