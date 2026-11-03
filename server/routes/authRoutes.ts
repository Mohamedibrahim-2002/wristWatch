/**
 * IEEE SWEBOK v4 Chapter 13 & 14 - Authentication & Privacy Endpoints
 */

import { Router } from 'express';
import { authService } from '../services/authService.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { RegisterUserSchema, LoginUserSchema, PrivacyConsentSchema } from '../../shared/schemas.js';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { store } from '../data/store.js';

const router = Router();

router.post('/register', validateBody(RegisterUserSchema), async (req, res, next) => {
  try {
    const { email, fullName, password } = req.body;
    const { user, token } = await authService.register(email, fullName, password);

    res.cookie('wrist_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      data: { user, token },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'REGISTRATION_FAILED', message: err.message },
    });
  }
});

router.post('/login', validateBody(LoginUserSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    res.cookie('wrist_auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { user, token },
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: any) {
    res.status(401).json({
      success: false,
      error: { code: 'INVALID_CREDENTIALS', message: err.message },
    });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('wrist_auth_token');
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = store.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } });
    return;
  }
  const { passwordHash: _, ...safeProfile } = user;
  res.json({ success: true, data: safeProfile });
});

// GDPR Article 20: Data Portability
router.get('/gdpr/export', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const exportData = authService.exportUserData(req.user!.userId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="gdpr-export-${req.user!.userId}.json"`);
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'EXPORT_FAILED', message: err.message } });
  }
});

// GDPR Article 17: Right to Erasure
router.delete('/gdpr/delete', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const success = authService.deleteUserData(req.user!.userId);
    if (!success) {
      res.status(400).json({ success: false, error: { code: 'DELETION_FAILED', message: 'Unable to erase account.' } });
      return;
    }
    res.clearCookie('wrist_auth_token');
    res.json({ success: true, message: 'Account and personal data erased in compliance with GDPR Art. 17.' });
  } catch (err: any) {
    res.status(400).json({ success: false, error: { code: 'DELETION_FAILED', message: err.message } });
  }
});

// GDPR Consent Update
router.post('/gdpr/consent', requireAuth, validateBody(PrivacyConsentSchema), (req: AuthenticatedRequest, res) => {
  store.updateUserConsent(req.user!.userId, {
    ...req.body,
    consentedAt: new Date().toISOString(),
  });
  res.json({ success: true, message: 'Consent preferences updated.' });
});

export default router;
