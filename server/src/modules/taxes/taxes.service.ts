import { db } from '../../db/index.js';
import { taxes } from '../../db/schema/taxes.schema.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { CreateTaxInput, UpdateTaxInput } from '#shared/contracts/taxes.contract.js';
import { BaseService } from '../../lib/base.service.js';

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

  async getTaxById(organizationId: string, id: string) {
    return await db.query.taxes.findFirst({
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
    const existing = await this.checkDuplicate(organizationId, data.name);
    if (existing) {
      throw new Error(`Tax with name '${data.name}' already exists`);
    }

    const [newTax] = await db
      .insert(taxes)
      .values(this.withAudit({ ...data, organizationId }, userId))
      .returning();

    if (!newTax) {
      throw new Error('Failed to create tax record');
    }

    return newTax;
  }

  async updateTax(organizationId: string, userId: string, id: string, data: UpdateTaxInput) {
    if (data.name) {
      const existing = await this.checkDuplicate(organizationId, data.name, id);
      if (existing) {
        throw new Error(`Tax with name '${data.name}' already exists`);
      }
    }

    const [updatedTax] = await db
      .update(taxes)
      .set(this.withAudit(data, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    return updatedTax;
  }

  async deleteTax(organizationId: string, userId: string, id: string) {
    const [deletedTax] = await db
      .update(taxes)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    return deletedTax;
  }

  async bulkDeleteTaxes(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    const deletedTaxes = await db
      .update(taxes)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(and(eq(taxes.organizationId, organizationId), inArray(taxes.id, ids)))
      .returning();

    return deletedTaxes;
  }
}

export const taxesService = new TaxesService();
