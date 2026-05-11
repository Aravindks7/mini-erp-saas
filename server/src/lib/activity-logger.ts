import { db } from '../db/index.js';
import { activityLogs } from '../db/schema/index.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

import type { ActivityAction, EntityType } from '#shared/config/activity-actions.config.js';
import { DiffUtility } from '../utils/diff.js';
import { AuditResolver } from './audit-resolver.js';
import { NarrativeGenerator } from '../utils/narrative.js';

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

  /**
   * Automatically computes the diff between old and new state and records the activity.
   *
   * @param tx The active database transaction.
   * @param params The activity parameters (excluding snapshot).
   * @param oldData The previous state of the entity.
   * @param newData The new state of the entity.
   */
  static async recordUpdate(
    tx: Transaction,
    params: Omit<ActivityLogParams, 'snapshot'>,
    oldData: Record<string, unknown>,
    newData: Record<string, unknown>,
  ): Promise<void> {
    // 1. Resolve human-readable labels (e.g. customer IDs -> names)
    const hydratedOld = await AuditResolver.hydrate(
      params.organizationId,
      params.entityType,
      oldData,
      tx,
    );
    const hydratedNew = await AuditResolver.hydrate(
      params.organizationId,
      params.entityType,
      newData,
      tx,
    );

    // 2. Compute the structural diff
    const delta = DiffUtility.getDelta(hydratedOld, hydratedNew);

    // If no changes, don't record anything
    if (Object.keys(delta).length === 0) return;

    // 3. Synthesize narrative if reason is missing or generic
    const reason =
      params.reason && params.reason !== 'Manual update'
        ? params.reason
        : NarrativeGenerator.fromDelta(delta);

    await this.record(tx, {
      ...params,
      reason,
      snapshot: delta,
    });
  }
}
