# Backend Module Implementation Plan (Bottom-Up)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the backend for UoM, Taxes, Suppliers, and Products modules by mirroring the `Customers` module architectural patterns.

**Architecture:** Bottom-up dependency resolution. Foundational reference data (UoM, Taxes) -> Independent entities (Suppliers) -> Dependent entities (Products).

**Tech Stack:** Node.js, Express, Drizzle ORM, Zod, Vitest.

---

### Task 1: Units of Measure (UoM) Backend

**Files:**

- Create: `shared/contracts/uom.contract.ts`
- Create: `server/src/modules/uom/uom.service.ts`
- Create: `server/src/modules/uom/uom.controller.ts`
- Create: `server/src/modules/uom/uom.routes.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/modules/uom/uom.test.ts`

- [ ] **Step 1: Create UoM Contract**
      Create `shared/contracts/uom.contract.ts` with Zod schemas for UoM and Product UoM Conversions.

```typescript
import { z } from 'zod';

export const createUomSchema = z.object({
  code: z.string().min(1, 'Code is required').max(20),
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().max(200).optional().nullable(),
  isDefault: z.boolean().default(false),
});

export const updateUomSchema = createUomSchema.partial();

export const bulkDeleteUomSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

export type CreateUomInput = z.infer<typeof createUomSchema>;
export type UpdateUomInput = z.infer<typeof updateUomSchema>;
```

- [ ] **Step 2: Create UoM Service**
      Implement `server/src/modules/uom/uom.service.ts` mirroring `CustomersService`.

```typescript
import { db } from '../../db/index.js';
import { unitOfMeasures } from '../../db/schema/uom.schema.js';
import { and, eq, inArray, sql } from 'drizzle-orm';
import { BaseService } from '../../lib/base.service.js';
import { CreateUomInput, UpdateUomInput } from '#shared/contracts/uom.contract.js';

export class UomService extends BaseService<typeof unitOfMeasures> {
  constructor() {
    super(unitOfMeasures);
  }

  async listUoms(organizationId: string) {
    return await db.query.unitOfMeasures.findMany({
      where: this.getTenantWhere(organizationId),
      orderBy: (uom, { asc }) => [asc(uom.name)],
    });
  }

  async getUomById(organizationId: string, id: string) {
    return await db.query.unitOfMeasures.findFirst({
      where: this.getTenantWhere(organizationId, id),
    });
  }

  async createUom(organizationId: string, userId: string, data: CreateUomInput) {
    const [newUom] = await db
      .insert(unitOfMeasures)
      .values(this.withAudit({ ...data, organizationId }, userId))
      .returning();
    return newUom;
  }

  async updateUom(organizationId: string, userId: string, id: string, data: UpdateUomInput) {
    const [updated] = await db
      .update(unitOfMeasures)
      .set(this.withAudit(data, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();
    return updated;
  }

  async deleteUom(organizationId: string, userId: string, id: string) {
    const [deleted] = await db
      .update(unitOfMeasures)
      .set(this.withAudit({ deletedAt: new Date() }, userId, true))
      .where(this.getTenantWhere(organizationId, id))
      .returning();
    return deleted;
  }
}

export const uomService = new UomService();
```

- [ ] **Step 3: Create UoM Controller**
      Implement `server/src/modules/uom/uom.controller.ts` mirroring `CustomersController`.

```typescript
import { Request, Response } from 'express';
import { uomService } from './uom.service.js';
import { createUomSchema, updateUomSchema } from '#shared/contracts/uom.contract.js';
import { logger } from '../../utils/logger.js';

export async function listUoms(req: Request, res: Response) {
  const organizationId = req.organizationId;
  try {
    const results = await uomService.listUoms(organizationId);
    res.json(results);
  } catch (error) {
    logger.error({ error, organizationId }, 'Failed to list UoMs');
    throw error;
  }
}

export async function createUom(req: Request, res: Response) {
  const parseResult = createUomSchema.safeParse(req.body);
  if (!parseResult.success) {
    return res.status(400).json({ error: parseResult.error.flatten() });
  }

  const organizationId = req.organizationId;
  const userId = req.authSession.user.id;

  try {
    const newUom = await uomService.createUom(organizationId, userId, parseResult.data);
    res.status(201).json(newUom);
  } catch (error) {
    logger.error({ error, organizationId, userId }, 'Failed to create UoM');
    throw error;
  }
}
// ... (implement getUom, updateUom, deleteUom similarly)
```

- [ ] **Step 4: Create UoM Routes**
      Implement `server/src/modules/uom/uom.routes.ts`.

- [ ] **Step 5: Register Routes in `server/src/app.ts`**
      Import and use `uomRoutes`.

- [ ] **Step 6: Write Integration Test**
      Create `server/src/modules/uom/uom.test.ts` mirroring `customers.test.ts`.

- [ ] **Step 7: Verify with `httpie`**
      Run a smoke test.

---

### Task 2: Taxes Backend

**Files:**

- Create: `shared/contracts/taxes.contract.ts`
- Create: `server/src/modules/taxes/taxes.service.ts`
- Create: `server/src/modules/taxes/taxes.controller.ts`
- Create: `server/src/modules/taxes/taxes.routes.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/modules/taxes/taxes.test.ts`

- [ ] **Step 1: Create Taxes Contract**
- [ ] **Step 2: Create Taxes Service**
- [ ] **Step 3: Create Taxes Controller**
- [ ] **Step 4: Create Taxes Routes**
- [ ] **Step 5: Register Routes in `server/src/app.ts`**
- [ ] **Step 6: Write Integration Test**
- [ ] **Step 7: Verify with `httpie`**

---

### Task 3: Suppliers Backend

**Files:**

- Create: `shared/contracts/suppliers.contract.ts`
- Create: `server/src/modules/suppliers/suppliers.service.ts`
- Create: `server/src/modules/suppliers/suppliers.controller.ts`
- Create: `server/src/modules/suppliers/suppliers.routes.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/modules/suppliers/suppliers.test.ts`

- [ ] **Step 1: Create Suppliers Contract** (Mirror `customers.contract.ts`)
- [ ] **Step 2: Create Suppliers Service** (Mirror `customers.service.ts` including address/contact handling)
- [ ] **Step 3: Create Suppliers Controller**
- [ ] **Step 4: Create Suppliers Routes**
- [ ] **Step 5: Register Routes in `server/src/app.ts`**
- [ ] **Step 6: Write Integration Test**
- [ ] **Step 7: Verify with `httpie`**

---

### Task 4: Products Backend

**Files:**

- Create: `shared/contracts/products.contract.ts`
- Create: `server/src/modules/products/products.service.ts`
- Create: `server/src/modules/products/products.controller.ts`
- Create: `server/src/modules/products/products.routes.ts`
- Modify: `server/src/app.ts`
- Test: `server/src/modules/products/products.test.ts`

- [ ] **Step 1: Create Products Contract** (Including relations to `uomId`, `taxId`)
- [ ] **Step 2: Create Products Service**
- [ ] **Step 3: Create Products Controller**
- [ ] **Step 4: Create Products Routes**
- [ ] **Step 5: Register Routes in `server/src/app.ts`**
- [ ] **Step 6: Write Integration Test** (Including relational verification)
- [ ] **Step 7: Verify with `httpie`**
