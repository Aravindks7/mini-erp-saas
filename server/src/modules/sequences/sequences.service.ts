import { db } from '../../db/index.js';
import { documentSequences } from '../../db/schema/sequences.schema.js';
import { sql } from 'drizzle-orm';
import { BaseService } from '../../lib/base.service.js';

/**
 * SequencesService: Handles atomic document sequence generation.
 * Axiom: Every document must have a unique, sequential, human-readable ID.
 */
export class SequencesService extends BaseService<typeof documentSequences> {
  constructor() {
    super(documentSequences);
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
    // Actually, RETURNING gives the row AFTER the increment.
    // If it was just inserted, nextValue is 2. The sequence we want is 1.
    // If it was updated, nextValue is current + 1. The sequence we want is current.
    const currentValue = sequence.nextValue - 1;
    const paddedValue = currentValue.toString().padStart(sequence.padding, '0');
    return `${sequence.prefix}${paddedValue}`;
  }
}

export const sequencesService = new SequencesService();
