import { db } from '../../db/index.js';
import { journalEntries } from '../../db/schema/journal-entries.schema.js';
import { journalEntryLines } from '../../db/schema/journal-entry-lines.schema.js';
import { and, eq } from 'drizzle-orm';
import {
  CreateJournalEntryInput,
  UpdateJournalEntryInput,
} from '#shared/contracts/finance.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

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

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'journal_entry',
        entityId: newEntry.id,
        entityDisplayId: newEntry.reference || newEntry.id,
        entityLabel: 'Journal Entry',
        action: 'CREATED',
        reason: 'Journal entry created.',
      });

      return await this.getJournalEntryById(organizationId, newEntry.id, tx);
    });
  }

  async updateJournalEntry(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateJournalEntryInput,
  ) {
    return await db.transaction(async (tx) => {
      const existingEntry = await this.getJournalEntryById(organizationId, id, tx);
      if (!existingEntry) {
        throw new Error('Journal entry not found.');
      }

      if (existingEntry.status !== 'draft') {
        throw new Error('Only draft journal entries can be modified.');
      }

      const { lines, reason, ...headerData } = data;

      const totalDebit = lines.reduce((sum, l) => sum + (l.debit || 0), 0);
      const totalCredit = lines.reduce((sum, l) => sum + (l.credit || 0), 0);

      if (Math.abs(totalDebit - totalCredit) > 0.01) {
        throw new Error('Journal entry is not balanced.');
      }

      // Update Header
      await tx
        .update(journalEntries)
        .set(
          this.withAudit(
            {
              ...headerData,
              date: new Date(headerData.date),
            },
            userId,
            true,
          ),
        )
        .where(and(eq(journalEntries.id, id), eq(journalEntries.organizationId, organizationId)));

      // Replace Lines
      await tx
        .delete(journalEntryLines)
        .where(
          and(
            eq(journalEntryLines.journalEntryId, id),
            eq(journalEntryLines.organizationId, organizationId),
          ),
        );

      const linesToInsert = lines.map((line) => ({
        ...line,
        organizationId,
        journalEntryId: id,
        debit: line.debit.toString(),
        credit: line.credit.toString(),
      }));

      await tx.insert(journalEntryLines).values(linesToInsert);

      // Forensic Audit: Record Update
      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId,
          entityType: 'journal_entry',
          entityId: id,
          entityDisplayId: existingEntry.reference || id,
          entityLabel: 'Journal Entry',
          action: 'UPDATED',
          reason: reason || 'Journal entry modified.',
        },
        existingEntry,
        headerData,
      );

      return await this.getJournalEntryById(organizationId, id, tx);
    });
  }

  async voidJournalEntry(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const entry = await this.getJournalEntryById(organizationId, id, tx);
      if (!entry) throw new Error('Journal entry not found.');

      const [updated] = await tx
        .update(journalEntries)
        .set(this.withAudit({ status: 'void' }, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (updated) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'journal_entry',
            entityId: id,
            entityDisplayId: entry.reference || id,
            entityLabel: 'Journal Entry',
            action: 'VOIDED',
            reason: 'Journal entry voided.',
          },
          entry,
          { status: 'void' },
        );
      }

      return updated;
    });
  }
}

export const journalEntriesService = new JournalEntriesService();
