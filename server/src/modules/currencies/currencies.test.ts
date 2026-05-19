import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import { rbacService } from '../rbac/rbac.service.js';
import { SEED_DATA } from '../../db/seeds/constants.js';

// --- MOCKS ---

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue([
        'currencies:read',
        'currencies:create',
        'currencies:update',
        'currencies:delete',
      ]),
    invalidateCache: vi.fn().mockResolvedValue(undefined),
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

const mockReturning = vi.fn().mockResolvedValue([{ id: 'new-id', code: 'USD' }]);
const mockWhere = vi.fn().mockReturnValue({ returning: mockReturning });
const mockSet = vi.fn().mockReturnValue({ where: mockWhere, returning: mockReturning });

const mockTx = {
  query: {
    currencies: {
      findFirst: vi.fn().mockResolvedValue({ id: 'curr-123', code: 'USD', name: 'US Dollar' }),
      findMany: vi.fn().mockResolvedValue([{ id: 'curr-123', code: 'USD', name: 'US Dollar' }]),
    },
  },
  insert: vi.fn(() => ({
    values: vi.fn().mockReturnValue({
      returning: mockReturning,
    }),
  })),
  update: vi.fn(() => ({
    set: mockSet,
  })),
  delete: vi.fn(() => ({
    where: mockWhere,
  })),
  execute: vi.fn().mockResolvedValue({}),
};

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn().mockResolvedValue({ id: 'mem-123' }),
      },
      currencies: {
        findMany: vi.fn().mockResolvedValue([{ id: 'curr-123', code: 'USD', name: 'US Dollar' }]),
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnValue({
        returning: mockReturning,
      }),
    })),
    update: vi.fn(() => ({
      set: mockSet,
    })),
    transaction: vi.fn((cb) => cb(mockTx)),
    execute: vi.fn().mockResolvedValue({}),
  },
}));

// --- TESTS ---

describe('Currencies API', () => {
  const orgId = SEED_DATA.ORGANIZATION_ID;

  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock setup for successful requests
    vi.mocked(db.query.currencies.findMany).mockResolvedValue([
      { id: 'curr-123', code: 'USD' },
    ] as any);
  });

  describe('GET /currencies', () => {
    it('should list currencies for the organization', async () => {
      const res = await request(app)
        .get('/currencies')
        .set('x-organization-id', orgId)
        .set('x-dev-bypass', 'true');

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /currencies', () => {
    it('should create a new currency', async () => {
      const randomCode = `C${Math.floor(Math.random() * 89 + 10)}`;
      const newCurrency = {
        code: randomCode,
        symbol: '¥',
        name: 'Japanese Yen',
        isActive: true,
        isDefault: false,
      };

      vi.mocked(mockReturning).mockResolvedValueOnce([{ id: 'new-id', code: randomCode }]);
      vi.mocked(mockTx.query.currencies.findFirst).mockResolvedValueOnce({
        id: 'new-id',
        code: randomCode,
      });

      const res = await request(app)
        .post('/currencies')
        .set('x-organization-id', orgId)
        .set('x-dev-bypass', 'true')
        .send(newCurrency);

      expect(res.status).toBe(201);
      expect(res.body.code).toBe(randomCode);
    });

    it('should fail if currency code already exists', async () => {
      const duplicate = {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
      };

      // Mock duplicate check returning an existing currency
      vi.mocked(db.query.currencies.findFirst).mockResolvedValueOnce({ id: 'existing' } as any);

      const res = await request(app)
        .post('/currencies')
        .set('x-organization-id', orgId)
        .set('x-dev-bypass', 'true')
        .send(duplicate);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('already exists');
    });
  });

  describe('PATCH /currencies/:id', () => {
    it('should update an existing currency', async () => {
      const currencyId = 'curr-123';

      vi.mocked(db.query.currencies.findMany).mockResolvedValueOnce([{ id: currencyId }] as any);
      vi.mocked(mockTx.query.currencies.findFirst).mockResolvedValueOnce({
        id: currencyId,
        code: 'USD',
      } as any);
      vi.mocked(mockReturning).mockResolvedValueOnce([
        { id: currencyId, name: 'Updated Currency Name' },
      ]);
      vi.mocked(mockTx.query.currencies.findFirst).mockResolvedValueOnce({
        id: currencyId,
        name: 'Updated Currency Name',
      } as any);

      const res = await request(app)
        .patch(`/currencies/${currencyId}`)
        .set('x-organization-id', orgId)
        .set('x-dev-bypass', 'true')
        .send({ name: 'Updated Currency Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Currency Name');
    });
  });
});
