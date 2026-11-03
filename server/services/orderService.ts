/**
 * IEEE SWEBOK v4 Chapter 04 (Defensive Construction) & Chapter 13 (Threat Mitigation)
 * Order Processing Service with Two-Phase Inventory Commitment and Safe Rollback.
 */

import { Order, ShippingAddress, CustomizerSelection } from '../../shared/types.js';
import { store } from '../data/store.js';
import { cartService } from './cartService.js';
import { computeOrderPricingBreakdown } from './pricingService.js';
import { paymentGateway } from './paymentGatewayMock.js';

export interface CheckoutInput {
  userId?: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  items: Array<{
    watchId: string;
    isCustom: boolean;
    customConfig?: CustomizerSelection;
    quantity: number;
  }>;
  couponCode?: string;
  paymentToken: string;
  cardLastFour?: string;
  cardBrand?: string;
}

export class OrderService {
  /**
   * Processes an order with atomic inventory deduction, payment capture, and rollback on failure.
   */
  public async processCheckout(input: CheckoutInput): Promise<Order> {
    const {
      userId,
      customerEmail,
      customerName,
      shippingAddress,
      items: rawItems,
      couponCode,
      paymentToken,
      cardLastFour = '4242',
      cardBrand = 'Visa',
    } = input;

    if (!rawItems || rawItems.length === 0) {
      throw new Error('Cannot process order with an empty item list');
    }

    // Step 1: Recompute all item prices independently against canonical database values
    const verifiedItems = rawItems.map((item) =>
      cartService.buildVerifiedCartItem(item.watchId, item.isCustom, item.customConfig, item.quantity)
    );

    // Step 2: Compute transparent financial breakdown in integer cents
    const pricingItems = verifiedItems.map((v) => {
      const watch = store.getWatchById(v.watchId)!;
      return {
        basePriceInCents: watch.basePriceInCents,
        customConfig: v.customConfig,
        quantity: v.quantity,
      };
    });

    const pricing = computeOrderPricingBreakdown(pricingItems, couponCode);

    // Step 3: Phase 1 Atomic Inventory Deduction with Rollback capability (SWEBOK v4 Ch. 04)
    const inventoryResult = store.executeAtomicInventoryDeduction(
      verifiedItems.map((i) => ({ watchId: i.watchId, quantity: i.quantity }))
    );

    if (!inventoryResult.success) {
      throw new Error(inventoryResult.error || 'Inventory allocation failed');
    }

    const orderNumber = `WW-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const orderId = `ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Step 4: Authorize & Capture Payment via PCI-DSS Compliant Gateway
    try {
      const paymentResult = await paymentGateway.chargeToken({
        token: paymentToken,
        amountInCents: pricing.finalTotalInCents,
        currency: 'USD',
        orderNumber,
        customerEmail,
      });

      if (!paymentResult.success) {
        // Rollback allocated inventory immediately (Restores baseline state)
        inventoryResult.rollback();
        throw new Error(paymentResult.errorMessage || 'Payment authorization was declined');
      }

      // Step 5: Construct Order Record
      const newOrder: Order = {
        id: orderId,
        orderNumber,
        userId,
        customerEmail,
        customerName,
        shippingAddress,
        items: verifiedItems,
        pricing,
        paymentDetails: {
          gateway: paymentResult.gateway,
          paymentToken: paymentToken.substring(0, 10) + '...', // Masked for defense in depth
          cardBrand,
          lastFourDigits: cardLastFour,
          status: 'captured',
          transactionId: paymentResult.transactionId,
          paidAt: new Date().toISOString(),
        },
        orderStatus: 'processing',
        trackingNumber: `TRK-LUX-${Math.floor(10000000 + Math.random() * 90000000)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      store.createOrder(newOrder);
      return newOrder;
    } catch (err: any) {
      // Ensure rollback executed on unexpected exceptions
      inventoryResult.rollback();
      throw err;
    }
  }

  public getOrder(orderId: string): Order | undefined {
    return store.getOrderById(orderId);
  }

  public getCustomerOrders(userId: string): Order[] {
    return store.getOrdersByUserId(userId);
  }

  public getAllOrdersAdmin(): Order[] {
    return store.getAllOrders();
  }
}

export const orderService = new OrderService();

