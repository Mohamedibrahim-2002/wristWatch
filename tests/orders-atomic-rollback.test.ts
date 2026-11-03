import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { store } from '../server/data/store.js';

describe('SWEBOK v4 Ch. 04: Two-Phase Commitment & Atomic Rollback', () => {
  const app = createApp();

  beforeEach(() => {
    store.reset();
  });

  it('should successfully place order and decrement inventory atomically', async () => {
    const watchBefore = store.getWatchById('ww-sub-01')!;
    const initialStock = watchBefore.stockQuantity;

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
        items: [{ watchId: 'ww-sub-01', isCustom: false, quantity: 2 }],
        paymentToken: 'tok_visa_valid',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.orderStatus).toBe('processing');
    expect(res.body.data.pricing.finalTotalInCents).toBeGreaterThan(0);

    const watchAfter = store.getWatchById('ww-sub-01')!;
    expect(watchAfter.stockQuantity).toBe(initialStock - 2);
  });

  it('should safely rollback inventory if payment gateway declines the charge', async () => {
    const watchBefore = store.getWatchById('ww-sub-01')!;
    const initialStock = watchBefore.stockQuantity;

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
        items: [{ watchId: 'ww-sub-01', isCustom: false, quantity: 2 }],
        paymentToken: 'tok_declined', // Trigger simulated decline
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('declined');

    // SWEBOK v4 Ch. 04: Inventory must be rolled back to original baseline
    const watchAfter = store.getWatchById('ww-sub-01')!;
    expect(watchAfter.stockQuantity).toBe(initialStock);
  });

  it('should reject order if requested quantity exceeds available stock', async () => {
    const watch = store.getWatchById('ww-trb-04')!; // Only 4 units available
    const requested = watch.stockQuantity + 5;

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
        items: [{ watchId: 'ww-trb-04', isCustom: false, quantity: requested }],
        paymentToken: 'tok_visa_valid',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toContain('Insufficient inventory');
  });

  it('should enforce server-side pricing regardless of client assumptions', async () => {
    // When placing an order, client payload does NOT even accept a price field
    // Server recomputes price from catalog
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
        paymentToken: 'tok_visa_valid',
      });

    expect(res.status).toBe(201);
    const order = res.body.data;
    // Canonical price of ww-sub-01 is 145000 cents ($1,450.00)
    expect(order.pricing.baseTotalInCents).toBe(145000);
    expect(order.pricing.finalTotalInCents).toBe(159100); // 145000 + 8% tax (11600) + 2500 shipping
  });
});

