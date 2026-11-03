/**
 * IEEE SWEBOK v4 Chapter 03 (Modular Design) & Chapter 13 (Threat Mitigation)
 * Cart Service: Recalculates all cart items and unit prices against canonical database values.
 * Client-submitted prices are NEVER stored or trusted.
 */

import { CartItem, CustomizerSelection } from '../../shared/types.js';
import { store } from '../data/store.js';
import { calculateItemUnitPriceInCents } from './pricingService.js';

export class CartService {
  /**
   * Constructs a fully verified CartItem from validated input.
   */
  public buildVerifiedCartItem(
    watchId: string,
    isCustom: boolean,
    customConfig?: CustomizerSelection,
    quantity: number = 1
  ): CartItem {
    const watch = store.getWatchById(watchId);
    if (!watch) {
      throw new Error(`Watch with ID "${watchId}" does not exist in catalog`);
    }

    if (quantity < 1 || !Number.isInteger(quantity)) {
      throw new Error('Quantity must be a positive integer');
    }

    // Canonical server-side price computation
    const unitPriceInCents = calculateItemUnitPriceInCents(watch.basePriceInCents, customConfig);
    const totalPriceInCents = unitPriceInCents * quantity;

    let summary = `${watch.brand} - ${watch.name}`;
    if (isCustom && customConfig) {
      summary += ` [Customized: ${customConfig.caseMaterial}, ${customConfig.dialColor}, ${customConfig.strap}]`;
    }

    const cartLineId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      id: cartLineId,
      watchId: watch.id,
      isCustom,
      customConfig: isCustom ? customConfig : undefined,
      quantity,
      unitPriceInCents,
      totalPriceInCents,
      watchSnapshot: {
        name: watch.name,
        brand: watch.brand,
        imageUrl: watch.imageUrl,
        summary,
      },
    };
  }

  /**
   * Recalculates an entire existing cart to guarantee fresh prices.
   */
  public refreshCartPrices(items: CartItem[]): CartItem[] {
    return items.map((item) => {
      const watch = store.getWatchById(item.watchId);
      if (!watch) {
        throw new Error(`Watch ${item.watchId} no longer available`);
      }
      const unitPriceInCents = calculateItemUnitPriceInCents(watch.basePriceInCents, item.customConfig);
      return {
        ...item,
        unitPriceInCents,
        totalPriceInCents: unitPriceInCents * item.quantity,
      };
    });
  }
}

export const cartService = new CartService();

