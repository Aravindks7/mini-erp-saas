import { db } from '../../db/index.js';
import { documentSequences } from '../../db/schema/sequences.schema.js';
import { sql } from 'drizzle-orm';
import { BaseService } from '../../lib/base.service.js';
import { UpdateDocumentSequenceInput } from '#shared/contracts/sequences.contract.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

/**
 * SequencesService: Handles atomic document sequence generation.
 * Axiom: Every document must have a unique, sequential, human-readable ID.
 */
export class SequencesService extends BaseService<typeof documentSequences> {
  constructor() {
    super(documentSequences);
  }

  /**
   * Lists all sequences for an organization.
   */
  async listSequences(organizationId: string) {
    return await db.query.documentSequences.findMany({
      where: this.getTenantWhere(organizationId),
    });
  }

  /**
   * Updates a specific sequence configuration.
   */
  async updateSequence(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateDocumentSequenceInput,
  ) {
    return await db.transaction(async (tx) => {
      const oldSequence = await tx.query.documentSequences.findFirst({
        where: this.getTenantWhere(organizationId, id),
      });

      if (!oldSequence) {
        throw new Error('Sequence configuration not found.');
      }

      const { reason, ...updateData } = data;

      // Forensic Guardrail: Validate that the proposed format + next value won't cause immediate collisions
      const effectiveNextValue = updateData.nextValue ?? oldSequence.nextValue;
      const nextId =
        this.resolveTokens(updateData.prefix) +
        effectiveNextValue.toString().padStart(updateData.padding, '0');

      await this.validateSequenceIntegrity(organizationId, oldSequence.type, nextId);

      const [updated] = await tx
        .update(documentSequences)
        .set(this.withAudit(updateData, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (!updated) {
        throw new Error('Sequence configuration not found during update.');
      }

      await ActivityLogger.recordUpdate(
        tx,
        {
          organizationId,
          entityType: 'sequence',
          entityId: id,
          entityDisplayId: updated.type,
          entityLabel: `${updated.type} Sequence`,
          action: 'UPDATED',
          userId,
          reason,
        },
        oldSequence as unknown as Record<string, unknown>,
        updated as unknown as Record<string, unknown>,
      );

      return updated;
    });
  }

  /**
   * Generates the next sequence for a given type.
   * Uses PostgreSQL's UPSERT with atomic increment to ensure thread safety.
   */
  async getNextSequence(
    organizationId: string,
    type: string,
    userId: string,
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db = db,
  ): Promise<string> {
    const [sequence] = await tx
      .insert(documentSequences)
      .values(
        this.withAudit(
          {
            organizationId,
            type,
            prefix: `${type}-`,
            nextValue: 2, // Start with 1, next is 2
            padding: 4,
          },
          userId,
        ),
      )
      .onConflictDoUpdate({
        target: [documentSequences.organizationId, documentSequences.type],
        set: {
          nextValue: sql`${documentSequences.nextValue} + 1`,
          updatedAt: new Date(),
          updatedBy: userId,
        },
      })
      .returning();

    if (!sequence) {
      throw new Error(`Failed to generate sequence for type: ${type}`);
    }

    // The value we use is the one BEFORE the increment (or the one inserted)
    const currentValue = sequence.nextValue - 1;
    const paddedValue = currentValue.toString().padStart(sequence.padding, '0');
    const resolvedPrefix = this.resolveTokens(sequence.prefix);

    return `${resolvedPrefix}${paddedValue}`;
  }

  /**
   * Deep Validation: Checks if the proposed next ID already exists in the destination table.
   * Prevents collisions when prefixes are changed or padding is reduced.
   */
  private async validateSequenceIntegrity(organizationId: string, type: string, nextId: string) {
    const TYPE_TO_TABLE: Record<string, string> = {
      SO: 'sales_orders',
      PO: 'purchase_orders',
      INV: 'invoices',
      BILL: 'bills',
      RCPT: 'receipts',
      SHIP: 'shipments',
      ADJ: 'inventory_adjustments',
      TRSF: 'inventory_transfers',
    };

    const tableName = TYPE_TO_TABLE[type];
    if (!tableName) return; // Skip for unrecognized types

    const result = await db.execute(sql`
      SELECT id FROM ${sql.identifier(tableName)} 
      WHERE organization_id = ${organizationId} 
      AND document_number = ${nextId}
      LIMIT 1
    `);

    if (result.rows.length > 0) {
      throw new Error(
        `Forensic Integrity Violation: The proposed format generates "${nextId}", which already exists in the ${tableName} ledger.`,
      );
    }
  }

  /**
   * Resolves dynamic tokens in a prefix string.
   * Supported: [YYYY], [YY], [MM], [DD]
   */
  private resolveTokens(prefix: string): string {
    const now = new Date();
    return prefix
      .replace(/\[YYYY\]/g, now.getFullYear().toString())
      .replace(/\[YY\]/g, now.getFullYear().toString().slice(-2))
      .replace(/\[MM\]/g, (now.getMonth() + 1).toString().padStart(2, '0'))
      .replace(/\[DD\]/g, now.getDate().toString().padStart(2, '0'));
  }
}

export const sequencesService = new SequencesService();
