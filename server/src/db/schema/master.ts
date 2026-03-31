import {
  pgTable,
  text,
  timestamp,
  index,
  uniqueIndex,
  pgEnum,
  numeric,
  uuid,
  boolean,
  primaryKey,
  check,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { timestamps, userTracking, versioning, lifecycle } from './base.schema.js';
import { organizations, baseColumns } from './core.js';
import { addresses, contacts } from './common.js';

// ============================================================================
// 1. UNIT OF MEASURE (UoM) MODULE
// ============================================================================

export const unitOfMeasures = pgTable(
  'unit_of_measures',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    code: text('code').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    isDefault: boolean('is_default').default(false).notNull(),
    ...lifecycle,
  },
  (table) => [
    index('uom_org_idx').on(table.organizationId),
    uniqueIndex('uom_org_code_unique').on(table.organizationId, sql`lower(${table.code})`),
  ],
);

export const unitOfMeasuresRelations = relations(unitOfMeasures, ({ one }) => ({
  organization: one(organizations, {
    fields: [unitOfMeasures.organizationId],
    references: [organizations.id],
  }),
}));

/**
 * Conversion matrix for products to handle multiple transactional units.
 * Precision: numeric(18, 8) to maintain systemic accuracy across calculations.
 */
export const productUomConversions = pgTable(
  'product_uom_conversions',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,

    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    fromUomId: uuid('from_uom_id')
      .notNull()
      .references(() => unitOfMeasures.id),
    toUomId: uuid('to_uom_id')
      .notNull()
      .references(() => unitOfMeasures.id),
    conversionFactor: numeric('conversion_factor', { precision: 18, scale: 8 }).notNull(),
  },
  (table) => [
    index('uom_conv_org_idx').on(table.organizationId),
    index('uom_conv_product_idx').on(table.productId),
    check('product_uom_conv_factor_check', sql`${table.conversionFactor} > 0`),
  ],
);

export const productUomConversionsRelations = relations(productUomConversions, ({ one }) => ({
  organization: one(organizations, {
    fields: [productUomConversions.organizationId],
    references: [organizations.id],
  }),
  product: one(products, {
    fields: [productUomConversions.productId],
    references: [products.id],
  }),
  fromUom: one(unitOfMeasures, {
    fields: [productUomConversions.fromUomId],
    references: [unitOfMeasures.id],
    relationName: 'from_uom',
  }),
  toUom: one(unitOfMeasures, {
    fields: [productUomConversions.toUomId],
    references: [unitOfMeasures.id],
    relationName: 'to_uom',
  }),
}));

// ============================================================================
// 2. MASTER DATA ENTITIES
// ============================================================================

// --- CUSTOMERS ---

export const customerStatusEnum = pgEnum('customer_status', ['active', 'inactive']);

export const customers = pgTable(
  'customers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    companyName: text('company_name').notNull(),
    taxNumber: text('tax_number'),

    status: customerStatusEnum('status').default('active').notNull(),
  },
  (table) => [
    index('customers_org_idx').on(table.organizationId),
    index('customers_status_idx').on(table.status),
  ],
);

export const customerAddresses = pgTable(
  'customer_addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id')
      .notNull()
      .references(() => addresses.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    addressType: text('address_type'), // e.g., 'billing', 'shipping'
  },
  (table) => [
    uniqueIndex('customer_addresses_customer_id_address_id_key').on(
      table.customerId,
      table.addressId,
    ),
  ],
);

export const customerContacts = pgTable(
  'customer_contacts',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    customerId: uuid('customer_id')
      .notNull()
      .references(() => customers.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('customer_contacts_customer_id_contact_id_key').on(
      table.customerId,
      table.contactId,
    ),
  ],
);

export const customersRelations = relations(customers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [customers.organizationId],
    references: [organizations.id],
  }),
  addresses: many(customerAddresses),
  contacts: many(customerContacts),
}));

// --- PRODUCTS ---

export const productStatusEnum = pgEnum('product_status', ['active', 'inactive']);

