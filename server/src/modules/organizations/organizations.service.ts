import { db } from '../../db/index.js';
import {
  organizations,
  organizationMemberships,
  roles,
  documentSequences,
  currencies,
} from '../../db/schema/index.js';
import { and, eq, sql, ne } from 'drizzle-orm';
import { type CreateOrganizationInput, type UpdateOrganizationInput } from '#shared/index.js';
import { rbacService } from '../rbac/rbac.service.js';
import { PERMISSIONS, type Permission } from '#shared/index.js';
import { getCurrencyByCountry } from '#shared/utils/currency-map.js';
import { ActivityLogger } from '../../lib/activity-logger.js';
import { AppError } from '../../utils/AppError.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class OrganizationsService {
  /**
   * Create a new organization and make the creator its admin.
   */
  async createOrganization(userId: string, data: CreateOrganizationInput) {
    return await db.transaction(async (tx) => {
      // 1. Generate unique slug if not provided
      const slug = data.slug || this.generateSlug(data.name);

      // Check for collisions and append suffix if needed
      let isUnique = false;
      let counter = 0;
      let finalSlug = slug;

      while (!isUnique) {
        const existing = await tx.query.organizations.findFirst({
          where: eq(organizations.slug, finalSlug),
        });

        if (!existing) {
          isUnique = true;
        } else {
          counter++;
          const suffix = Math.random().toString(36).substring(2, 6);
          finalSlug = `${slug}-${suffix}`;
          if (counter > 5) throw new Error('Could not generate a unique slug');
        }
      }

      // 2. Create the organization
      const [newOrg] = await tx
        .insert(organizations)
        .values({
          name: data.name,
          slug: finalSlug,
          defaultCountry: data.defaultCountry,
        })
        .returning();

      if (!newOrg) throw new Error('Failed to create organization');

      // 3. Resolve the "Admin" base role (Global)
      const adminRole = await tx.query.roles.findFirst({
        where: and(
          eq(roles.name, 'Admin'),
          eq(roles.isBaseRole, true),
          sql`${roles.organizationId} IS NULL`,
        ),
      });

      if (!adminRole) {
        throw new Error('SYSTEM_ERROR: Base Admin role not found. Please seed the database.');
      }

      // 4. Link the current user as an admin
      await tx.insert(organizationMemberships).values({
        userId,
        organizationId: newOrg.id,
        roleId: adminRole.id,
      });

      // 5. Seed default document sequences
      const sequenceTypes = ['SO', 'PO', 'INV', 'REC', 'SHP', 'BILL', 'PAY', 'ADJ'];
      const sequenceValues = sequenceTypes.map((type) => ({
        organizationId: newOrg.id,
        type,
        prefix: `${type}-`,
        nextValue: 1,
        padding: 4,
        createdBy: userId,
        updatedBy: userId,
      }));

      await tx.insert(documentSequences).values(sequenceValues);

      // 6. Sync default currency
      await this.syncDefaultCurrency(tx, newOrg.id, userId, newOrg.defaultCountry);

      await ActivityLogger.record(tx as Transaction, {
        organizationId: newOrg.id,
        userId,
        entityType: 'organization',
        entityId: newOrg.id,
        entityDisplayId: newOrg.slug,
        entityLabel: 'Organization',
        action: 'CREATED',
        reason: `Organization ${newOrg.name} created.`,
      });

      return newOrg;
    });
  }

  /**
   * Simple slug generator.
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * List all organizations the user is a member of.
   */
  async listMyOrganizations(userId: string) {
    const myOrgs = await db.query.organizationMemberships.findMany({
      where: (m, { eq }) => eq(m.userId, userId),
      with: {
        organization: true,
        role: true,
      },
    });

    return myOrgs.map((m) => ({
      ...m.organization,
      roleId: m.roleId,
      roleName: m.role.name,
    }));
  }

  /**
   * Update organization details.
   */
  async updateOrganization(adminId: string, organizationId: string, data: UpdateOrganizationInput) {
    return await db.transaction(async (tx) => {
      // 1. Verify requester has permission
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.SETTINGS);

      const existingOrg = await tx.query.organizations.findFirst({
        where: eq(organizations.id, organizationId),
      });
      if (!existingOrg) throw new AppError('Organization not found', 404);

      const updateData: UpdateOrganizationInput & { updatedAt: Date } = {
        ...data,
        updatedAt: new Date(),
      };

      // 2. Handle slug uniqueness
      if (data.slug) {
        let finalSlug = data.slug;
        let isUnique = false;
        let counter = 0;

        while (!isUnique) {
          const existing = await tx.query.organizations.findFirst({
            where: and(eq(organizations.slug, finalSlug), ne(organizations.id, organizationId)),
          });

          if (!existing) {
            isUnique = true;
          } else {
            counter++;
            const suffix = Math.random().toString(36).substring(2, 6);
            finalSlug = `${data.slug}-${suffix}`;
            if (counter > 5) throw new Error('Could not generate a unique slug');
          }
        }
        updateData.slug = finalSlug;
      }

      const [updated] = await tx
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!updated) throw new AppError('Failed to update organization', 500);

      // 3. Sync default currency if country changed
      if (data.defaultCountry) {
        await this.syncDefaultCurrency(tx, organizationId, adminId, data.defaultCountry);
      }

      await ActivityLogger.recordUpdate(
        tx as Transaction,
        {
          organizationId,
          userId: adminId,
          entityType: 'organization',
          entityId: organizationId,
          entityDisplayId: updated.slug,
          entityLabel: 'Organization',
          action: 'UPDATED',
          reason: 'Organization settings modified.',
        },
        existingOrg,
        data,
      );

      return updated;
    });
  }

  /**
   * Delete an organization.
   */
  async deleteOrganization(adminId: string, organizationId: string) {
    return await db.transaction(async (tx) => {
      await this.ensurePermission(adminId, organizationId, PERMISSIONS.ORGANIZATION.SETTINGS);

      const [deleted] = await tx
        .delete(organizations)
        .where(eq(organizations.id, organizationId))
        .returning();

      if (!deleted) throw new AppError('Organization not found', 404);

      return { success: true };
    });
  }

  private async ensurePermission(userId: string, organizationId: string, permission: string) {
    const permissions = await rbacService.getPermissions(userId, organizationId);
    if (!permissions.includes(permission as Permission)) {
      throw new AppError('Forbidden', 403);
    }
  }

  /**
   * Synchronize the default currency based on the organization's country.
   */
  private async syncDefaultCurrency(
    tx: Transaction,
    organizationId: string,
    userId: string,
    countryCode: string,
  ) {
    const currency = getCurrencyByCountry(countryCode);

    // 1. Unset any existing defaults
    await tx
      .update(currencies)
      .set({ isDefault: false, updatedAt: new Date(), updatedBy: userId })
      .where(eq(currencies.organizationId, organizationId));

    // 2. Check if the currency record already exists
    const existing = await tx.query.currencies.findFirst({
      where: and(
        eq(currencies.organizationId, organizationId),
        sql`lower(${currencies.code}) = ${currency.code.toLowerCase()}`,
      ),
    });

    if (existing) {
      await tx
        .update(currencies)
        .set({
          isDefault: true,
          isActive: true,
          updatedAt: new Date(),
          updatedBy: userId,
        })
        .where(eq(currencies.id, existing.id));
    } else {
      await tx.insert(currencies).values({
        organizationId,
        code: currency.code,
        symbol: currency.symbol,
        name: currency.name,
        isDefault: true,
        isActive: true,
        createdBy: userId,
        updatedBy: userId,
      });
    }
  }
}

export const organizationsService = new OrganizationsService();
