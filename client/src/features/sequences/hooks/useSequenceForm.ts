import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  updateDocumentSequenceSchema,
  type UpdateDocumentSequenceInput,
  type DocumentSequenceResponse,
} from '@shared/contracts/sequences.contract';

/**
 * useSequenceForm: A specialized hook for sequence configuration.
 * Encapsulates form logic, dirty state tracking, and forensic-aware resets.
 */
export function useSequenceForm(sequence: DocumentSequenceResponse) {
  const form = useForm<UpdateDocumentSequenceInput>({
    resolver: zodResolver(updateDocumentSequenceSchema),
    defaultValues: {
      prefix: sequence.prefix,
      padding: sequence.padding,
      nextValue: sequence.nextValue,
      reason: '',
    },
  });

  const isDirty = form.formState.isDirty;

  const resetForm = () => {
    form.reset({
      prefix: sequence.prefix,
      padding: sequence.padding,
      nextValue: sequence.nextValue,
      reason: '',
    });
  };

  return {
    form,
    isDirty,
    resetForm,
  };
}
