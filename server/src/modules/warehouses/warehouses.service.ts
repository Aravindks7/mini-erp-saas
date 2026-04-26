import { db } from '../../db/index.js';
import { warehouses, warehouseAddresses, bins, addresses } from '../../db/schema/index.js';
import { and, eq, inArray, ne, sql, type SQL, notInArray } from 'drizzle-orm';
import {
  createWarehouseSchema,
  CreateWarehouseInput,
  UpdateWarehouseInput,
} from '#shared/contracts/warehouses.contract.js';
import { BaseService } from '../../lib/base.service.js';
import { parseCsv } from '../../utils/csv.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type WarehouseWithRelations = Awaited<ReturnType<WarehousesService['getWarehouseById']>>;

export class WarehousesService extends BaseService<typeof warehouses> {
  constructor() {
    super(warehouses);
  }

  async listWarehouses(organizationId: string) {
    return await db.query.warehouses.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        addresses: {
          with: { address: true },
        },
      },
      orderBy: (warehouses, { desc }) => [desc(warehouses.createdAt)],
    });
  }

  async getWarehouseById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.warehouses.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        addresses: {
          with: { address: true },
        },
      },
    });
  }

  async checkDuplicate(organizationId: string, code: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(warehouses.organizationId, organizationId),
      eq(warehouses.code, code),
      sql`${warehouses.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(warehouses.id, excludeId));
    }

    return await db.query.warehouses.findFirst({
      where: and(...whereConditions),
    });
  }

  async createWarehouse(organizationId: string, userId: string, data: CreateWarehouseInput) {
    return await db.transaction(async (tx) => {
      // 0. Duplicate check
      const existing = await this.checkDuplicate(organizationId, data.code);
      if (existing) {
        throw new Error(`Warehouse with code '${data.code}' already exists`);
      }

      // 1. Create Warehouse
      const { addresses: addressData, bins: binData, ...warehouseData } = data;

      const [newWarehouse] = await tx
        .insert(warehouses)
        .values(this.withAudit({ ...warehouseData, organizationId }, userId))
        .returning();

      if (!newWarehouse) {
        throw new Error('Failed to create warehouse record');
      }

      // 2. Handle Addresses
      if (addressData && addressData.length > 0) {
        let primaryFound = false;
        const processedAddresses = addressData.map((a) => {
          const isPrimary = a.isPrimary && !primaryFound;
          if (isPrimary) primaryFound = true;
          return { ...a, isPrimary };
        });
        if (!primaryFound && processedAddresses.length > 0) {
          processedAddresses[0]!.isPrimary = true;
        }

        for (const addr of processedAddresses) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { isPrimary, addressType, ...addressFields } = addr;
          const [newAddr] = await tx
            .insert(addresses)
            .values(this.withAudit({ ...addressFields, organizationId }, userId))
            .returning();

          if (!newAddr) {
            throw new Error('Failed to create address record during warehouse setup');
          }

          await tx.insert(warehouseAddresses).values(
            this.withAudit(
              {
                organizationId,
                warehouseId: newWarehouse.id,
                addressId: newAddr.id,
                isPrimary: !!isPrimary,
              },
              userId,
            ),
          );
        }
      }

      // 3. Handle Bins
      if (binData && binData.length > 0) {
        for (const b of binData) {
          await tx.insert(bins).values(
            this.withAudit(
              {
                ...b,
                organizationId,
                warehouseId: newWarehouse.id,
              },
              userId,
            ),
          );
        }
      }

      return await this.getWarehouseById(organizationId, newWarehouse.id, tx);
    });
  }

  async updateWarehouse(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateWarehouseInput,
  ) {
    return await db.transaction(async (tx) => {
      const { addresses: addressData, bins: binData, ...warehouseData } = data;

      // 1. Update Warehouse Base
      const [updatedWarehouse] = await tx
        .update(warehouses)
        .set(this.withAudit(warehouseData, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (!updatedWarehouse) return null;

      // 2. Update Addresses (Upsert & Prune)
      if (addressData !== undefined) {
        const existingJunctions = await tx.query.warehouseAddresses.findMany({
          where: eq(warehouseAddresses.warehouseId, id),
        });

        const incomingIds = addressData.map((a) => a.id).filter(Boolean) as string[];
        const junctionsToDelete = existingJunctions.filter(
          (j) => !incomingIds.includes(j.addressId),
        );

        if (junctionsToDelete.length > 0) {
          const addressIdsToDelete = junctionsToDelete.map((j) => j.addressId);
          await tx
            .delete(warehouseAddresses)
            .where(inArray(warehouseAddresses.addressId, addressIdsToDelete));
          await tx.delete(addresses).where(inArray(addresses.id, addressIdsToDelete));
        }

        let primaryFoundInIncoming = false;
        const processedAddressData = addressData.map((a) => {
          const isPrimary = a.isPrimary && !primaryFoundInIncoming;
          if (isPrimary) primaryFoundInIncoming = true;
          return { ...a, isPrimary };
        });

        if (primaryFoundInIncoming) {
          await tx
            .update(warehouseAddresses)
            .set({ isPrimary: false })
            .where(eq(warehouseAddresses.warehouseId, id));
        }

        for (const addr of processedAddressData) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { id: addrId, isPrimary, addressType, ...addressFields } = addr;

          if (addrId) {
            await tx
              .update(addresses)
              .set(this.withAudit(addressFields, userId, true))
              .where(eq(addresses.id, addrId));

            await tx
              .update(warehouseAddresses)
              .set(this.withAudit({ isPrimary: !!isPrimary }, userId, true))
              .where(
                and(
                  eq(warehouseAddresses.warehouseId, id),
                  eq(warehouseAddresses.addressId, addrId),
                ),
              );
          } else {
            const [newAddr] = await tx
              .insert(addresses)
              .values(this.withAudit({ ...addressFields, organizationId }, userId))
              .returning();

            if (!newAddr) throw new Error('Failed to create address during warehouse update');

            await tx.insert(warehouseAddresses).values(
              this.withAudit(
                {
                  organizationId,
                  warehouseId: id,
                  addressId: newAddr.id,
                  isPrimary: !!isPrimary,
                },
                userId,
              ),
            );
          }
        }
      }

      // 3. Update Bins (Sync logic)
      if (binData !== undefined) {
        const incomingIds = binData.map((b) => b.id).filter(Boolean) as string[];

        // Soft-delete removed bins
        await tx
          .update(bins)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(
            and(
              eq(bins.warehouseId, id),
              incomingIds.length > 0 ? notInArray(bins.id, incomingIds) : undefined,
              sql`${bins.deletedAt} IS NULL`,
            ),
          );

        for (const b of binData) {
          const { id: binId, ...binFields } = b;
          if (binId) {
            await tx
              .update(bins)
              .set(this.withAudit(binFields, userId, true))
              .where(and(eq(bins.id, binId), eq(bins.warehouseId, id)));
          } else {
            await tx.insert(bins).values(
              this.withAudit(
                {
                  ...binFields,
                  organizationId,
                  warehouseId: id,
                },
                userId,
              ),
            );
          }
        }
      }

      return await this.getWarehouseById(organizationId, id, tx);
    });
  }

  async deleteWarehouse(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const [deleted] = await tx
        .update(warehouses)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (deleted) {
        // Soft-delete bins
        await tx
          .update(bins)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(and(eq(bins.warehouseId, id), sql`${bins.deletedAt} IS NULL`));
      }

      return deleted;
    });
  }

  async bulkDeleteWarehouses(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    return await db.transaction(async (tx) => {
      const deleted = await tx
        .update(warehouses)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(and(eq(warehouses.organizationId, organizationId), inArray(warehouses.id, ids)))
        .returning();

      if (deleted.length > 0) {
        await tx
          .update(bins)
          .set(this.withAudit({ deletedAt: new Date() }, userId, true))
          .where(and(inArray(bins.warehouseId, ids), sql`${bins.deletedAt} IS NULL`));
      }

      return deleted;
    });
  }

  async exportWarehouses(organizationId: string) {
    const data = await this.listWarehouses(organizationId);

    return data.map((w) => {
      const primaryAddress = w.addresses.find((a) => a.isPrimary)?.address;

      return {
        code: w.code,
        name: w.name,
        addressLine1: primaryAddress?.addressLine1 || '',
        city: primaryAddress?.city || '',
        country: primaryAddress?.country || '',
        createdAt: w.createdAt ? new Date(w.createdAt).toISOString() : '',
      };
    });
  }

  async importWarehouses(organizationId: string, userId: string, buffer: Buffer) {
    const rawData = parseCsv<Record<string, string | undefined>>(buffer);
    const summary = {
      totalProcessed: rawData.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as Array<{ row: number; message: string }>,
      successfulRecords: [] as WarehouseWithRelations[],
    };

    for (let i = 0; i < rawData.length; i++) {
      const rowNum = i + 1;
      const row = rawData[i];
      if (!row || !row.code || !row.name) {
        summary.failedCount++;
        summary.errors.push({ row: rowNum, message: 'Missing code or name' });
        continue;
      }

      try {
        const warehouseData: CreateWarehouseInput = {
          code: row.code,
          name: row.name,
          addresses:
            row.addressLine1 || row.city || row.country
              ? [
                  {
                    addressLine1: row.addressLine1 || 'Unknown',
                    city: row.city || 'Unknown',
                    country: row.country || 'Unknown',
                    isPrimary: true,
                  },
                ]
              : [],
        };

        const validation = createWarehouseSchema.safeParse(warehouseData);
        if (!validation.success) {
          summary.failedCount++;
          summary.errors.push({
            row: rowNum,
            message: validation.error.issues
              .map((e) => `${e.path.join('.')}: ${e.message}`)
              .join(', '),
          });
          continue;
        }

        const existing = await this.checkDuplicate(organizationId, validation.data.code);
        if (existing) {
          summary.failedCount++;
          summary.errors.push({
            row: rowNum,
            message: `Warehouse with code '${validation.data.code}' already exists`,
          });
          continue;
        }

        const newWarehouse = await this.createWarehouse(organizationId, userId, validation.data);
        summary.successCount++;
        summary.successfulRecords.push(newWarehouse);
      } catch (error: unknown) {
        summary.failedCount++;
        summary.errors.push({
          row: rowNum,
          message: (error as Error).message || 'Unknown error',
        });
      }
    }

    return summary;
  }
}

export const warehousesService = new WarehousesService();
