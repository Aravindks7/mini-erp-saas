import { db } from '../../db/index.js';
import { journalEntries } from '../../db/schema/journal-entries.schema.js';
import { journalEntryLines } from '../../db/schema/journal-entry-lines.schema.js';
import { CreateJournalEntryInput } from '#shared/contracts/finance.contract.js';
import { BaseService } from '../../lib/base.service.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class JournalEntriesService extends BaseService<typeof journalEntries> {
  constructor() {
    super(journalEntries);
  }

  async listJournalEntries(organizationId: string) {
    return await db.query.journalEntries.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        lines: {
          with: { account: true },
        },
      },
      orderBy: (journalEntries, { desc }) => [desc(journalEntries.date)],
    });
  }

  async getJournalEntryById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.journalEntries.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        lines: {
          with: { account: true },
        },
      },
    });
  }

  async createJournalEntry(organizationId: string, userId: string, data: CreateJournalEntryInput) {
    return await db.transaction(async (tx) => {
      const { lines, ...headerData } = data;

      const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Journal entry is not balanced.');
      }

      const [newEntry] = await tx
        .insert(journalEntries)
        .values(
          this.withAudit(
            {
              ...headerData,
              organizationId,
              date: new Date(headerData.date),
            },
            userId,
          ),
        )
        .returning();

      if (!newEntry) throw new Error('Failed to create journal entry header.');

      const linesToInsert = lines.map((line) => ({
        ...line,
        organizationId,
        journalEntryId: newEntry.id,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
      }));

      await tx.insert(journalEntryLines).values(linesToInsert);

      return await this.getJournalEntryById(organizationId, newEntry.id, tx);
    });
  }

  async voidJournalEntry(organizationId: string, userId: string, id: string) {
    const [updated] = await db
      .update(journalEntries)
      .set(this.withAudit({ status: 'void' }, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();
    return updated;
  }
}

export const journalEntriesService = new JournalEntriesService();
