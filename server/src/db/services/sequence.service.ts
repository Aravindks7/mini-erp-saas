import { db } from '../index.js';
import { documentSequences } from '../schema/sequences.schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * SequenceService: Implements Atomic Transactional Sequencing.
 *
 * Clinical Strategy:
 * 1. Open a discrete transaction.
 * 2. Use `FOR UPDATE` lock on the specific sequence row to serialize access.
 * 3. Fetch current `next_value`, increment, and commit.
 * 4. Ensures "Gapless" sequencing required for financial/legal auditing.
 */
export class SequenceService {
  /**
   * Generates the next human-readable ID for a given document type.
   * @example
   * const soNumber = await SequenceService.generateNextId('SO', orgId); // => "SO-0001"
   */
  static async generateNextId(type: string, organizationId: string): Promise<string> {
    return await db.transaction(async (tx) => {
      // 1. Fetch the sequence configuration with a row-level lock
      const [sequence] = await tx
        .select()
        .from(documentSequences)
        .where(
          and(
            eq(documentSequences.type, type),
            eq(documentSequences.organizationId, organizationId),
          ),
        )
        .for('update');

      if (!sequence) {
        // Fallback or explicit error based on system configuration
        throw new Error(
          `Document sequence missing for type '${type}' in organization '${organizationId}'. ` +
            `A setup/seeding process is required.`,
        );
      }

      const currentVal = sequence.nextValue;
      const nextVal = currentVal + 1;

      // 2. Atomic increment
      await tx
        .update(documentSequences)
        .set({
          nextValue: nextVal,
          updatedAt: new Date(),
        })
        .where(eq(documentSequences.id, sequence.id));

      // 3. Format with prefix and zero-padding
      // Example: prefix="SO-", nextValue=1, padding=4 => "SO-0001"
      const formattedNumber = String(currentVal).padStart(sequence.padding, '0');

      return `${sequence.prefix}${formattedNumber}`;
    });
  }
}
