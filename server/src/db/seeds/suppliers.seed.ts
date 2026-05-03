import { db } from '../index.js';
import { suppliers, contacts, supplierContacts } from '../schema/index.js';
import { SEED_DATA } from './constants.js';
import { faker } from '@faker-js/faker';

export async function seedSuppliers() {
  console.log('🌱 Seeding Suppliers & Contacts...');

  const supplierItems = [
    {
      id: SEED_DATA.SUPPLIERS.ACME_CORP,
      name: 'ACME Corporation',
      taxNumber: 'SUP-ACME-001',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.GLOBAL_SPARES,
      name: 'Global Spares Ltd',
      taxNumber: 'SUP-GLOB-002',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.STEELWORKS_INC,
      name: 'SteelWorks Inc',
      taxNumber: 'SUP-STEEL-003',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.OFFICE_DEPOT,
      name: 'Office Depot Solutions',
      taxNumber: 'SUP-OFFICE-004',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.SILICON_SUPPLY,
      name: 'Silicon Supply Co',
      taxNumber: 'SUP-SILICON-005',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.METAL_WORKS,
      name: 'Precision Metal Works',
      taxNumber: 'SUP-METAL-006',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.TECH_PARTS,
      name: 'TechParts Distribution',
      taxNumber: 'SUP-TECH-007',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.PACKAGING_PROS,
      name: 'Packaging Pros',
      taxNumber: 'SUP-PACK-008',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.LOGISTICS_CO,
      name: 'Logistics Co',
      taxNumber: 'SUP-LOG-009',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.PREMIER_IT,
      name: 'Premier IT Solutions',
      taxNumber: 'SUP-IT-010',
      status: 'active' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.INACTIVE_SUPP_1,
      name: 'Old World Manufacturing',
      taxNumber: 'SUP-INACT-011',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.INACTIVE_SUPP_2,
      name: 'Defunct Distribution',
      taxNumber: 'SUP-INACT-012',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.INACTIVE_SUPP_3,
      name: 'Lost Logistics',
      taxNumber: 'SUP-INACT-013',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.INACTIVE_SUPP_4,
      name: 'Gone Global',
      taxNumber: 'SUP-INACT-014',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
    {
      id: SEED_DATA.SUPPLIERS.INACTIVE_SUPP_5,
      name: 'Silent Supplies',
      taxNumber: 'SUP-INACT-015',
      status: 'inactive' as const,
      organizationId: SEED_DATA.ORGANIZATION_ID,
      createdBy: SEED_DATA.USER_ID,
      updatedBy: SEED_DATA.USER_ID,
    },
  ];

  for (const item of supplierItems) {
    const [supplier] = await db
      .insert(suppliers)
      .values(item)
      .onConflictDoUpdate({
        target: [suppliers.id],
        set: {
          name: item.name,
          status: item.status,
          updatedAt: new Date(),
        },
      })
      .returning();

    console.log(`   - Supplier '${supplier!.name}' synced.`);

    // Check if it already has a primary contact
    const existingContact = await db.query.supplierContacts.findFirst({
      where: (sc, { and, eq }) => and(eq(sc.supplierId, supplier!.id), eq(sc.isPrimary, true)),
    });

    if (!existingContact) {
      // Create a primary contact for this supplier
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const [newContact] = await db
        .insert(contacts)
        .values({
          organizationId: item.organizationId,
          firstName,
          lastName,
          email: faker.internet.email({ firstName, lastName }),
          phone: faker.phone.number(),
          jobTitle: faker.person.jobTitle(),
          createdBy: item.createdBy,
          updatedBy: item.updatedBy,
        })
        .returning();

      await db.insert(supplierContacts).values({
        organizationId: item.organizationId,
        supplierId: supplier!.id,
        contactId: newContact!.id,
        isPrimary: true,
        createdBy: item.createdBy,
        updatedBy: item.updatedBy,
      });
      console.log(`     * Contact '${firstName} ${lastName}' linked.`);
    }
  }
}