export const products = pgTable(
  'products',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    sku: text('sku').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    basePrice: numeric('base_price', { precision: 18, scale: 8 }).notNull(),

    baseUomId: uuid('base_uom_id')
      .notNull()
      .references(() => unitOfMeasures.id),
    taxId: uuid('tax_id').references(() => taxes.id),

    status: productStatusEnum('status').default('active').notNull(),
  },
  (table) => [
    index('products_org_idx').on(table.organizationId),
    index('products_name_idx').on(table.name),
    uniqueIndex('products_org_sku_unique')
      .on(table.organizationId, sql`lower(${table.sku})`)
      .where(sql`${table.sku} IS NOT NULL AND ${table.deletedAt} IS NULL`),
    check('products_base_price_check', sql`${table.basePrice} >= 0`),
  ],
);

export const productsRelations = relations(products, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [products.organizationId],
    references: [organizations.id],
  }),
  baseUom: one(unitOfMeasures, {
    fields: [products.baseUomId],
    references: [unitOfMeasures.id],
  }),
  tax: one(taxes, {
    fields: [products.taxId],
    references: [taxes.id],
  }),
  uomConversions: many(productUomConversions),
}));

// --- SUPPLIERS ---

export const supplierStatusEnum = pgEnum('supplier_status', ['active', 'inactive']);

export const suppliers = pgTable(
  'suppliers',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,
    ...lifecycle,

    name: text('name').notNull(),
    taxNumber: text('tax_number'),

    status: supplierStatusEnum('status').default('active').notNull(),
  },
  (table) => [
    index('suppliers_org_idx').on(table.organizationId),
    index('suppliers_name_idx').on(table.name),
  ],
);

export const supplierAddresses = pgTable(
  'supplier_addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id')
      .notNull()
      .references(() => addresses.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
    addressType: text('address_type'),
  },
  (table) => [
    uniqueIndex('supplier_addresses_supplier_id_address_id_key').on(
      table.supplierId,
      table.addressId,
    ),
  ],
);

export const supplierContacts = pgTable(
  'supplier_contacts',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    supplierId: uuid('supplier_id')
      .notNull()
      .references(() => suppliers.id, { onDelete: 'cascade' }),
    contactId: uuid('contact_id')
      .notNull()
      .references(() => contacts.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('supplier_contacts_supplier_id_contact_id_key').on(
      table.supplierId,
      table.contactId,
    ),
  ],
);

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [suppliers.organizationId],
    references: [organizations.id],
  }),
  addresses: many(supplierAddresses),
  contacts: many(supplierContacts),
}));

// ============================================================================
// 3. TAXES & WAREHOUSES
// ============================================================================

export const taxes = pgTable(
  'taxes',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    name: text('name').notNull(),
    rate: numeric('rate', { precision: 18, scale: 8 }).notNull(),
    description: text('description'),
    ...lifecycle,
  },
  (table) => [
    index('taxes_org_idx').on(table.organizationId),
    check('taxes_rate_check', sql`${table.rate} >= 0`),
  ],
);

export const warehouses = pgTable(
  'warehouses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    ...versioning,

    code: text('code').notNull(),
    name: text('name').notNull(),
    ...lifecycle,
  },
  (table) => [
    index('warehouses_org_idx').on(table.organizationId),
    uniqueIndex('warehouses_org_code_unique').on(table.organizationId, sql`lower(${table.code})`),
  ],
);

export const warehouseAddresses = pgTable(
  'warehouse_addresses',
  {
    ...baseColumns,
    ...timestamps,
    ...userTracking,
    warehouseId: uuid('warehouse_id')
      .notNull()
      .references(() => warehouses.id, { onDelete: 'cascade' }),
    addressId: uuid('address_id')
      .notNull()
      .references(() => addresses.id, { onDelete: 'cascade' }),
    isPrimary: boolean('is_primary').default(false).notNull(),
  },
  (table) => [
    uniqueIndex('warehouse_addresses_warehouse_id_address_id_key').on(
      table.warehouseId,
      table.addressId,
    ),
  ],
);

export const warehousesRelations = relations(warehouses, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [warehouses.organizationId],
    references: [organizations.id],
  }),
  addresses: many(warehouseAddresses),
}));

// ============================================================================
// TYPES
// ============================================================================

export type UnitOfMeasure = typeof unitOfMeasures.$inferSelect;
export type ProductUomConversion = typeof productUomConversions.$inferSelect;
export type Customer = typeof customers.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Supplier = typeof suppliers.$inferSelect;
export type Tax = typeof taxes.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
