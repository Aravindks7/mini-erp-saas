import { and, eq, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';

/**
 * Base service class providing common utilities for multi-tenancy and audit logging.
 */
export abstract class BaseService<TTable extends PgTable<any>> {
  constructor(protected table: TTable) {}

  /**
   * Helper to get common where clause for tenant isolation and soft-delete.
   */
  protected getTenantWhere(organizationId: string, id?: string) {
    const conditions = [
      eq((this.table as any).organizationId, organizationId),
      sql`${(this.table as any).deletedAt} IS NULL`,
    ];

    if (id) {
      conditions.push(eq((this.table as any).id, id));
    }

    return and(...conditions);
  }

  /**
   * Helper to inject audit fields into insert/update data.
   */
  protected withAudit<TData>(data: TData, userId: string, isUpdate = false) {
    const auditData: any = {
      ...data,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (!isUpdate) {
      auditData.createdBy = userId;
    }

    return auditData;
  }
}
