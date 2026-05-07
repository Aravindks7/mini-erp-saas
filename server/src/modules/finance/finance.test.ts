import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';

vi.mock('../rbac/rbac.service.js', () => ({
  rbacService: {
    getPermissions: vi
      .fn()
      .mockResolvedValue(['finance:read', 'finance:create', 'finance:update', 'finance:delete']),
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

const mockTx = {
  query: {
    accounts: {
      findFirst: vi.fn(),
    },
    journalEntries: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    })),
  })),
  update: vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
      })),
    })),
  })),
};

vi.mock('../../db/index.js', () => ({
  db: {
    query: {
      organizationMemberships: {
        findFirst: vi.fn(),
      },
      accounts: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null as any),
      },
      journalEntries: {
        findMany: vi.fn().mockResolvedValue([]),
        findFirst: vi.fn().mockResolvedValue(null as any),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
        })),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn().mockResolvedValue([{ totalDebit: '100', totalCredit: '100' }]),
      })),
    })),
    transaction: vi.fn((cb) => cb(mockTx)),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe('Finance Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth.api.getSession).mockResolvedValue({ user: { id: mockUserId } } as any);
    vi.mocked(db.query.organizationMemberships.findFirst).mockResolvedValue({
      role: 'admin',
      organization: { id: mockOrgId },
    } as any);
  });

  describe('Chart of Accounts', () => {
    it('should create a new account', async () => {
      const payload = {
        code: '1000',
        name: 'Petty Cash',
        type: 'asset',
      };

      const response = await request(app)
        .post('/finance/accounts')
        .send(payload)
        .set('x-organization-id', mockOrgId);

      expect(response.status, JSON.stringify(response.body)).toBe(201);
      expect(response.body.id).toBe('new-id');
    });

    it('should list accounts', async () => {
      vi.mocked(db.query.accounts.findMany).mockResolvedValue([
        { id: 'acc-1', code: '1000', name: 'Cash' },
      ] as any);

      const response = await request(app)
        .get('/finance/accounts')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
    });

    it('should get a single account', async () => {
      const mockAccount = { id: 'acc-1', code: '1000', name: 'Cash' };
      vi.mocked(db.query.accounts.findFirst).mockResolvedValue(mockAccount as any);

      const response = await request(app)
        .get('/finance/accounts/acc-1')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe('acc-1');
      expect(response.body.name).toBe('Cash');
    });

    it('should return 404 if account not found', async () => {
      vi.mocked(db.query.accounts.findFirst).mockResolvedValue(null as any);

      const response = await request(app)
        .get('/finance/accounts/non-existent')
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(404);
    });
  });

  describe('Journal Entries', () => {
    it('should create a balanced journal entry', async () => {
      const payload = {
        date: '2024-05-01',
        description: 'Office Supplies',
        lines: [
          { accountId: 'c0a80101-0000-4000-a000-000000000001', debit: 50, credit: 0 },
          { accountId: 'c0a80101-0000-4000-a000-000000000002', debit: 0, credit: 50 },
        ],
      };

      vi.mocked(mockTx.query.journalEntries.findFirst).mockResolvedValue({
        id: 'je-1',
        ...payload,
        lines: payload.lines,
      } as any);

      const response = await request(app)
        .post('/finance/journal-entries')
        .send(payload)
        .set('x-organization-id', mockOrgId);

      expect(response.status, JSON.stringify(response.body)).toBe(201);
      expect(response.body.id).toBe('je-1');
    });

    it('should reject an unbalanced journal entry', async () => {
      const payload = {
        date: '2024-05-01',
        description: 'Unbalanced Entry',
        lines: [
          { accountId: 'c0a80101-0000-4000-a000-000000000001', debit: 100, credit: 0 },
          { accountId: 'c0a80101-0000-4000-a000-000000000002', debit: 0, credit: 50 },
        ],
      };

      const response = await request(app)
        .post('/finance/journal-entries')
        .send(payload)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
      expect(JSON.stringify(response.body.error)).toContain('balanced');
    });

    it('should reject a journal entry with less than 2 lines', async () => {
      const payload = {
        date: '2024-05-01',
        description: 'Single Line',
        lines: [{ accountId: 'c0a80101-0000-4000-a000-000000000001', debit: 100, credit: 0 }],
      };

      const response = await request(app)
        .post('/finance/journal-entries')
        .send(payload)
        .set('x-organization-id', mockOrgId);

      expect(response.status).toBe(400);
    });
  });
});
