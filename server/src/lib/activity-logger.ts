import { db } from '../db/index.js';
import { activityLogs } from '../db/schema/index.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

import type { ActivityAction, EntityType } from '#shared/config/activity-actions.config.js';

export interface ActivityLogParams {
  organizationId: string;
  entityType: EntityType;
  entityId: string;
  entityDisplayId: string;
  entityLabel: string;
  action: ActivityAction;
  reason?: string | null;
  snapshot?: Record<string, unknown> | null;
  userId: string;
}

/**
 * ActivityLogger
 *
 * Enforces the "Hybrid Model" architecture by requiring a transaction context
 * to record the Temporal Narrative (Audit Log) of a domain event.
 */
export class ActivityLogger {
  /**
   * Records a business activity into the activity_logs table.
   *
   * @param tx The active database transaction. MUST be provided to ensure atomicity.
   * @param params The details of the activity.
   */
  static async record(tx: Transaction, params: ActivityLogParams): Promise<void> {
    if (!tx) {
      throw new Error('ActivityLogger.record MUST be called within a transaction context.');
    }

    await tx.insert(activityLogs).values({
      organizationId: params.organizationId,
      entityType: params.entityType,
      entityId: params.entityId,
      entityDisplayId: params.entityDisplayId,
      entityLabel: params.entityLabel,
      action: params.action,
      reason: params.reason || null,
      snapshot: params.snapshot || null,
      createdBy: params.userId,
    });
  }
}
