import { db } from '../../db/index.js';
import { customers } from '../../db/schema/master.js';
import { and, eq, sql } from 'drizzle-orm';
import { CreateCustomerInput, UpdateCustomerInput } from './customers.schema.js';

import { BaseService } from '../../lib/base.service.js';

export class CustomersService extends BaseService<typeof customers> {
  constructor() {
    super(customers);
  }

  async listCustomers(organizationId: string) {
    return await db.query.customers.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    });
  }

  async getCustomerById(organizationId: string, id: string) {
    return await db.query.customers.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async createCustomer(organizationId: string, userId: string, data: CreateCustomerInput) {
    const [newCustomer] = await db
      .insert(customers)
      .values(this.withAudit({ ...data, organizationId }, userId))
      .returning();

    return newCustomer;
  }

  async updateCustomer(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateCustomerInput,
  ) {
    const [updatedCustomer] = await db
      .update(customers)
      .set(this.withAudit(data, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    return updatedCustomer;
  }

  async deleteCustomer(organizationId: string, userId: string, id: string) {
    const [deletedCustomer] = await db
      .update(customers)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    return deletedCustomer;
  }
}

export const customersService = new CustomersService();
