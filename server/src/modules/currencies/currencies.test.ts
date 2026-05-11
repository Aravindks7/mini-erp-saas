import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from '../../app.js';
import { SEED_DATA } from '../../db/seeds/constants.js';

describe('Currencies API', () => {
  const orgId = SEED_DATA.ORGANIZATION_ID;

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
      const randomCode = `C${Math.floor(Math.random() * 89 + 10)}`; // Ensures 3 characters (e.g., C12)
      const newCurrency = {
        code: randomCode,

        symbol: '¥',
        name: 'Japanese Yen',
        isActive: true,
        isDefault: false,
      };

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
        code: 'USD', // Assuming USD is seeded
        symbol: '$',
        name: 'US Dollar',
      };

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
      // Ensure at least one exists
      await request(app)
        .post('/currencies')
        .set('x-organization-id', orgId)
        .set('x-dev-bypass', 'true')
        .send({
          code: 'EUR',
          symbol: '€',
          name: 'Euro',
        });

      // First find a currency to update
      const listRes = await request(app)
        .get('/currencies')
        .set('x-organization-id', orgId)
        .set('x-dev-bypass', 'true');

      const currencyId = listRes.body[0].id;

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
