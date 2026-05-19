import { db } from '../../db/index.js';
import { unitOfMeasures } from '../../db/schema/uom.schema.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { CreateUomInput, UpdateUomInput } from '#shared/contracts/uom.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class UomService extends BaseService<typeof unitOfMeasures> {
  constructor() {
    super(unitOfMeasures);
  }

  async listUoms(organizationId: string) {
    return await db.query.unitOfMeasures.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (uoms, { desc }) => [desc(uoms.createdAt)],
    });
  }

  async getUomById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.unitOfMeasures.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async checkDuplicate(organizationId: string, code: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(unitOfMeasures.organizationId, organizationId),
      sql`lower(${unitOfMeasures.code}) = lower(${code})`,
      sql`${unitOfMeasures.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(unitOfMeasures.id, excludeId));
    }

    return await db.query.unitOfMeasures.findFirst({
      where: and(...whereConditions),
    });
  }

  async createUom(organizationId: string, userId: string, data: CreateUomInput) {
    // 0. Duplicate check
    const existing = await this.checkDuplicate(organizationId, data.code);
    if (existing) {
      throw new Error(`UoM with code '${data.code}' already exists`);
    }

    return await db.transaction(async (tx) => {
      // 1. If this is default, unset other defaults
      if (data.isDefault) {
        await tx
          .update(unitOfMeasures)
          .set({ isDefault: false })
          .where(
            and(
              eq(unitOfMeasures.organizationId, organizationId),
              eq(unitOfMeasures.isDefault, true),
            ),
          );
      }

      // 2. Create UoM
      const [newUom] = await tx
        .insert(unitOfMeasures)
        .values(this.withAudit({ ...data, organizationId }, userId))
        .returning();

      if (!newUom) {
        throw new Error('Failed to create UoM record');
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'uom',
        entityId: newUom.id,
        entityDisplayId: newUom.code,
        entityLabel: 'Unit of Measure',
        action: 'CREATED',
        reason: `UoM ${newUom.name} (${newUom.code}) created.`,
      });

      return await this.getUomById(organizationId, newUom.id, tx);
    });
  }

  async updateUom(organizationId: string, userId: string, id: string, data: UpdateUomInput) {
    return await db.transaction(async (tx) => {
      const existingUom = await this.getUomById(organizationId, id, tx);
      if (!existingUom) {
        throw new Error('UoM not found');
      }

      // 0. Duplicate check
      if (data.code) {
        const duplicate = await this.checkDuplicate(organizationId, data.code, id);
        if (duplicate) {
          throw new Error(`UoM with code '${data.code}' already exists`);
        }
      }

      // 1. If this is being set to default, unset other defaults
      if (data.isDefault) {
        await tx
          .update(unitOfMeasures)
          .set({ isDefault: false })
          .where(
            and(
              eq(unitOfMeasures.organizationId, organizationId),
              eq(unitOfMeasures.isDefault, true),
            ),
          );
      }

      // 2. Update UoM
      const [updatedUom] = await tx
        .update(unitOfMeasures)
        .set(this.withAudit(data, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (updatedUom) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'uom',
            entityId: id,
            entityDisplayId: existingUom.code,
            entityLabel: 'Unit of Measure',
            action: 'UPDATED',
            reason: 'UoM master data modified',
          },
          existingUom,
          data,
        );
      }

      return await this.getUomById(organizationId, id, tx);
    });
  }

  async deleteUom(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const existingUom = await this.getUomById(organizationId, id, tx);
      if (!existingUom) throw new Error('UoM not found');

      const [deletedUom] = await tx
        .update(unitOfMeasures)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (deletedUom) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'uom',
          entityId: id,
          entityDisplayId: existingUom.code,
          entityLabel: 'Unit of Measure',
          action: 'DELETED',
          reason: 'UoM record soft-deleted',
        });
      }

      return deletedUom;
    });
  }

  async bulkDeleteUoms(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    return await db.transaction(async (tx) => {
      const uomsToDelete = await tx.query.unitOfMeasures.findMany({
        where: and(
          eq(unitOfMeasures.organizationId, organizationId),
          inArray(unitOfMeasures.id, ids),
        ),
      });

      const deletedUoms = await tx
        .update(unitOfMeasures)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(
          and(eq(unitOfMeasures.organizationId, organizationId), inArray(unitOfMeasures.id, ids)),
        )
        .returning();

      for (const u of uomsToDelete) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'uom',
          entityId: u.id,
          entityDisplayId: u.code,
          entityLabel: 'Unit of Measure',
          action: 'DELETED',
          reason: 'UoM record soft-deleted via bulk action',
        });
      }

      return deletedUoms;
    });
  }
}

export const uomService = new UomService();
