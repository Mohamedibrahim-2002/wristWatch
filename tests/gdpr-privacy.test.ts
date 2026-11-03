import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import { authService } from '../server/services/authService.js';
import { store } from '../server/data/store.js';

describe('SWEBOK v4 Ch. 14: Data Privacy & GDPR/CCPA Compliance', () => {
  const app = createApp();
  let customerToken: string;
  let customerUserId: string;

  beforeAll(async () => {
    store.reset();
    const login = await authService.login('collector@wristwatch.luxury', 'CustomerPass123!');
    customerToken = login.token;
    customerUserId = login.user.id;
  });

  it('should allow customer to update cookie privacy preferences', async () => {
    const res = await request(app)
      .post('/api/auth/gdpr/consent')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        necessaryCookies: true,
        analyticsCookies: true,
        marketingCookies: false,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const user = store.getUserById(customerUserId);
    expect(user?.consentSettings?.analyticsCookies).toBe(true);
    expect(user?.consentSettings?.marketingCookies).toBe(false);
  });

  it('should export complete customer profile and order history (GDPR Art. 20)', async () => {
    const res = await request(app)
      .get('/api/auth/gdpr/export')
      .set('Authorization', `Bearer ${customerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.complianceStandard).toContain('GDPR Article 20');
    expect(res.body.profile.email).toBe('collector@wristwatch.luxury');
    expect(res.body.profile.passwordHash).toBeUndefined(); // Never leak hashes in export
  });

  it('should allow customer to erase their account (GDPR Art. 17 Right to be Forgotten)', async () => {
    // Register temporary user to test erasure
    const temp = await authService.register('temp_user@luxury.com', 'Temporary User', 'TempPass123!');

    const res = await request(app)
      .delete('/api/auth/gdpr/delete')
      .set('Authorization', `Bearer ${temp.token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(store.getUserById(temp.user.id)).toBeUndefined();
  });
});
