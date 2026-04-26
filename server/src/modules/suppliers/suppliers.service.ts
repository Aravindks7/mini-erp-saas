import { db } from '../../db/index.js';
import {
  suppliers,
  supplierAddresses,
  supplierContacts,
} from '../../db/schema/suppliers.schema.js';
import { addresses, contacts } from '../../db/schema/index.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import {
  createSupplierSchema,
  CreateSupplierInput,
  UpdateSupplierInput,
} from '#shared/contracts/suppliers.contract.js';

import { BaseService } from '../../lib/base.service.js';
import { parseCsv } from '../../utils/csv.js';
import { logger } from '../../utils/logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
type SupplierWithRelations = Awaited<ReturnType<SuppliersService['getSupplierById']>>;

export class SuppliersService extends BaseService<typeof suppliers> {
  constructor() {
    super(suppliers);
  }

  async listSuppliers(organizationId: string) {
    return await db.query.suppliers.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        addresses: {
          with: { address: true },
        },
        contacts: {
          with: { contact: true },
        },
      },
      orderBy: (suppliers, { desc }) => [desc(suppliers.createdAt)],
    });
  }

  async getSupplierById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.suppliers.findFirst({
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

  async checkDuplicate(organizationId: string, name: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(suppliers.organizationId, organizationId),
      eq(suppliers.name, name),
      sql`${suppliers.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(suppliers.id, excludeId));
    }

    return await db.query.suppliers.findFirst({
      where: and(...whereConditions),
    });
  }

  async createSupplier(organizationId: string, userId: string, data: CreateSupplierInput) {
    return await db.transaction(async (tx) => {
      // 0. Duplicate check
      const existing = await this.checkDuplicate(organizationId, data.name);
      logger.info({ existing, name: data.name }, 'Duplicate check result');
      if (existing) {
        throw new Error(`Supplier with name '${data.name}' already exists`);
      }

      // 1. Create Supplier
      const { addresses: addressData, contacts: contactData, ...supplierData } = data;

      const [newSupplier] = await tx
        .insert(suppliers)
        .values(this.withAudit({ ...supplierData, organizationId }, userId))
        .returning();

      if (!newSupplier) {
        throw new Error('Failed to create supplier record');
      }

      // 2. Handle Addresses
      if (addressData && addressData.length > 0) {
        // Enforce exactly one primary
        let primaryFound = false;
        const processedAddresses = addressData.map(
          (a: NonNullable<CreateSupplierInput['addresses']>[number]) => {
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
            throw new Error('Failed to create address record during supplier setup');
          }

          await tx
            .insert(supplierAddresses)
            .values(
              this.withAudit(
                {
                  organizationId,
                  supplierId: newSupplier.id,
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
          (c: NonNullable<CreateSupplierInput['contacts']>[number]) => {
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
            throw new Error('Failed to create contact record during supplier setup');
          }

          await tx
            .insert(supplierContacts)
            .values(
              this.withAudit(
                {
                  organizationId,
                  supplierId: newSupplier.id,
                  contactId: newCont.id,
                  isPrimary: !!isPrimary,
                },
                userId,
              ),
            )
            .returning();
        }
      }

      return await this.getSupplierById(organizationId, newSupplier.id, tx);
    });
  }

  async updateSupplier(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateSupplierInput,
  ) {
    return await db.transaction(async (tx) => {
      const { addresses: addressData, contacts: contactData, ...supplierData } = data;

      // 1. Update Supplier Base
      const [updatedSupplier] = await tx
        .update(suppliers)
        .set(this.withAudit(supplierData, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (!updatedSupplier) return null;

      // 2. Update Addresses (Upsert & Prune)
      if (addressData !== undefined) {
        const existingJunctions = await tx.query.supplierAddresses.findMany({
          where: eq(supplierAddresses.supplierId, id),
        });

        // Identify to delete
        const incomingIds = addressData
          .map((a: NonNullable<UpdateSupplierInput['addresses']>[number]) => a.id)
          .filter(Boolean) as string[];
        const junctionsToDelete = existingJunctions.filter(
          (j) => !incomingIds.includes(j.addressId),
        );

        if (junctionsToDelete.length > 0) {
          const addressIdsToDelete = junctionsToDelete.map((j) => j.addressId);
          // Delete link then delete address
          await tx
            .delete(supplierAddresses)
            .where(inArray(supplierAddresses.addressId, addressIdsToDelete));
          await tx.delete(addresses).where(inArray(addresses.id, addressIdsToDelete));
        }

        // Upsert
        let primaryFoundInIncoming = false;

        const processedAddressData = addressData.map(
          (a: NonNullable<UpdateSupplierInput['addresses']>[number]) => {
            const isPrimary = a.isPrimary && !primaryFoundInIncoming;
            if (isPrimary) {
              primaryFoundInIncoming = true;
            }
            return { ...a, isPrimary };
          },
        );

        if (primaryFoundInIncoming) {
          await tx
            .update(supplierAddresses)
            .set({ isPrimary: false })
            .where(eq(supplierAddresses.supplierId, id));
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
              .update(supplierAddresses)
              .set(this.withAudit({ isPrimary: !!isPrimary, addressType }, userId, true))
              .where(
                and(eq(supplierAddresses.supplierId, id), eq(supplierAddresses.addressId, addrId)),
              );
          } else {
            // Insert new
            const [newAddr] = await tx
              .insert(addresses)
              .values(this.withAudit({ ...addressFields, organizationId }, userId))
              .returning();

            if (!newAddr) {
              throw new Error('Failed to create new address record during supplier update');
            }

            await tx.insert(supplierAddresses).values(
              this.withAudit(
                {
                  organizationId,
                  supplierId: id,
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
        const existingJunctions = await tx.query.supplierContacts.findMany({
          where: eq(supplierContacts.supplierId, id),
        });

        const incomingIds = contactData
          .map((c: NonNullable<UpdateSupplierInput['contacts']>[number]) => c.id)
          .filter(Boolean) as string[];
        const junctionsToDelete = existingJunctions.filter(
          (j) => !incomingIds.includes(j.contactId),
        );

        if (junctionsToDelete.length > 0) {
          const contactIdsToDelete = junctionsToDelete.map((j) => j.contactId);
          await tx
            .delete(supplierContacts)
            .where(inArray(supplierContacts.contactId, contactIdsToDelete));
          await tx.delete(contacts).where(inArray(contacts.id, contactIdsToDelete));
        }

        let primaryFoundInIncoming = false;
        const processedContactData = contactData.map(
          (c: NonNullable<UpdateSupplierInput['contacts']>[number]) => {
            const isPrimary = c.isPrimary && !primaryFoundInIncoming;
            if (isPrimary) primaryFoundInIncoming = true;
            return { ...c, isPrimary };
          },
        );

        if (primaryFoundInIncoming) {
          await tx
            .update(supplierContacts)
            .set({ isPrimary: false })
            .where(eq(supplierContacts.supplierId, id));
        }

        for (const cont of processedContactData) {
          const { id: contId, isPrimary, ...contactFields } = cont;

          if (contId) {
            await tx
              .update(contacts)
              .set(this.withAudit(contactFields, userId, true))
              .where(eq(contacts.id, contId));

            await tx
              .update(supplierContacts)
              .set(this.withAudit({ isPrimary: !!isPrimary }, userId, true))
              .where(
                and(eq(supplierContacts.supplierId, id), eq(supplierContacts.contactId, contId)),
              );
          } else {
            const [newCont] = await tx
              .insert(contacts)
              .values(this.withAudit({ ...contactFields, organizationId }, userId))
              .returning();

            if (!newCont) {
              throw new Error('Failed to create new contact record during supplier update');
            }

            await tx.insert(supplierContacts).values(
              this.withAudit(
                {
                  organizationId,
                  supplierId: id,
                  contactId: newCont.id,
                  isPrimary: !!isPrimary,
                },
                userId,
              ),
            );
          }
        }
      }

      return await this.getSupplierById(organizationId, id, tx);
    });
  }

  async deleteSupplier(organizationId: string, userId: string, id: string) {
    const [deletedSupplier] = await db
      .update(suppliers)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    return deletedSupplier;
  }

  async bulkDeleteSuppliers(organizationId: string, userId: string, ids: string[]) {
    if (ids.length === 0) return [];

    const deletedSuppliers = await db
      .update(suppliers)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(and(eq(suppliers.organizationId, organizationId), inArray(suppliers.id, ids)))
      .returning();

    return deletedSuppliers;
  }

  async exportSuppliers(organizationId: string) {
    const data = await this.listSuppliers(organizationId);

    // Flatten for CSV
    return data.map((s) => {
      const primaryAddress = s.addresses.find((a) => a.isPrimary)?.address;
      const primaryContact = s.contacts.find((c) => c.isPrimary)?.contact;

      return {
        name: s.name,
        taxNumber: s.taxNumber || '',
        status: s.status,
        contactFirstName: primaryContact?.firstName || '',
        contactLastName: primaryContact?.lastName || '',
        contactEmail: primaryContact?.email || '',
        addressLine1: primaryAddress?.addressLine1 || '',
        city: primaryAddress?.city || '',
        country: primaryAddress?.country || '',
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : '',
      };
    });
  }

  async importSuppliers(organizationId: string, userId: string, buffer: Buffer) {
    const rawData = parseCsv<Record<string, string | undefined>>(buffer);
    const summary = {
      totalProcessed: rawData.length,
      successCount: 0,
      failedCount: 0,
      errors: [] as Array<{ row: number; message: string }>,
      successfulRecords: [] as SupplierWithRelations[],
    };

    for (let i = 0; i < rawData.length; i++) {
      const rowNum = i + 1;
      const row = rawData[i];
      if (!row || !row.name) {
        summary.failedCount++;
        summary.errors.push({ row: rowNum, message: 'Missing name' });
        continue;
      }

      try {
        const supplierData: CreateSupplierInput = {
          name: row.name,
          taxNumber: row.taxNumber || undefined,
          status: (row.status || 'active') as CreateSupplierInput['status'],
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

        const validation = createSupplierSchema.safeParse(supplierData);
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

        const existing = await this.checkDuplicate(organizationId, validation.data.name);

        if (existing) {
          summary.failedCount++;
          summary.errors.push({
            row: rowNum,
            message: `Supplier with name '${validation.data.name}' already exists`,
          });
          continue;
        }

        const newSupplier = await this.createSupplier(organizationId, userId, validation.data);
        summary.successCount++;
        summary.successfulRecords.push(newSupplier);
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

export const suppliersService = new SuppliersService();
