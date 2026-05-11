import { db } from '../../db/index.js';
import { currencies } from '../../db/schema/currencies.schema.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { CreateCurrencyInput, UpdateCurrencyInput } from '#shared/contracts/currencies.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class CurrenciesService extends BaseService<typeof currencies> {
  constructor() {
    super(currencies);
  }

  async listCurrencies(organizationId: string) {
    return await db.query.currencies.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (currencies, { desc }) => [desc(currencies.createdAt)],
    });
  }

  async getCurrencyById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.currencies.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async checkDuplicate(organizationId: string, code: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(currencies.organizationId, organizationId),
      sql`lower(${currencies.code}) = lower(${code})`,
      sql`${currencies.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(currencies.id, excludeId));
    }

    return await db.query.currencies.findFirst({
      where: and(...whereConditions),
    });
  }

  async createCurrency(organizationId: string, userId: string, data: CreateCurrencyInput) {
    const existing = await this.checkDuplicate(organizationId, data.code);
    if (existing) {
      throw new Error(`Currency with code '${data.code}' already exists`);
    }

    return await db.transaction(async (tx) => {
      // If this is default, unset other defaults
      if (data.isDefault) {
        await tx
          .update(currencies)
          .set({ isDefault: false })
          .where(
            and(eq(currencies.organizationId, organizationId), eq(currencies.isDefault, true)),
          );
      }

      const [newCurrency] = await tx
        .insert(currencies)
        .values(this.withAudit({ ...data, organizationId }, userId))
        .returning();

      if (!newCurrency) {
        throw new Error('Failed to create currency record');
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'currency',
        entityId: newCurrency.id,
        entityDisplayId: newCurrency.code,
        entityLabel: 'Currency',
        action: 'CREATED',
        reason: `${newCurrency.name} (${newCurrency.code}) created.`,
      });

      return await this.getCurrencyById(organizationId, newCurrency.id, tx);
    });
  }

  async updateCurrency(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateCurrencyInput,
  ) {
    return await db.transaction(async (tx) => {
      const existingCurrency = await this.getCurrencyById(organizationId, id, tx);
      if (!existingCurrency) {
        throw new Error('Currency not found');
      }

      if (data.code) {
        const duplicate = await this.checkDuplicate(organizationId, data.code, id);
        if (duplicate) {
          throw new Error(`Currency with code '${data.code}' already exists`);
        }
      }

      if (data.isDefault) {
        await tx
          .update(currencies)
          .set({ isDefault: false })
          .where(
            and(eq(currencies.organizationId, organizationId), eq(currencies.isDefault, true)),
          );
      }

      const [updatedCurrency] = await tx
        .update(currencies)
        .set(this.withAudit(data, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (updatedCurrency) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'currency',
            entityId: id,
            entityDisplayId: existingCurrency.code,
            entityLabel: 'Currency',
            action: 'UPDATED',
            reason: `Currency ${existingCurrency.code} modified.`,
          },
          existingCurrency,
          data,
        );
      }

      return await this.getCurrencyById(organizationId, id, tx);
    });
  }

  async deleteCurrency(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const existingCurrency = await this.getCurrencyById(organizationId, id, tx);
      if (!existingCurrency) throw new Error('Currency not found');

      const [deletedCurrency] = await tx
        .update(currencies)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (deletedCurrency) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'currency',
          entityId: id,
          entityDisplayId: existingCurrency.code,
          entityLabel: 'Currency',
          action: 'DELETED',
          reason: `Currency ${existingCurrency.code} deleted.`,
        });
      }

      return deletedCurrency;
    });
  }

  async bulkDeleteCurrencies(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    return await db.transaction(async (tx) => {
      const currenciesToDelete = await tx.query.currencies.findMany({
        where: and(eq(currencies.organizationId, organizationId), inArray(currencies.id, ids)),
      });

      const deletedCurrencies = await tx
        .update(currencies)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(and(eq(currencies.organizationId, organizationId), inArray(currencies.id, ids)))
        .returning();

      for (const deleted of currenciesToDelete) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'currency',
          entityId: deleted.id,
          entityDisplayId: deleted.code,
          entityLabel: 'Currency',
          action: 'DELETED',
          reason: `Currency ${deleted.code} bulk deleted.`,
        });
      }

      return deletedCurrencies;
    });
  }
}

export const currenciesService = new CurrenciesService();
