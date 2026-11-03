import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { authService } from '../server/services/authService.js';
import { store } from '../server/data/store.js';

describe('SWEBOK v4 Ch. 13: Software Security & RBAC Enforcement', () => {
  const app = createApp();
  let adminToken: string;
  let customerToken: string;

  beforeAll(async () => {
    store.reset();
    const adminLogin = await authService.login('admin@wristwatch.luxury', 'AdminPass123!');
    adminToken = adminLogin.token;

    const customerLogin = await authService.login('collector@wristwatch.luxury', 'CustomerPass123!');
    customerToken = customerLogin.token;
  });

  it('should reject unauthenticated access to admin inventory with 401 Unauthorized', async () => {
    const res = await request(app).get('/api/admin/inventory');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('should reject customer access to admin inventory with 403 Forbidden (Principle of Least Privilege)', async () => {
    const res = await request(app)
      .get('/api/admin/inventory')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });

  it('should grant admin access to inventory with 200 OK', async () => {
    const res = await request(app)
      .get('/api/admin/inventory')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items.length).toBeGreaterThan(0);
    expect(res.body.data.metrics.totalStockUnits).toBeGreaterThan(0);
  });

  it('should reject user registration with weak password (missing requirements)', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'attacker@example.com',
        fullName: 'Hacker',
        password: 'weak', // too short, no uppercase or digit
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject checkout requests with non-tokenized raw card numbers (PCI-DSS compliance)', async () => {
    const res = await request(app)
      .post('/api/orders/checkout')
      .send({
        customerEmail: 'collector@wristwatch.luxury',
        customerName: 'Alexander Vance',
        shippingAddress: {
          fullName: 'Alexander Vance',
          streetAddress: '123 Horology Lane',
          city: 'Geneva',
          stateOrProvince: 'GE',
          postalCode: '1201',
          country: 'Switzerland',
          phoneNumber: '+41225550199',
        },
        items: [{ watchId: 'ww-sub-01', isCustom: false, quantity: 1 }],
        paymentToken: '4111111111111111', // Raw PAN card number rejected! Must be 'tok_...'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject engraving strings with potential XSS or script injection payloads', async () => {
    const res = await request(app)
      .post('/api/catalog/customizer/price')
      .send({
        baseWatchId: 'ww-sub-01',
        customConfig: {
          baseWatchId: 'ww-sub-01',
          caseMaterial: 'Stainless Steel',
          caseDiameterMm: 40,
          bezel: 'Smooth Polished',
          dialColor: 'Midnight Obsidian',
          hands: 'Dauphine',
          strap: 'Horween Calfskin',
          movement: 'Automatic',
          engraving: '<script>alert(1)</script>', // Not allowed by allowlist regex
        },
        quantity: 1,
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

