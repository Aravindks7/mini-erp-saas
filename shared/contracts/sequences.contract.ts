import { z } from 'zod';

export const documentSequenceSchema = z.object({
  id: z.string().uuid(),
  type: z.string(),
  prefix: z.string().min(1, 'Prefix is required').max(50),
  nextValue: z.number().int().min(1),
  padding: z.number().int().min(1).max(10),
});

export const updateDocumentSequenceSchema = z.object({
  prefix: z.string().min(1, 'Prefix is required').max(50),
  padding: z.number().int().min(1).max(10),
  nextValue: z.number().int().min(1).optional(),
  reason: z.string().min(5, 'Reason for change must be at least 5 characters'),
});

export type DocumentSequenceResponse = z.infer<typeof documentSequenceSchema>;
export type UpdateDocumentSequenceInput = z.infer<typeof updateDocumentSequenceSchema>;
