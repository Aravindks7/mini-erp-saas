import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { auth } from '../auth/auth.js';
import { db } from '../../db/index.js';
import {
  organizations,
  organizationInvites,
  organizationMemberships,
} from '../../db/schema/index.js';

// --- MOCKS ---

vi.mock('../auth/auth.js', () => ({
  auth: {
    api: {
      getSession: vi.fn(),
    },
    handler: vi.fn(),
  },
}));

const mockResult = {
  returning: vi.fn().mockResolvedValue([{ id: 'mock-id', name: 'Test Org', slug: 'test-org' }]),
  where: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
};

vi.mock('../../db/index.js', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      const tx = {
        insert: vi.fn(() => mockResult),
        update: vi.fn(() => mockResult),
        query: {
          organizationInvites: {
            findMany: vi.fn().mockResolvedValue([]),
          },
          organizations: {
            findFirst: vi.fn().mockResolvedValue(null),
          },
        },
      };
      return await cb(tx);
    }),
    query: {
      organizations: {
        findFirst: vi.fn(),
      },
      organizationMemberships: {
        findFirst: vi.fn(),
        findMany: vi.fn(),
      },
      organizationInvites: {
        findMany: vi.fn(),
      },
      user: {
        findFirst: vi.fn(),
      },
    },
    insert: vi.fn(() => ({
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'new-id' }]),
    })),
    update: vi.fn(() => ({
      set: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'updated-id' }]),
    })),
  },
}));

// --- TESTS ---

describe('Organizations Module Integration', () => {
  const mockUserId = 'user-123';
  const mockOrgId = 'org-456';
  const mockUserEmail = 'newuser@example.com';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /organizations', () => {
    it('should return 401 if unauthorized', async () => {
      (auth.api.getSession as any).mockResolvedValue(null);

      const response = await request(app)
        .post('/organizations')
        .send({ name: 'New Org', slug: 'new-org' });

      expect(response.status).toBe(401);
    });

    it('should create an organization and return 201', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });

      const response = await request(app)
        .post('/organizations')
        .send({ name: 'New Org', slug: 'new-org' });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe('Test Org'); // from our mock
      expect(db.transaction).toHaveBeenCalled();
    });
  });

  describe('GET /organizations', () => {
    it('should list user organizations', async () => {
      (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
      (db.query.organizationMemberships.findMany as any).mockResolvedValue([
        {
          role: 'admin',
          organization: { id: mockOrgId, name: 'My Org' },
        },
      ]);

      const response = await request(app).get('/organizations');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].role).toBe('admin');
    });
  });

  describe('Invitations & Memberships (Migrated)', () => {
    describe('POST /organizations/:organizationId/invites', () => {
      it('should return 403 if requester is not an admin', async () => {
        (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
        (db.query.organizationMemberships.findFirst as any).mockResolvedValue(null);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .send({ userEmail: mockUserEmail });

        expect(response.status).toBe(403);
      });

      it('should create an invitation if user does not exist', async () => {
        (auth.api.getSession as any).mockResolvedValue({ user: { id: mockUserId } });
        (db.query.organizationMemberships.findFirst as any).mockResolvedValue({
          role: 'admin',
          organizationId: mockOrgId,
        });
        (db.query.user.findFirst as any).mockResolvedValue(null);

        const response = await request(app)
          .post(`/organizations/${mockOrgId}/invites`)
          .send({ userEmail: mockUserEmail, role: 'employee' });

        expect(response.status).toBe(201);
        expect(db.insert).toHaveBeenCalledWith(organizationInvites);
      });
    });

    describe('Auth Hook: processPendingInvites', () => {
      it('should process pending invites for a registered email', async () => {
        const { organizationsService } = await import('./organizations.service.js');
        const mockInvite = {
          id: 'invite-1',
          organizationId: 'org-1',
          role: 'admin',
          email: mockUserEmail,
        };

        const mockFindMany = vi.fn().mockResolvedValue([mockInvite]);
        (db.transaction as any).mockImplementationOnce(async (cb: any) => {
          return await cb({
            insert: vi.fn(() => ({
              values: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'id' }]),
            })),
            update: vi.fn(() => ({
              set: vi.fn().mockReturnThis(),
              where: vi.fn().mockReturnThis(),
              returning: vi.fn().mockResolvedValue([{ id: 'id' }]),
            })),
            query: { organizationInvites: { findMany: mockFindMany } },
          });
        });

        await organizationsService.processPendingInvites(mockUserEmail, 'new-user-id');
        expect(mockFindMany).toHaveBeenCalled();
      });
    });
  });
});
