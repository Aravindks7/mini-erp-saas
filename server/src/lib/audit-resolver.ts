import { db } from '../db/index.js';
import type { EntityType } from '#shared/config/activity-actions.config.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

interface FieldConfig {
  table: string; // The camelCase key in db.query
  labelField: string;
  targetKey: string;
}

/**
 * AUDIT_CONFIG
 *
 * Defines the mapping between technical ID fields and their human-readable labels.
 * This allows the Activity Logger to automatically "hydrate" names for the audit log.
 */
const AUDIT_CONFIG: Partial<Record<EntityType, Record<string, FieldConfig>>> = {
  sales_order: {
    customerId: { table: 'customers', labelField: 'companyName', targetKey: 'customer' },
  },
  purchase_order: {
    supplierId: { table: 'suppliers', labelField: 'companyName', targetKey: 'supplier' },
  },
  invoice: {
    customerId: { table: 'customers', labelField: 'companyName', targetKey: 'customer' },
    salesOrderId: { table: 'salesOrders', labelField: 'documentNumber', targetKey: 'salesOrder' },
  },
  bill: {
    supplierId: { table: 'suppliers', labelField: 'companyName', targetKey: 'supplier' },
    purchaseOrderId: {
      table: 'purchaseOrders',
      labelField: 'documentNumber',
      targetKey: 'purchaseOrder',
    },
  },
  inventory_adjustment: {
    warehouseId: { table: 'warehouses', labelField: 'name', targetKey: 'warehouse' },
  },
  inventory_transfer: {
    fromWarehouseId: { table: 'warehouses', labelField: 'name', targetKey: 'fromWarehouse' },
    toWarehouseId: { table: 'warehouses', labelField: 'name', targetKey: 'toWarehouse' },
  },
};

/**
 * AuditResolver
 *
 * A specialized utility for transforming technical data into human-readable audit snapshots.
 * It resolves foreign key IDs into their corresponding labels (names, document numbers, etc.).
 */
export class AuditResolver {
  /**
   * Hydrates an entity object with human-readable labels based on its EntityType.
   *
   * @param organizationId The tenant ID.
   * @param entityType The type of entity being logged.
   * @param data The raw entity data.
   * @param tx Database transaction context.
   * @returns A new object with resolved labels injected.
   */
  static async hydrate(
    organizationId: string,
    entityType: EntityType,
    data: Record<string, unknown>,
    tx: Transaction,
  ): Promise<Record<string, unknown>> {
    const config = AUDIT_CONFIG[entityType];
    if (!config) return data;

    const hydrated = { ...data };

    for (const [field, fieldConfig] of Object.entries(config)) {
      const idValue = data[field];
      if (!idValue || typeof idValue !== 'string') continue;

      try {
        // Dynamic Drizzle query
        const queryNamespace = tx.query as unknown as Record<
          string,
          { findFirst: (args: unknown) => Promise<Record<string, unknown>> }
        >;
        const queryTable = queryNamespace[fieldConfig.table];
        if (!queryTable) continue;

        const record = await queryTable.findFirst({
          where: (
            table: Record<string, unknown>,
            {
              and,
              eq,
            }: { and: (...args: unknown[]) => unknown; eq: (a: unknown, b: unknown) => unknown },
          ) => and(eq(table.id, idValue), eq(table.organizationId, organizationId)),
          columns: {
            [fieldConfig.labelField]: true,
          },
        });

        if (record) {
          hydrated[fieldConfig.targetKey] = record[fieldConfig.labelField];
        }
      } catch (error) {
        // Fail gracefully: if hydration fails, we just don't add the label
        console.error(`AuditResolver hydration failed for ${fieldConfig.table}:${idValue}`, error);
      }
    }

    return hydrated;
  }
}
