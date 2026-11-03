/**
 * IEEE SWEBOK v4 Chapter 03 & 13 - Cart Operations with Server-Side State Validation
 */

import { Router } from 'express';
import { store } from '../data/store.js';
import { cartService } from '../services/cartService.js';
import { computeOrderPricingBreakdown } from '../services/pricingService.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { AddToCartSchema, UpdateCartItemSchema } from '../../shared/schemas.js';
import { optionalAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';

const router = Router();

// Helper to get consistent cart session identifier
function getSessionCartKey(req: AuthenticatedRequest): string {
  if (req.user?.userId) return `usr_${req.user.userId}`;
  let guestId = req.cookies?.wrist_guest_id;
  if (!guestId) {
    guestId = `guest_${Math.random().toString(36).substring(2, 10)}`;
  }
  return guestId;
}

// Get Cart with server-verified prices
router.get('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const cartKey = getSessionCartKey(req);
  const rawItems = store.getCart(cartKey);

  // Re-verify and refresh item prices from catalog
  let items = rawItems;
  try {
    items = cartService.refreshCartPrices(rawItems);
    store.setCart(cartKey, items);
  } catch {
    // If some watch was removed, preserve valid ones
  }

  const coupon = req.query.coupon as string | undefined;

  let breakdown = null;
  if (items.length > 0) {
    const pricingItems = items.map((i) => {
      const watch = store.getWatchById(i.watchId)!;
      return {
        basePriceInCents: watch.basePriceInCents,
        customConfig: i.customConfig,
        quantity: i.quantity,
      };
    });
    breakdown = computeOrderPricingBreakdown(pricingItems, coupon);
  }

  res.cookie('wrist_guest_id', cartKey.replace('usr_', ''), {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  res.json({
    success: true,
    data: {
      items,
      itemCount: items.reduce((acc, i) => acc + i.quantity, 0),
      breakdown,
    },
  });
});

// Add Item to Cart
router.post('/add', optionalAuth, validateBody(AddToCartSchema), (req: AuthenticatedRequest, res) => {
  try {
    const cartKey = getSessionCartKey(req);
    const { watchId, isCustom, customConfig, quantity } = req.body;

    const verifiedItem = cartService.buildVerifiedCartItem(watchId, isCustom, customConfig, quantity);
    const currentItems = store.getCart(cartKey);

    // If identical standard item exists, increment quantity
    if (!isCustom) {
      const existingIdx = currentItems.findIndex((i) => !i.isCustom && i.watchId === watchId);
      if (existingIdx >= 0) {
        currentItems[existingIdx].quantity += quantity;
        currentItems[existingIdx].totalPriceInCents =
          currentItems[existingIdx].unitPriceInCents * currentItems[existingIdx].quantity;
        store.setCart(cartKey, currentItems);
        res.json({ success: true, data: { item: currentItems[existingIdx], items: currentItems } });
        return;
      }
    }

    currentItems.push(verifiedItem);
    store.setCart(cartKey, currentItems);

    res.status(201).json({
      success: true,
      data: {
        item: verifiedItem,
        items: currentItems,
      },
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: { code: 'CART_ADD_ERROR', message: err.message },
    });
  }
});

// Update Item Quantity
router.patch('/:itemId', optionalAuth, validateBody(UpdateCartItemSchema), (req: AuthenticatedRequest, res) => {
  const cartKey = getSessionCartKey(req);
  const currentItems = store.getCart(cartKey);
  const itemId = String(req.params.itemId);
  const target = currentItems.find((i) => i.id === itemId);

  if (!target) {
    res.status(404).json({ success: false, error: { code: 'ITEM_NOT_FOUND', message: 'Cart item not found' } });
    return;
  }

  target.quantity = req.body.quantity;
  target.totalPriceInCents = target.unitPriceInCents * target.quantity;
  store.setCart(cartKey, currentItems);

  res.json({ success: true, data: { items: currentItems } });
});

// Remove Item from Cart
router.delete('/:itemId', optionalAuth, (req: AuthenticatedRequest, res) => {
  const cartKey = getSessionCartKey(req);
  const currentItems = store.getCart(cartKey);
  const itemId = String(req.params.itemId);
  const filtered = currentItems.filter((i) => i.id !== itemId);
  store.setCart(cartKey, filtered);

  res.json({ success: true, data: { items: filtered } });
});

// Clear Entire Cart
router.delete('/', optionalAuth, (req: AuthenticatedRequest, res) => {
  const cartKey = getSessionCartKey(req);
  store.clearCart(cartKey);
  res.json({ success: true, message: 'Cart cleared' });
});

export default router;
