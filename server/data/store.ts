/**
 * IEEE SWEBOK v4 Chapter 02, 03 & 04 (Data Persistence & Defensive Construction)
 * In-Memory Data Store with Atomic State Rollback capabilities.
 */

import bcrypt from 'bcryptjs';
import { WatchItem, Order, User, CartItem } from '../../shared/types.js';
import { INITIAL_WATCH_CATALOG } from './initialData.js';

class DataStore {
  private watches: Map<string, WatchItem> = new Map();
  private users: Map<string, User> = new Map();
  private orders: Map<string, Order> = new Map();
  private activeCarts: Map<string, CartItem[]> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Seed Catalog
    for (const watch of INITIAL_WATCH_CATALOG) {
      this.watches.set(watch.id, { ...watch });
    }

    // Seed Admin User (Password: AdminPass123!)
    const adminSalt = bcrypt.genSaltSync(10);
    const adminHash = bcrypt.hashSync('AdminPass123!', adminSalt);
    const adminUser: User = {
      id: 'usr-admin-01',
      email: 'admin@wristwatch.luxury',
      fullName: 'Chief Horologist (Admin)',
      role: 'admin',
      passwordHash: adminHash,
      createdAt: new Date().toISOString(),
      consentSettings: {
        necessaryCookies: true,
        analyticsCookies: true,
        marketingCookies: false,
        consentedAt: new Date().toISOString(),
      },
    };
    this.users.set(adminUser.id, adminUser);

    // Seed Demo Customer (Password: CustomerPass123!)
    const customerSalt = bcrypt.genSaltSync(10);
    const customerHash = bcrypt.hashSync('CustomerPass123!', customerSalt);
    const customerUser: User = {
      id: 'usr-customer-01',
      email: 'collector@wristwatch.luxury',
      fullName: 'Alexander Vance',
      role: 'customer',
      passwordHash: customerHash,
      createdAt: new Date().toISOString(),
      consentSettings: {
        necessaryCookies: true,
        analyticsCookies: false,
        marketingCookies: false,
        consentedAt: new Date().toISOString(),
      },
    };
    this.users.set(customerUser.id, customerUser);
  }

  // --- Watch Catalog Operations ---
  public getAllWatches(): WatchItem[] {
    return Array.from(this.watches.values());
  }

  public getWatchById(id: string): WatchItem | undefined {
    return this.watches.get(id);
  }

  public updateWatchStock(id: string, newStock: number): boolean {
    const watch = this.watches.get(id);
    if (!watch) return false;
    watch.stockQuantity = newStock;
    this.watches.set(id, watch);
    return true;
  }

  public updateWatchPrice(id: string, basePriceInCents: number): boolean {
    const watch = this.watches.get(id);
    if (!watch) return false;
    watch.basePriceInCents = basePriceInCents;
    this.watches.set(id, watch);
    return true;
  }

  // --- Inventory Atomic Deduction with SWEBOK v4 Safe Rollback ---
  public executeAtomicInventoryDeduction(
    items: Array<{ watchId: string; quantity: number }>
  ): { success: boolean; rollback: () => void; error?: string } {
    const preOrderInventorySnapshot = new Map<string, number>();

    // Phase 1: Verification
    for (const item of items) {
      const watch = this.watches.get(item.watchId);
      if (!watch) {
        return {
          success: false,
          rollback: () => {},
          error: `Watch ${item.watchId} not found in catalog`,
        };
      }
      if (watch.stockQuantity < item.quantity) {
        return {
          success: false,
          rollback: () => {},
          error: `Insufficient inventory for ${watch.name}. Requested: ${item.quantity}, Available: ${watch.stockQuantity}`,
        };
      }
      preOrderInventorySnapshot.set(watch.id, watch.stockQuantity);
    }

    // Phase 2: Application
    for (const item of items) {
      const watch = this.watches.get(item.watchId)!;
      watch.stockQuantity -= item.quantity;
      this.watches.set(watch.id, watch);
    }

    // Provide atomic rollback closure (SWEBOK v4 Ch. 04)
    const rollback = () => {
      for (const [watchId, previousStock] of preOrderInventorySnapshot.entries()) {
        const watch = this.watches.get(watchId);
        if (watch) {
          watch.stockQuantity = previousStock;
          this.watches.set(watchId, watch);
        }
      }
    };

    return {
      success: true,
      rollback,
    };
  }

  // --- User Operations ---
  public getUserByEmail(email: string): User | undefined {
    const cleanEmail = email.toLowerCase().trim();
    for (const user of this.users.values()) {
      if (user.email.toLowerCase() === cleanEmail) {
        return user;
      }
    }
    return undefined;
  }

  public getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  public createUser(user: User): User {
    this.users.set(user.id, user);
    return user;
  }

  public updateUserConsent(userId: string, consent: User['consentSettings']): boolean {
    const user = this.users.get(userId);
    if (!user) return false;
    user.consentSettings = consent;
    this.users.set(userId, user);
    return true;
  }

  public deleteUser(userId: string): boolean {
    // GDPR Right to be Forgotten: Anonymize or remove user
    return this.users.delete(userId);
  }

  // --- Orders Operations ---
  public createOrder(order: Order): Order {
    this.orders.set(order.id, order);
    return order;
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.get(id);
  }

  public getOrdersByUserId(userId: string): Order[] {
    return Array.from(this.orders.values()).filter(
      (order) => order.userId === userId
    );
  }

  public getOrdersByCustomerEmail(email: string): Order[] {
    const clean = email.toLowerCase().trim();
    return Array.from(this.orders.values()).filter(
      (order) => order.customerEmail.toLowerCase() === clean
    );
  }

  public getAllOrders(): Order[] {
    return Array.from(this.orders.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public updateOrderStatus(orderId: string, status: Order['orderStatus'], trackingNumber?: string): boolean {
    const order = this.orders.get(orderId);
    if (!order) return false;
    order.orderStatus = status;
    if (trackingNumber) order.trackingNumber = trackingNumber;
    order.updatedAt = new Date().toISOString();
    this.orders.set(orderId, order);
    return true;
  }

  // --- Cart State Persistence ---
  public getCart(sessionId: string): CartItem[] {
    return this.activeCarts.get(sessionId) || [];
  }

  public setCart(sessionId: string, items: CartItem[]): void {
    this.activeCarts.set(sessionId, items);
  }

  public clearCart(sessionId: string): void {
    this.activeCarts.delete(sessionId);
  }

  // For testing reset
  public reset(): void {
    this.watches.clear();
    this.users.clear();
    this.orders.clear();
    this.activeCarts.clear();
    this.initialize();
  }
}

export const store = new DataStore();
