import { db } from '../../db/index.js';
import { accounts } from '../../db/schema/accounts.schema.js';
import { journalEntryLines } from '../../db/schema/journal-entry-lines.schema.js';
import { and, eq, sql, sum } from 'drizzle-orm';
import { CreateAccountInput, UpdateAccountInput } from '#shared/contracts/finance.contract.js';
import { BaseService } from '../../lib/base.service.js';

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

  async createAccount(organizationId: string, userId: string, data: CreateAccountInput) {
    const [newAccount] = await db
      .insert(accounts)
      .values(this.withAudit({ ...data, organizationId }, userId))
      .returning();
    return newAccount;
  }

  async updateAccount(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateAccountInput,
  ) {
    const [updatedAccount] = await db
      .update(accounts)
      .set(this.withAudit(data, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();
    return updatedAccount;
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
