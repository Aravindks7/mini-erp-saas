import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { db } from '../../db/index.js';
import { rbacService } from '../rbac/rbac.service.js';
import { auth } from '../auth/auth.js';
import { PERMISSIONS } from '#shared/contracts/rbac.contract.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi.fn(),
  },
}));

vi.mock('../auth/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      products: {
        findMany: vi.fn(),
        findFirst: vi.fn(),
      },
      unitOfMeasures: {
        findFirst: vi.fn(),
      },
      taxes: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([]),
      }),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      }),
    })),
    transaction: vi.fn((cb) => cb(db)),
    execute: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../db/setTenant.js', () => ({
  setTenant: vi.fn().mockResolvedValue(undefined),
}));

describe('Products Module', () => {
  const mockOrgId = '123e4567-e89b-42d3-a456-426614174001';
  const mockUserId = '123e4567-e89b-42d3-a456-426614174002';
  const mockUomId = '123e4567-e89b-42d3-a456-426614174003';
  const mockTaxId = '123e4567-e89b-42d3-a456-426614174004';
  const mockProductId = '123e4567-e89b-42d3-a456-426614174005';

  beforeEach(() => {
    vi.clearAllMocks();

    // Default Auth/RBAC Mocks
    (auth.api.getSession as any).mockResolvedValue({
      user: { id: mockUserId },
      session: { token: 'mock-token' },
    });

    (rbacService.getPermissions as any).mockResolvedValue([
      PERMISSIONS.PRODUCTS.READ,
      PERMISSIONS.PRODUCTS.CREATE,
      PERMISSIONS.PRODUCTS.UPDATE,
      PERMISSIONS.PRODUCTS.DELETE,
    ]);

    (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
      organizationId: mockOrgId,
      userId: mockUserId,
      organization: { id: mockOrgId },
    });
  });

  describe('POST /products', () => {
    const validProduct = {
      sku: 'PROD-001',
      name: 'Test Product',
      basePrice: '100.00',
      baseUomId: mockUomId,
      taxId: mockTaxId,
    };

    it('should create a product successfully', async () => {
      // Mock Duplicate Check
      (db.query.products.findFirst as any).mockResolvedValueOnce(null);
      // Mock UoM Validation
      (db.query.unitOfMeasures.findFirst as any).mockResolvedValueOnce({
        id: mockUomId,
        organizationId: mockOrgId,
      });
      // Mock Tax Validation
      (db.query.taxes.findFirst as any).mockResolvedValueOnce({
        id: mockTaxId,
        organizationId: mockOrgId,
      });
      // Mock Insert
      const mockInserted = { ...validProduct, id: mockProductId, organizationId: mockOrgId };

      const mockRet = vi.fn().mockResolvedValueOnce([mockInserted]);
      const mockVal = vi.fn().mockReturnValue({ returning: mockRet });
      (db.insert as any).mockReturnValue({ values: mockVal });

      // Mock Final Fetch
      (db.query.products.findFirst as any).mockResolvedValueOnce(mockInserted);

      const res = await request(app)
        .post('/products')
        .set('x-organization-id', mockOrgId)
        .send(validProduct);

      expect(res.status).toBe(201);
      expect(res.body.sku).toBe('PROD-001');
    });

    it('should fail if SKU already exists', async () => {
      (db.query.products.findFirst as any).mockResolvedValueOnce({ id: 'existing-id' });

      const res = await request(app)
        .post('/products')
        .set('x-organization-id', mockOrgId)
        .send(validProduct);

      expect(res.status).toBe(409);
      expect(res.body.error).toContain('already exists');
    });

    it('should fail if UoM does not belong to organization', async () => {
      (db.query.products.findFirst as any).mockResolvedValueOnce(null);
      (db.query.unitOfMeasures.findFirst as any).mockResolvedValueOnce(null); // Not found for this org

      const res = await request(app)
        .post('/products')
        .set('x-organization-id', mockOrgId)
        .send(validProduct);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid Base UoM ID');
    });

    it('should fail if Tax does not belong to organization', async () => {
      (db.query.products.findFirst as any).mockResolvedValueOnce(null);
      (db.query.unitOfMeasures.findFirst as any).mockResolvedValueOnce({
        id: mockUomId,
        organizationId: mockOrgId,
      });
      (db.query.taxes.findFirst as any).mockResolvedValueOnce(null); // Not found for this org

      const res = await request(app)
        .post('/products')
        .set('x-organization-id', mockOrgId)
        .send(validProduct);

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid Tax ID');
    });
  });

  describe('GET /products', () => {
    it('should list products', async () => {
      const mockList = [
        { id: '1', sku: 'P1' },
        { id: '2', sku: 'P2' },
      ];
      (db.query.products.findMany as any).mockResolvedValueOnce(mockList);

      const res = await request(app).get('/products').set('x-organization-id', mockOrgId);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
    });
  });

  describe('PATCH /products/:id', () => {
    it('should update a product', async () => {
      const existingProduct = {
        id: mockProductId,
        sku: 'OLD-SKU',
        baseUomId: mockUomId,
        taxId: mockTaxId,
      };
      (db.query.products.findFirst as any).mockResolvedValueOnce(existingProduct); // For existence check

      // SKU change validation (mock no duplicate)
      (db.query.products.findFirst as any).mockResolvedValueOnce(null);

      // Reference validation
      (db.query.unitOfMeasures.findFirst as any).mockResolvedValueOnce({
        id: mockUomId,
        organizationId: mockOrgId,
      });
      (db.query.taxes.findFirst as any).mockResolvedValueOnce({
        id: mockTaxId,
        organizationId: mockOrgId,
      });

      const updatedProduct = { ...existingProduct, sku: 'NEW-SKU' };

      const mockRet = vi.fn().mockResolvedValueOnce([updatedProduct]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockRet });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      (db.query.products.findFirst as any).mockResolvedValueOnce(updatedProduct);

      const res = await request(app)
        .patch(`/products/${mockProductId}`)
        .set('x-organization-id', mockOrgId)
        .send({ sku: 'NEW-SKU' });

      expect(res.status).toBe(200);
      expect(res.body.sku).toBe('NEW-SKU');
    });
  });

  describe('DELETE /products/:id', () => {
    it('should soft delete a product', async () => {
      const mockRet = vi.fn().mockResolvedValueOnce([{ id: mockProductId }]);
      const mockWhere = vi.fn().mockReturnValue({ returning: mockRet });
      const mockSet = vi.fn().mockReturnValue({ where: mockWhere });
      (db.update as any).mockReturnValue({ set: mockSet });

      const res = await request(app)
        .delete(`/products/${mockProductId}`)
        .set('x-organization-id', mockOrgId);

      expect(res.status).toBe(204);
    });
  });
});
