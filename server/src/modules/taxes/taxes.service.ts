import { db } from '../../db/index.js';
import { taxes } from '../../db/schema/taxes.schema.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { CreateTaxInput, UpdateTaxInput } from '#shared/contracts/taxes.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class TaxesService extends BaseService<typeof taxes> {
  constructor() {
    super(taxes);
  }

  async listTaxes(organizationId: string) {
    return await db.query.taxes.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (t, { desc }) => [desc(t.createdAt)],
    });
  }

  async getTaxById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.taxes.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async checkDuplicate(organizationId: string, name: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(taxes.organizationId, organizationId),
      sql`lower(${taxes.name}) = lower(${name})`,
      sql`${taxes.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(taxes.id, excludeId));
    }

    return await db.query.taxes.findFirst({
      where: and(...whereConditions),
    });
  }

  async createTax(organizationId: string, userId: string, data: CreateTaxInput) {
    return await db.transaction(async (tx) => {
      const existing = await this.checkDuplicate(organizationId, data.name);
      if (existing) {
        throw new Error(`Tax with name '${data.name}' already exists`);
      }

      const [newTax] = await tx
        .insert(taxes)
        .values(this.withAudit({ ...data, organizationId }, userId))
        .returning();

      if (!newTax) {
        throw new Error('Failed to create tax record');
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'tax',
        entityId: newTax.id,
        entityDisplayId: newTax.name,
        entityLabel: 'Tax',
        action: 'CREATED',
        reason: `Tax ${newTax.name} (${newTax.rate}%) created.`,
      });

      return await this.getTaxById(organizationId, newTax.id, tx);
    });
  }

  async updateTax(organizationId: string, userId: string, id: string, data: UpdateTaxInput) {
    return await db.transaction(async (tx) => {
      const existingTax = await this.getTaxById(organizationId, id, tx);
      if (!existingTax) {
        throw new Error('Tax not found');
      }

      if (data.name) {
        const duplicate = await this.checkDuplicate(organizationId, data.name, id);
        if (duplicate) {
          throw new Error(`Tax with name '${data.name}' already exists`);
        }
      }

      const [updatedTax] = await tx
        .update(taxes)
        .set(this.withAudit(data, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (updatedTax) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'tax',
            entityId: id,
            entityDisplayId: existingTax.name,
            entityLabel: 'Tax',
            action: 'UPDATED',
            reason: 'Tax master data modified',
          },
          existingTax,
          data,
        );
      }

      return await this.getTaxById(organizationId, id, tx);
    });
  }

  async deleteTax(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const existingTax = await this.getTaxById(organizationId, id, tx);
      if (!existingTax) throw new Error('Tax not found');

      const [deletedTax] = await tx
        .update(taxes)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (deletedTax) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'tax',
          entityId: id,
          entityDisplayId: existingTax.name,
          entityLabel: 'Tax',
          action: 'DELETED',
          reason: 'Tax record soft-deleted',
        });
      }

      return deletedTax;
    });
  }

  async bulkDeleteTaxes(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    return await db.transaction(async (tx) => {
      const taxesToDelete = await tx.query.taxes.findMany({
        where: and(eq(taxes.organizationId, organizationId), inArray(taxes.id, ids)),
      });

      const deletedTaxes = await tx
        .update(taxes)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(and(eq(taxes.organizationId, organizationId), inArray(taxes.id, ids)))
        .returning();

      for (const t of taxesToDelete) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'tax',
          entityId: t.id,
          entityDisplayId: t.name,
          entityLabel: 'Tax',
          action: 'DELETED',
          reason: 'Tax record soft-deleted via bulk action',
        });
      }

      return deletedTaxes;
    });
  }
}

export const taxesService = new TaxesService();
