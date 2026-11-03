/**
 * IEEE SWEBOK v4 Chapter 13 (Software Security) & Chapter 14 (Professional Practice & Privacy)
 * Authentication, RBAC (Role-Based Access Control), and GDPR Privacy Service.
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../../shared/types.js';
import { store } from '../data/store.js';

const JWT_SECRET = process.env.JWT_SECRET || 'swebok_v4_wrist_watch_super_secret_jwt_2026';
const JWT_EXPIRES_IN = '24h';

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export class AuthService {
  /**
   * Register a new customer with salted bcrypt password.
   */
  public async register(email: string, fullName: string, password: string):Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const existing = store.getUserByEmail(email);
    if (existing) {
      throw new Error('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser: User = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      email: email.toLowerCase().trim(),
      fullName: fullName.trim(),
      role: 'customer',
      passwordHash,
      createdAt: new Date().toISOString(),
      consentSettings: {
        necessaryCookies: true,
        analyticsCookies: false,
        marketingCookies: false,
        consentedAt: new Date().toISOString(),
      },
    };

    store.createUser(newUser);

    const token = this.generateToken(newUser);
    const { passwordHash: _, ...safeUser } = newUser;

    return { user: safeUser, token };
  }

  /**
   * Authenticate user credentials.
   */
  public async login(email: string, password: string): Promise<{ user: Omit<User, 'passwordHash'>; token: string }> {
    const user = store.getUserByEmail(email);
    if (!user || !user.passwordHash) {
      // Prevent timing attacks by computing a dummy hash if user doesn't exist
      await bcrypt.compare(password, '$2a$10$dummyhashforconstanttimingdefense00000000000000000000000');
      throw new Error('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new Error('Invalid email or password');
    }

    user.lastLoginAt = new Date().toISOString();
    const token = this.generateToken(user);
    const { passwordHash: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  /**
   * Issue signed JWT.
   */
  public generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };

    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  }

  /**
   * Verify token payload.
   */
  public verifyToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
      throw new Error('Invalid or expired authentication token');
    }
  }

  /**
   * GDPR Data Portability (Article 20): Export complete customer profile and order logs.
   */
  public exportUserData(userId: string) {
    const user = store.getUserById(userId);
    if (!user) throw new Error('User not found');

    const orders = store.getOrdersByUserId(userId);
    const { passwordHash: _, ...safeProfile } = user;

    return {
      exportTimestamp: new Date().toISOString(),
      complianceStandard: 'GDPR Article 20 / CCPA Portability',
      profile: safeProfile,
      orders,
    };
  }

  /**
   * GDPR Right to Erasure (Article 17): Anonymize customer data.
   */
  public deleteUserData(userId: string): boolean {
    const user = store.getUserById(userId);
    if (!user) return false;

    // Prevent deleting admin
    if (user.role === 'admin') {
      throw new Error('Administrative accounts cannot be deleted through self-service');
    }

    return store.deleteUser(userId);
  }
}

export const authService = new AuthService();

