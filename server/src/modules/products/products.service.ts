import { db } from '../../db/index.js';
import { products } from '../../db/schema/products.schema.js';
import { unitOfMeasures } from '../../db/schema/uom.schema.js';
import { taxes } from '../../db/schema/taxes.schema.js';
import { and, eq, inArray, ne, sql, type SQL } from 'drizzle-orm';
import { CreateProductInput, UpdateProductInput } from '#shared/contracts/products.contract.js';

import { BaseService } from '../../lib/base.service.js';
import { AppError } from '../../utils/AppError.js';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export class ProductsService extends BaseService<typeof products> {
  constructor() {
    super(products);
  }

  async listProducts(organizationId: string) {
    return await db.query.products.findMany({
      where: this.getTenantWhere(organizationId),
      with: {
        baseUom: true,
        tax: true,
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });
  }

  async getProductById(organizationId: string, id: string, tx: Transaction | typeof db = db) {
    return await tx.query.products.findFirst({
      where: this.getTenantWhere(organizationId, id),
      with: {
        baseUom: true,
        tax: true,
      },
    });
  }

  async checkDuplicateSku(organizationId: string, sku: string, excludeId?: string) {
    const whereConditions: SQL[] = [
      eq(products.organizationId, organizationId),
      eq(sql`lower(${products.sku})`, sku.toLowerCase()),
      sql`${products.deletedAt} IS NULL`,
    ];

    if (excludeId) {
      whereConditions.push(ne(products.id, excludeId));
    }

    return await db.query.products.findFirst({
      where: and(...whereConditions),
    });
  }

  private async validateReferences(
    organizationId: string,
    baseUomId: string,
    taxId?: string | null,
  ) {
    // Validate UoM
    const uom = await db.query.unitOfMeasures.findFirst({
      where: and(
        eq(unitOfMeasures.id, baseUomId),
        eq(unitOfMeasures.organizationId, organizationId),
        sql`${unitOfMeasures.deletedAt} IS NULL`,
      ),
    });

    if (!uom) {
      throw new AppError('Invalid Base UoM ID or UoM does not belong to your organization', 400);
    }

    // Validate Tax
    if (taxId) {
      const tax = await db.query.taxes.findFirst({
        where: and(
          eq(taxes.id, taxId),
          eq(taxes.organizationId, organizationId),
          sql`${taxes.deletedAt} IS NULL`,
        ),
      });

      if (!tax) {
        throw new AppError('Invalid Tax ID or Tax does not belong to your organization', 400);
      }
    }
  }

  async createProduct(organizationId: string, userId: string, data: CreateProductInput) {
    // 1. Duplicate check
    const existing = await this.checkDuplicateSku(organizationId, data.sku);
    if (existing) {
      throw new AppError(`Product with SKU '${data.sku}' already exists`, 409);
    }

    // 2. Reference check
    await this.validateReferences(organizationId, data.baseUomId, data.taxId);

    // 3. Create Product
    const [newProduct] = await db
      .insert(products)
      .values(this.withAudit({ ...data, organizationId }, userId))
      .returning();

    if (!newProduct) {
      throw new AppError('Failed to create product record', 500);
    }

    return await this.getProductById(organizationId, newProduct.id);
  }

  async updateProduct(
    organizationId: string,
    userId: string,
    id: string,
    data: UpdateProductInput,
  ) {
    // 1. Check if product exists and belongs to org
    const existingProduct = await this.getProductById(organizationId, id);
    if (!existingProduct) {
      throw new AppError('Product not found', 404);
    }

    // 2. Duplicate SKU check if SKU is changing
    if (data.sku && data.sku.toLowerCase() !== existingProduct.sku.toLowerCase()) {
      const duplicate = await this.checkDuplicateSku(organizationId, data.sku, id);
      if (duplicate) {
        throw new AppError(`Product with SKU '${data.sku}' already exists`, 409);
      }
    }

    // 3. Reference check if UoM or Tax is changing
    const baseUomId = data.baseUomId || existingProduct.baseUomId;
    const taxId = data.taxId !== undefined ? data.taxId : existingProduct.taxId;

    if (data.baseUomId || data.taxId !== undefined) {
      await this.validateReferences(organizationId, baseUomId, taxId);
    }

    // 4. Update Product
    const [updatedProduct] = await db
      .update(products)
      .set(this.withAudit(data, userId))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    if (!updatedProduct) {
      throw new AppError('Failed to update product record', 500);
    }

    return await this.getProductById(organizationId, updatedProduct.id);
  }

  async deleteProduct(organizationId: string, userId: string, id: string) {
    const [deleted] = await db
      .update(products)
      .set(this.withAudit({ deletedAt: new Date() }, userId))
      .where(this.getTenantWhere(organizationId, id))
      .returning();

    if (!deleted) {
      throw new AppError('Product not found or delete failed', 404);
    }

    return deleted;
  }

  async bulkDeleteProducts(organizationId: string, userId: string, ids: string[]) {
    const results = await db
      .update(products)
      .set(this.withAudit({ deletedAt: new Date() }, userId))
      .where(and(eq(products.organizationId, organizationId), inArray(products.id, ids)))
      .returning();

    return results;
  }
}

export const productsService = new ProductsService();
