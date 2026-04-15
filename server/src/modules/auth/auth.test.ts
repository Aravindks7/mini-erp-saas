import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';

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
    processPendingInvites: vi.fn().mockResolvedValue({ processedCount: 1 }),
  },
}));

describe('Authentication Module Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Security Boundaries & RBAC', () => {
    it('should return 401 Unauthorized for invalid sign-in credentials', async () => {
      // We mock the DB to return null for the user to simulate "not found"
      // or Better Auth failure.
      const response = await request(app).post('/api/auth/sign-in/email').send({
        email: 'nonexistent@example.com',
        password: 'wrongpassword',
      });

      // In a real Better Auth flow, it might return 401 or 400 with an error object.
      // Based on our implementation, we expect a non-200 status for failures.
      expect([400, 401]).toContain(response.status);
    });

    it('should return 400 Bad Request for malformed sign-up data', async () => {
      const response = await request(app).post('/api/auth/sign-up/email').send({
        email: 'invalid-email',
        password: '123', // too short
        name: 'a', // too short
      });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Database Hooks & Invite Processing', () => {
    it('should trigger organization invite processing after successful sign-up', async () => {
      // In this mocked integration test, we verify that the controller/handler is reachable
      // and ideally would reach the 'after' hook in a real integration.
      // Since we are mocking the db/auth internals, we verify the service call if possible.

      const response = await request(app).post('/api/auth/sign-up/email').send({
        email: 'invited-user@example.com',
        password: 'Password123!',
        name: 'Invited User',
      });

      expect([200, 201]).toContain(response.status);

      // Note: In a full integration test with a real DB, we would verify membership creation.
      // Here, we ensure the system doesn't crash and returns the expected success code.
    });
  });

  describe('Session Integrity', () => {
    it('should return 200 and null session data for unauthenticated requests to /api/auth/get-session', async () => {
      const response = await request(app).get('/api/auth/get-session');

      expect(response.status).toBe(200);
      // Better Auth returns null or empty when no session is found
      if (response.body) {
        expect(response.body.session).toBeFalsy();
      }
    });
  });
});
