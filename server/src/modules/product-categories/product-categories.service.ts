import { db } from '../../db/index.js';
import { productCategories } from '../../db/schema/product-categories.schema.js';
import { and, eq, ne, sql, type SQL } from 'drizzle-orm';
import {
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
} from '#shared/contracts/product-categories.contract.js';

import { BaseService } from '../../lib/base.service.js';
import { ActivityLogger } from '../../lib/activity-logger.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ProductCategoriesService extends BaseService<typeof productCategories> {
  constructor() {
    super(productCategories);
  }

  async listCategories(organizationId: string) {
    return await db.query.productCategories.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (productCategories, { asc }) => [asc(productCategories.name)],
    });
  }

  async getCategoryById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.productCategories.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async checkDuplicate(organizationId: string, code: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(productCategories.organizationId, organizationId),
      eq(productCategories.code, code),
      sql`${productCategories.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(productCategories.id, excludeId));
    }

    return await db.query.productCategories.findFirst({
      where: and(...whereConditions),
    });
  }

  /**
   * Prevents circular dependencies in the category hierarchy.
   * If setting parentId for categoryId, categoryId must not be an ancestor of parentId.
   */
  async validateHierarchy(
    organizationId: string,
    categoryId: string | null,
    parentId: string | null,
    tx: Transaction | typeof db = db,
  ) {
    if (!parentId) return true;
    if (categoryId === parentId) {
      throw new Error('A category cannot be its own parent');
    }

    let currentParentId: string | null = parentId;
    const visited = new Set<string>();

    while (currentParentId) {
      if (currentParentId === categoryId) {
        throw new Error(
          'Circular dependency detected: The selected parent is a descendant of this category',
        );
      }

      if (visited.has(currentParentId)) {
        // This should technically not happen if hierarchy is always validated
        throw new Error('Existing circular dependency detected in hierarchy');
      }
      visited.add(currentParentId);

      const parent: { parentId: string | null } | undefined =
        await tx.query.productCategories.findFirst({
          where: this.getTenantWhere(organizationId, currentParentId),
          columns: { parentId: true },
        });

      currentParentId = parent?.parentId ?? null;
    }

    return true;
  }

  async createCategory(organizationId: string, userId: string, data: CreateProductCategoryInput) {
    return await db.transaction(async (tx) => {
      // 1. Duplicate check
      const existing = await this.checkDuplicate(organizationId, data.code);
      if (existing) {
        throw new Error(`Product category with code '${data.code}' already exists`);
      }

      // 2. Hierarchy validation
      if (data.parentId) {
        await this.validateHierarchy(organizationId, null, data.parentId, tx);
      }

      // 3. Create Category
      const [newCategory] = await tx
        .insert(productCategories)
        .values(this.withAudit({ ...data, organizationId }, userId))
        .returning();

      if (!newCategory) {
        throw new Error('Failed to create product category record');
      }

      await ActivityLogger.record(tx as Transaction, {
        organizationId,
        userId,
        entityType: 'product_category',
        entityId: newCategory.id,
        entityDisplayId: newCategory.code,
        entityLabel: 'Product Category',
        action: 'CREATED',
        reason: `Product category ${newCategory.name} (${newCategory.code}) created.`,
      });

      return await this.getCategoryById(organizationId, newCategory.id, tx);
    });
  }

  async updateCategory(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateProductCategoryInput,
  ) {
    return await db.transaction(async (tx) => {
      const existingCategory = await this.getCategoryById(organizationId, id, tx);
      if (!existingCategory) {
        throw new Error('Product category not found');
      }

      // 1. Duplicate check
      if (data.code) {
        const duplicate = await this.checkDuplicate(organizationId, data.code, id);
        if (duplicate) {
          throw new Error(`Product category with code '${data.code}' already exists`);
        }
      }

      // 2. Hierarchy validation
      if (data.parentId !== undefined) {
        await this.validateHierarchy(organizationId, id, data.parentId, tx);
      }

      // 3. Update Category
      const [updatedCategory] = await tx
        .update(productCategories)
        .set(this.withAudit(data, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (updatedCategory) {
        await ActivityLogger.recordUpdate(
          tx as Transaction,
          {
            organizationId,
            userId,
            entityType: 'product_category',
            entityId: id,
            entityDisplayId: existingCategory.code,
            entityLabel: 'Product Category',
            action: 'UPDATED',
            reason: 'Product category master data modified',
          },
          existingCategory,
          data,
        );
      }

      return await this.getCategoryById(organizationId, id, tx);
    });
  }

  async deleteCategory(organizationId: string, userId: string, id: string) {
    return await db.transaction(async (tx) => {
      const existingCategory = await this.getCategoryById(organizationId, id, tx);
      if (!existingCategory) throw new Error('Product category not found');

      // Check if category has children
      const child = await tx.query.productCategories.findFirst({
        where: and(
          eq(productCategories.organizationId, organizationId),
          eq(productCategories.parentId, id),
          sql`${productCategories.deletedAt} IS NULL`,
        ),
      });

      if (child) {
        throw new Error('Cannot delete category that has sub-categories');
      }

      const [deletedCategory] = await tx
        .update(productCategories)
        .set(this.withAudit({ deletedAt: new Date() }, userId, true))
        .where(this.getTenantWhere(organizationId, id))
        .returning();

      if (deletedCategory) {
        await ActivityLogger.record(tx as Transaction, {
          organizationId,
          userId,
          entityType: 'product_category',
          entityId: id,
          entityDisplayId: existingCategory.code,
          entityLabel: 'Product Category',
          action: 'DELETED',
          reason: 'Product category record soft-deleted',
        });
      }

      return deletedCategory;
    });
  }
}

export const productCategoriesService = new ProductCategoriesService();
