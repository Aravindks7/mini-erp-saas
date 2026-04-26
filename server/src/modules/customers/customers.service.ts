import { db } from '../../db/index.js';
import { customers } from '../../db/schema/customers.schema.js';
import { customerAddresses } from '../../db/schema/customer-addresses.schema.js';
import { customerContacts } from '../../db/schema/customer-contacts.schema.js';

import { addresses, contacts } from '../../db/schema/index.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import {
  createCustomerSchema,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '#shared/contracts/customers.contract.js';

import { BaseService } from '../../lib/base.service.js';
import { parseCsv } from '../../utils/csv.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type CustomerWithRelations = Awaited<ReturnType<CustomersService['getCustomerById']>>;

export class CustomersService extends BaseService<typeof customers> {
  constructor() {
    super(customers);
  }

  async listCustomers(organizationId: string) {
    return await db.query.customers.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        addresses: {
          with: { address: true },
        },
        contacts: {
          with: { contact: true },
        },
      },
      orderBy: (customers, { desc }) => [desc(customers.createdAt)],
    });
  }

  async getCustomerById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.customers.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        addresses: {
          with: { address: true },
        },
        contacts: {
          with: { contact: true },
        },
      },
    });
  }

  async checkDuplicate(organizationId: string, companyName: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(customers.organizationId, organizationId),
      eq(customers.companyName, companyName),
      sql`${customers.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(customers.id, excludeId));
    }

    return await db.query.customers.findFirst({
      where: and(...whereConditions),
    });
  }

  async createCustomer(organizationId: string, userId: string, data: CreateCustomerInput) {
    return await db.transaction(async (tx) => {
      // 0. Duplicate check
      const existing = await this.checkDuplicate(organizationId, data.companyName);
      if (existing) {
        throw new Error(`Customer with name '${data.companyName}' already exists`);
      }

      // 1. Create Customer
      const { addresses: addressData, contacts: contactData, ...customerData } = data;

      const [newCustomer] = await tx
        .insert(customers)
        .values(this.withAudit({ ...customerData, organizationId }, userId))
        .returning();

      if (!newCustomer) {
        throw new Error('Failed to create customer record');
      }

      // 2. Handle Addresses
      if (addressData && addressData.length > 0) {
        // Enforce exactly one primary by picking the first one marked primary, or defaulting to the first in the list
        let primaryFound = false;
        const processedAddresses = addressData.map(
          (a: NonNullable<CreateCustomerInput['addresses']>[number]) => {
            const isPrimary = a.isPrimary && !primaryFound;
            if (isPrimary) primaryFound = true;
            return { ...a, isPrimary };
          },
        );
        if (!primaryFound && processedAddresses.length > 0) {
          processedAddresses[0]!.isPrimary = true;
        }

        for (const addr of processedAddresses) {
          const { isPrimary, addressType, ...addressFields } = addr;
          const [newAddr] = await tx
            .insert(addresses)
            .values(this.withAudit({ ...addressFields, organizationId }, userId))
            .returning();

          if (!newAddr) {
            throw new Error('Failed to create address record during customer setup');
          }

          await tx
            .insert(customerAddresses)
            .values(
              this.withAudit(
                {
                  organizationId,
                  customerId: newCustomer.id,
                  addressId: newAddr.id,
                  isPrimary: !!isPrimary,
                  addressType,
                },
                userId,
              ),
            )
            .returning();
        }
      }

      // 3. Handle Contacts
      if (contactData && contactData.length > 0) {
        // Enforce exactly one primary
        let primaryFound = false;
        const processedContacts = contactData.map(
          (c: NonNullable<CreateCustomerInput['contacts']>[number]) => {
            const isPrimary = c.isPrimary && !primaryFound;
            if (isPrimary) primaryFound = true;
            return { ...c, isPrimary };
          },
        );
        if (!primaryFound && processedContacts.length > 0) {
          processedContacts[0]!.isPrimary = true;
        }

        for (const cont of processedContacts) {
          const { isPrimary, ...contactFields } = cont;
          const [newCont] = await tx
            .insert(contacts)
            .values(this.withAudit({ ...contactFields, organizationId }, userId))
            .returning();

          if (!newCont) {
            throw new Error('Failed to create contact record during customer setup');
          }

          await tx
            .insert(customerContacts)
            .values(
              this.withAudit(
                {
                  organizationId,
                  customerId: newCustomer.id,
                  contactId: newCont.id,
                  isPrimary: !!isPrimary,
                },
                userId,
              ),
            )
            .returning();
        }
      }

      return await this.getCustomerById(organizationId, newCustomer.id, tx);
    });
  }

  async updateCustomer(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateCustomerInput,
  ) {
    return await db.transaction(async (tx) => {
      const { addresses: addressData, contacts: contactData, ...customerData } = data;

      // 1. Update Customer Base
      const [updatedCustomer] = await tx
        .update(customers)
        .set(this.withAudit(customerData, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (!updatedCustomer) return null;

      // 2. Update Addresses (Upsert & Prune)
      if (addressData !== undefined) {
        const existingJunctions = await tx.query.customerAddresses.findMany({
          where: eq(customerAddresses.customerId, id),
        });

        // Identify to delete
        const incomingIds = addressData
          .map((a: NonNullable<UpdateCustomerInput['addresses']>[number]) => a.id)
          .filter(Boolean) as string[];
        const junctionsToDelete = existingJunctions.filter(
          (j) => !incomingIds.includes(j.addressId),
        );

        if (junctionsToDelete.length > 0) {
          const addressIdsToDelete = junctionsToDelete.map((j) => j.addressId);
          // Delete link then delete address (since we don't support sharing)
          await tx
            .delete(customerAddresses)
            .where(inArray(customerAddresses.addressId, addressIdsToDelete));
          await tx.delete(addresses).where(inArray(addresses.id, addressIdsToDelete));
        }

        // Upsert
        // Pre-process incoming data to ensure internal consistency (only one primary)
        let primaryFoundInIncoming = false;

        const processedAddressData = addressData.map(
          (a: NonNullable<UpdateCustomerInput['addresses']>[number]) => {
            const isPrimary = a.isPrimary && !primaryFoundInIncoming;
            if (isPrimary) {
              primaryFoundInIncoming = true;
            }
            return { ...a, isPrimary };
          },
        );

        // If a primary is designated in the incoming payload, reset ALL existing primaries first
        if (primaryFoundInIncoming) {
          await tx
            .update(customerAddresses)
            .set({ isPrimary: false })
            .where(eq(customerAddresses.customerId, id));
        }

        for (const addr of processedAddressData) {
          const { id: addrId, isPrimary, addressType, ...addressFields } = addr;

          if (addrId) {
            // Update existing
            await tx
              .update(addresses)
              .set(this.withAudit(addressFields, userId, true))
              .where(eq(addresses.id, addrId));

            await tx
              .update(customerAddresses)
              .set(this.withAudit({ isPrimary: !!isPrimary, addressType }, userId, true))
              .where(
                and(eq(customerAddresses.customerId, id), eq(customerAddresses.addressId, addrId)),
              );
          } else {
            // Insert new
            const [newAddr] = await tx
              .insert(addresses)
              .values(this.withAudit({ ...addressFields, organizationId }, userId))
              .returning();

            if (!newAddr) {
              throw new Error('Failed to create new address record during customer update');
            }

            await tx.insert(customerAddresses).values(
              this.withAudit(
                {
                  organizationId,
                  customerId: id,
                  addressId: newAddr.id,
                  isPrimary: !!isPrimary,
                  addressType,
                },
                userId,
              ),
            );
          }
        }
      }

      // 3. Update Contacts (Upsert & Prune)
      if (contactData !== undefined) {
        const existingJunctions = await tx.query.customerContacts.findMany({
          where: eq(customerContacts.customerId, id),
        });

        const incomingIds = contactData
          .map((c: NonNullable<UpdateCustomerInput['contacts']>[number]) => c.id)
          .filter(Boolean) as string[];
        const junctionsToDelete = existingJunctions.filter(
          (j) => !incomingIds.includes(j.contactId),
        );

        if (junctionsToDelete.length > 0) {
          const contactIdsToDelete = junctionsToDelete.map((j) => j.contactId);
          await tx
            .delete(customerContacts)
            .where(inArray(customerContacts.contactId, contactIdsToDelete));
          await tx.delete(contacts).where(inArray(contacts.id, contactIdsToDelete));
        }

        let primaryFoundInIncoming = false;
        const processedContactData = contactData.map(
          (c: NonNullable<UpdateCustomerInput['contacts']>[number]) => {
            const isPrimary = c.isPrimary && !primaryFoundInIncoming;
            if (isPrimary) primaryFoundInIncoming = true;
            return { ...c, isPrimary };
          },
        );

        if (primaryFoundInIncoming) {
          await tx
            .update(customerContacts)
            .set({ isPrimary: false })
            .where(eq(customerContacts.customerId, id));
        }

        for (const cont of processedContactData) {
          const { id: contId, isPrimary, ...contactFields } = cont;

          if (contId) {
            await tx
              .update(contacts)
              .set(this.withAudit(contactFields, userId, true))
              .where(eq(contacts.id, contId));

            await tx
              .update(customerContacts)
              .set(this.withAudit({ isPrimary: !!isPrimary }, userId, true))
              .where(
                and(eq(customerContacts.customerId, id), eq(customerContacts.contactId, contId)),
              );
          } else {
            const [newCont] = await tx
              .insert(contacts)
              .values(this.withAudit({ ...contactFields, organizationId }, userId))
              .returning();

            if (!newCont) {
              throw new Error('Failed to create new contact record during customer update');
            }

            await tx.insert(customerContacts).values(
              this.withAudit(
                {
                  organizationId,
                  customerId: id,
                  contactId: newCont.id,
                  isPrimary: !!isPrimary,
                },
                userId,
              ),
            );
          }
        }
      }

      return await this.getCustomerById(organizationId, id, tx);
    });
  }

  async deleteCustomer(organizationId: string, userId: string, id: string) {
    const [deletedCustomer] = await db
      .update(customers)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    // Since we don't support sharing, we could theoretically delete addresses/contacts too,
    // but the schema uses `onDelete: cascade` for junction tables, and the audit requirements
    // might prefer soft delete for everything.
    // For now, only the customer record is soft-deleted.

    return deletedCustomer;
  }

  async bulkDeleteCustomers(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    const deletedCustomers = await db
      .update(customers)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(and(eq(customers.organizationId, organizationId), inArray(customers.id, ids)))
      .returning();

    return deletedCustomers;
  }

  async exportCustomers(organizationId: string) {
    const data = await this.listCustomers(organizationId);

    // Flatten for CSV
    return data.map((c) => {
      const primaryAddress = c.addresses.find((a) => a.isPrimary)?.address;
      const primaryContact = c.contacts.find((c) => c.isPrimary)?.contact;

      return {
        companyName: c.companyName,
        taxNumber: c.taxNumber || '',
        status: c.status,
        contactFirstName: primaryContact?.firstName || '',
        contactLastName: primaryContact?.lastName || '',
        contactEmail: primaryContact?.email || '',
        addressLine1: primaryAddress?.addressLine1 || '',
        city: primaryAddress?.city || '',
        country: primaryAddress?.country || '',
        createdAt: c.createdAt ? new Date(c.createdAt).toISOString() : '',
      };
    });
  }

  async importCustomers(organizationId: string, userId: string, buffer: Buffer) {
    const rawData = parseCsv<Record<string, string | undefined>>(buffer);
    const summary = {
      totalProcessed: rawData.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as Array<{ row: number; message: string }>,
      successfulRecords: [] as CustomerWithRelations[],
    };

    for (let i = 0; i < rawData.length; i++) {
      const rowNum = i + 1;
      const row = rawData[i];
      if (!row || !row.companyName) {
        summary.failedCount++;
        summary.errors.push({ row: rowNum, message: 'Missing companyName' });
        continue;
      }

      try {
        // 1. Transform flat CSV row to nested structure for createCustomerSchema
        const customerData: CreateCustomerInput = {
          companyName: row.companyName,
          taxNumber: row.taxNumber || undefined,
          status: (row.status || 'active') as CreateCustomerInput['status'],
          contacts:
            row.contactFirstName || row.contactLastName || row.contactEmail
              ? [
                  {
                    firstName: row.contactFirstName || 'Imported',
                    lastName: row.contactLastName || 'Contact',
                    email: row.contactEmail || null,
                    isPrimary: true,
                  },
                ]
              : [],
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

        // 2. Validate
        const validation = createCustomerSchema.safeParse(customerData);
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

        // 3. Duplicate check (within tenant)
        const existing = await this.checkDuplicate(organizationId, validation.data.companyName);

        if (existing) {
          summary.failedCount++;
          summary.errors.push({
            row: rowNum,
            message: `Customer with name '${validation.data.companyName}' already exists`,
          });
          continue;
        }

        // 4. Create
        const newCustomer = await this.createCustomer(organizationId, userId, validation.data);
        summary.successCount++;
        summary.successfulRecords.push(newCustomer);
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

export const customersService = new CustomersService();
