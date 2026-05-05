import { z } from 'zod';

/**
 * Activity Log Response Contract.
 * Represents the API response shape for activity log entries.
 */
export const activityLogResponseSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  action: z.string(),
  reason: z.string().nullable(),
  snapshot: z.record(z.string(), z.unknown()).nullable(),
  createdAt: z.string(),
  createdBy: z.string().nullable(),
  user: z
    .object({
      name: z.string(),
      image: z.string().nullable(),
    })
    .nullable(),
});

export type ActivityLogResponse = z.infer<typeof activityLogResponseSchema>;
