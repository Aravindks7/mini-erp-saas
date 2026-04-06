import { db } from '../../db/index.js';
import { customers } from '../../db/schema/customers.schema.js';
import { customerAddresses } from '../../db/schema/customer-addresses.schema.js';
import { customerContacts } from '../../db/schema/customer-contacts.schema.js';

import { addresses, contacts } from '../../db/schema/index.js';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { CreateCustomerInput, UpdateCustomerInput } from '@shared/contracts/customers.contract.js';

import { BaseService } from '../../lib/base.service.js';

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

  async getCustomerById(organizationId: string, id: string, tx: any = db) {
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

  async createCustomer(organizationId: string, userId: string, data: CreateCustomerInput) {
    return await db.transaction(async (tx) => {
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
        let incomingPrimaryId: string | null = null;
        let primaryFoundInIncoming = false;

        const processedAddressData = addressData.map(
          (a: NonNullable<UpdateCustomerInput['addresses']>[number]) => {
            const isPrimary = a.isPrimary && !primaryFoundInIncoming;
            if (isPrimary) {
              primaryFoundInIncoming = true;
              incomingPrimaryId = a.id || 'NEW';
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
}

export const customersService = new CustomersService();
