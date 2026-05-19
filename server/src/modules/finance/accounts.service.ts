import { db } from '../../db/index.js';
import { accounts } from '../../db/schema/accounts.schema.js';
import { journalEntryLines } from '../../db/schema/journal-entry-lines.schema.js';
import { and, eq, sum, ne } from 'drizzle-orm';
import { CreateAccountInput, UpdateAccountInput } from '#shared/contracts/finance.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class AccountsService extends BaseService<typeof accounts> {
  constructor() {
    super(accounts);
  }

  async listAccounts(organizationId: string) {
    return await db.query.accounts.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (accounts, { asc }) => [asc(accounts.code)],
    });
  }

  async getAccountById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.accounts.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async checkDuplicateCode(organizationId: string, code: string, excludeId?: string) {
    return await db.query.accounts.findFirst({
      where: and(
        eq(accounts.organizationId, organizationId),
        eq(accounts.code, code),
        excludeId ? ne(accounts.id, excludeId) : undefined,
      ),
    });
  }

  async createAccount(organizationId: string, userId: string, data: CreateAccountInput) {
    return await db.transaction(async (tx) => {
      const existing = await this.checkDuplicateCode(organizationId, data.code);
      if (existing) {
        throw new Error(`Account with code '${data.code}' already exists`);
      }

      const [newAccount] = await tx
        .insert(accounts)
        .values(this.withAudit({ ...data, organizationId }, userId))
        .returning();

      if (!newAccount) {
        throw new Error('Failed to create account');
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'account',
        entityId: newAccount.id,
        entityDisplayId: newAccount.code,
        entityLabel: 'Account',
        action: 'CREATED',
        reason: `Account ${newAccount.name} (${newAccount.code}) created.`,
      });

      return await this.getAccountById(organizationId, newAccount.id, tx);
    });
  }

  async updateAccount(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateAccountInput,
  ) {
    return await db.transaction(async (tx) => {
      const existingAccount = await this.getAccountById(organizationId, id, tx);
      if (!existingAccount) {
        throw new Error('Account not found');
      }

      if (data.code) {
        const duplicate = await this.checkDuplicateCode(organizationId, data.code, id);
        if (duplicate) {
          throw new Error(`Account with code '${data.code}' already exists`);
        }
      }

      const [updatedAccount] = await tx
        .update(accounts)
        .set(this.withAudit(data, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (updatedAccount) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'account',
            entityId: id,
            entityDisplayId: existingAccount.code,
            entityLabel: 'Account',
            action: 'UPDATED',
            reason: 'Account master data modified',
          },
          existingAccount,
          data,
        );
      }

      return await this.getAccountById(organizationId, id, tx);
    });
  }

  async getAccountBalance(organizationId: string, accountId: string) {
    const result = await db
      .select({
        totalDebit: sum(journalEntryLines.debit),
        totalCredit: sum(journalEntryLines.credit),
      })
      .from(journalEntryLines)
      .where(
        and(
          eq(journalEntryLines.organizationId, organizationId),
          eq(journalEntryLines.accountId, accountId),
        ),
      );

    const debit = Number(result[0]?.totalDebit || 0);
    const credit = Number(result[0]?.totalCredit || 0);

    const account = await this.getAccountById(organizationId, accountId);
    if (!account) return 0;

    if (['asset', 'expense'].includes(account.type)) {
      return debit - credit;
    } else {
      return credit - debit;
    }
  }
}

export const accountsService = new AccountsService();
