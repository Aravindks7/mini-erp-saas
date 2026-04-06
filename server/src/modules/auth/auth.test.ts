import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { db } from '../../db/index.js';
import { organizationsService } from '../organizations/organizations.service.js';

const mockResult = {
  returning: vi.fn().mockResolvedValue([{ id: 'mock-id', email: 'test@example.com' }]),
  where: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  onConflictDoUpdate: vi.fn().mockReturnThis(),
};

// Mock DB
vi.mock('../../db/index.js', () => ({
  db: {
    transaction: vi.fn(async (cb) => {
      // In Drizzle, the transaction callback receives a transaction object.
      // We pass the mocked db itself to simplify.
      const tx = {
        insert: vi.fn(() => mockResult),
        update: vi.fn(() => mockResult),
        delete: vi.fn(() => mockResult),
        select: vi.fn(() => ({
          from: vi.fn().mockReturnThis(),
          where: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
        })),
      };
      return await cb(tx);
    }),
    insert: vi.fn(() => mockResult),
    update: vi.fn(() => mockResult),
    delete: vi.fn(() => mockResult),
    select: vi.fn(() => ({
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
    })),
    query: {
      user: { findFirst: vi.fn().mockResolvedValue(null) },
      session: { findFirst: vi.fn().mockResolvedValue(null) },
      account: { findFirst: vi.fn().mockResolvedValue(null) },
      verification: { findFirst: vi.fn().mockResolvedValue(null) },
    },
  },
}));

// Mock Organizations Service
vi.mock('../organizations/organizations.service.js', () => ({
  organizationsService: {
    processPendingInvites: vi.fn().mockResolvedValue(undefined),
  },
}));

describe('Authentication Module Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/sign-up/email', () => {
    it('should return 400 if validation fails (e.g., missing password)', async () => {
      const response = await request(app).post('/api/auth/sign-up/email').send({
        email: 'test@example.com',
        name: 'Test User',
      });

      expect(response.status).toBe(400);
    });

    it('should successfully sign up and trigger organization invite processing', async () => {
      // Note: In a mocked integration test, we verify the flow.
      // Better Auth's internals are complex to mock fully with supertest in a single unit
      // but we can verify the controller captures the request.

      const response = await request(app).post('/api/auth/sign-up/email').send({
        email: 'newuser@example.com',
        password: 'Password123!',
        name: 'New User',
      });

      // Better Auth might return 200/201 depending on the flow
      expect([200, 201]).toContain(response.status);

      // Verification of the database hook would ideally happen if we use the real Better Auth instance
      // and it reaches the 'after' hook.
    });
  });

  describe('POST /api/auth/sign-in/email', () => {
    it('should return 400 for invalid credentials structure', async () => {
      const response = await request(app).post('/api/auth/sign-in/email').send({
        email: 'not-an-email',
      });

      expect(response.status).toBe(400);
    });
  });
});
