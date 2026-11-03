/**
 * IEEE SWEBOK v4 Chapter 04 & 13 - Secure Order Checkout & Payment Processing
 */

import { Router } from 'express';
import { orderService } from '../services/orderService.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { CheckoutSchema } from '../../shared/schemas.js';
import { optionalAuth, requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { store } from '../data/store.js';

const router = Router();

// Checkout Endpoint
router.post('/checkout', optionalAuth, validateBody(CheckoutSchema), async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.userId;
    const {
      customerEmail,
      customerName,
      shippingAddress,
      items,
      couponCode,
      paymentToken,
      cardLastFour,
      cardBrand,
    } = req.body;

    const order = await orderService.processCheckout({
      userId,
      customerEmail,
      customerName,
      shippingAddress,
      items,
      couponCode,
      paymentToken,
      cardLastFour,
      cardBrand,
    });

    // Clear cart after successful checkout
    if (userId) {
      store.clearCart(`usr_${userId}`);
    }
    if (req.cookies?.wrist_guest_id) {
      store.clearCart(req.cookies.wrist_guest_id);
    }

    res.status(201).json({
      success: true,
      data: order,
      meta: { timestamp: new Date().toISOString() },
    });
  } catch (err: any) {
    // SWEBOK v4 Ch. 04: Log error securely, do not leak internals
    res.status(400).json({
      success: false,
      error: {
        code: 'CHECKOUT_FAILED',
        message: err.message || 'Unable to process checkout. Please verify payment details.',
      },
    });
  }
});

// Get User's Orders
router.get('/my-orders', requireAuth, (req: AuthenticatedRequest, res) => {
  const orders = orderService.getCustomerOrders(req.user!.userId);
  res.json({ success: true, data: orders });
});

// Get Order Details by ID (with authorization check)
router.get('/:orderId', optionalAuth, (req: AuthenticatedRequest, res) => {
  const orderId = String(req.params.orderId);
  const order = orderService.getOrder(orderId);
  if (!order) {
    res.status(404).json({ success: false, error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' } });
    return;
  }

  // Authorization check: if order belongs to a user, only that user or an admin can access it
  if (order.userId && req.user?.userId !== order.userId && req.user?.role !== 'admin') {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'You are not authorized to view this order.' },
    });
    return;
  }

  res.json({ success: true, data: order });
});

export default router;
