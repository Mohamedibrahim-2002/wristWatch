/**
 * IEEE SWEBOK v4 - Client API Gateway Communication Layer
 * Strongly typed client interfaces matching server contracts.
 */

import {
  WatchItem,
  CartItem,
  Order,
  User,
  CustomizerSelection,
  TransparentPriceBreakdown,
  ApiResponse,
} from '../../shared/types.js';

const API_BASE = '/api';

class ApiService {
  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = localStorage.getItem('wrist_auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers || {}),
      },
      credentials: 'include',
    });

    const data: ApiResponse<T> = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || 'Request failed');
    }

    return data.data as T;
  }

  // Catalog
  public async getCatalog(params: Record<string, string> = {}): Promise<WatchItem[]> {
    const query = new URLSearchParams(params).toString();
    return this.request<WatchItem[]>(`/catalog${query ? `?${query}` : ''}`);
  }

  public async getWatch(id: string): Promise<WatchItem> {
    return this.request<WatchItem>(`/catalog/${id}`);
  }

  public async getCustomizerOptions(): Promise<any> {
    return this.request<any>('/catalog/customizer/options');
  }

  public async calculateCustomizerPrice(payload: {
    baseWatchId: string;
    customConfig?: CustomizerSelection;
    quantity?: number;
    couponCode?: string;
  }): Promise<{ unitPriceInCents: number; breakdown: TransparentPriceBreakdown }> {
    return this.request('/catalog/customizer/price', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Cart
  public async getCart(couponCode?: string): Promise<{ items: CartItem[]; itemCount: number; breakdown: TransparentPriceBreakdown | null }> {
    const q = couponCode ? `?coupon=${encodeURIComponent(couponCode)}` : '';
    return this.request(`/cart${q}`);
  }

  public async addToCart(payload: {
    watchId: string;
    isCustom: boolean;
    customConfig?: CustomizerSelection;
    quantity?: number;
  }): Promise<{ item: CartItem; items: CartItem[] }> {
    return this.request('/cart/add', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async updateCartQuantity(itemId: string, quantity: number): Promise<{ items: CartItem[] }> {
    return this.request(`/cart/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ quantity }),
    });
  }

  public async removeFromCart(itemId: string): Promise<{ items: CartItem[] }> {
    return this.request(`/cart/${itemId}`, {
      method: 'DELETE',
    });
  }

  public async clearCart(): Promise<void> {
    return this.request('/cart', {
      method: 'DELETE',
    });
  }

  // Orders & Checkout
  public async processCheckout(payload: any): Promise<Order> {
    return this.request<Order>('/orders/checkout', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public async getMyOrders(): Promise<Order[]> {
    return this.request<Order[]>('/orders/my-orders');
  }

  public async getOrder(id: string): Promise<Order> {
    return this.request<Order>(`/orders/${id}`);
  }

  // Auth
  public async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    localStorage.setItem('wrist_auth_token', result.token);
    return result;
  }

  public async register(email: string, fullName: string, password: string): Promise<{ user: User; token: string }> {
    const result = await this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, fullName, password }),
    });
    localStorage.setItem('wrist_auth_token', result.token);
    return result;
  }

  public async getMe(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  public logout(): void {
    localStorage.removeItem('wrist_auth_token');
    fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
  }

  // GDPR
  public async updateConsent(consent: { necessaryCookies: boolean; analyticsCookies: boolean; marketingCookies: boolean }): Promise<void> {
    return this.request('/auth/gdpr/consent', {
      method: 'POST',
      body: JSON.stringify(consent),
    });
  }

  public async exportGdprData(): Promise<Blob> {
    const token = localStorage.getItem('wrist_auth_token');
    const res = await fetch(`${API_BASE}/auth/gdpr/export`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      credentials: 'include',
    });
    return res.blob();
  }

  public async deleteAccount(): Promise<void> {
    await this.request('/auth/gdpr/delete', { method: 'DELETE' });
    localStorage.removeItem('wrist_auth_token');
  }

  // Admin
  public async getAdminInventory(): Promise<{ items: WatchItem[]; metrics: any }> {
    return this.request('/admin/inventory');
  }

  public async updateAdminInventory(watchId: string, payload: { stockQuantity: number; basePriceInCents?: number }): Promise<WatchItem> {
    return this.request(`/admin/inventory/${watchId}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  }

  public async getAdminOrders(): Promise<{ orders: Order[]; metrics: any }> {
    return this.request('/admin/orders');
  }

  public async updateAdminOrderStatus(orderId: string, status: string, trackingNumber?: string): Promise<Order> {
    return this.request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, trackingNumber }),
    });
  }
}

export const api = new ApiService();
