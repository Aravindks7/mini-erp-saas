import { and, eq, sql } from 'drizzle-orm';
import { AnyPgColumn, PgTable } from 'drizzle-orm/pg-core';

/**
 * Base service class providing common utilities for multi-tenancy and audit logging.
 *
 * TTable must include organizationId and lifecycle columns (id, deletedAt, etc.).
 */
export abstract class BaseService<
  TTable extends PgTable & {
    id: AnyPgColumn;
    organizationId: AnyPgColumn;
    deletedAt: AnyPgColumn;
    updatedAt: AnyPgColumn;
    updatedBy: AnyPgColumn;
    createdBy?: AnyPgColumn;
  },
> {
  constructor(protected table: TTable) {}

  /**
   * Helper to get common where clause for tenant isolation and soft-delete.
   */
  protected getTenantWhere(organizationId: string, id?: string) {
    const conditions = [
      eq(this.table.organizationId, organizationId),
      sql`${this.table.deletedAt} IS NULL`,
    ];

    if (id) {
      conditions.push(eq(this.table.id, id));
    }

    return and(...conditions);
  }

  /**
   * Helper to inject audit fields into insert/update data.
   */
  protected withAudit<TData extends Record<string, unknown>>(
    data: TData,
    userId: string,
    isUpdate = false,
  ): TData & { updatedBy: string; updatedAt: Date; createdBy?: string } {
    const auditFields: { updatedBy: string; updatedAt: Date; createdBy?: string } = {
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (!isUpdate) {
      auditFields.createdBy = userId;
    }

    return {
      ...data,
      ...auditFields,
    };
  }
}
