/**
 * IEEE SWEBOK v4 Chapter 13 - Admin RBAC Protected Inventory & Order Management
 */

import { Router } from 'express';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authMiddleware.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { UpdateInventorySchema } from '../../shared/schemas.js';
import { store } from '../data/store.js';

const router = Router();

// Apply requireAdmin to all routes in this router
router.use(requireAdmin);

// Inventory Health & Stock Levels
router.get('/inventory', (_req: AuthenticatedRequest, res) => {
  const watches = store.getAllWatches();
  const lowStockCount = watches.filter((w) => w.stockQuantity <= 5).length;
  const totalStockUnits = watches.reduce((acc, w) => acc + w.stockQuantity, 0);

  res.json({
    success: true,
    data: {
      items: watches,
      metrics: {
        totalProducts: watches.length,
        totalStockUnits,
        lowStockAlertCount: lowStockCount,
      },
    },
  });
});

// Update Inventory Stock and/or Base Price
router.patch('/inventory/:watchId', validateBody(UpdateInventorySchema), (req: AuthenticatedRequest, res) => {
  const watchId = String(req.params.watchId);
  const { stockQuantity, basePriceInCents } = req.body;

  const watch = store.getWatchById(watchId);
  if (!watch) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Watch not found' } });
    return;
  }

  store.updateWatchStock(watchId, stockQuantity);
  if (basePriceInCents !== undefined) {
    store.updateWatchPrice(watchId, basePriceInCents);
  }

  res.json({
    success: true,
    data: store.getWatchById(watchId),
    message: `Updated inventory for ${watch.name}. New stock: ${stockQuantity}`,
  });
});

// View All Orders across system
router.get('/orders', (_req: AuthenticatedRequest, res) => {
  const orders = store.getAllOrders();
  const totalRevenueInCents = orders.reduce((acc, o) => acc + o.pricing.finalTotalInCents, 0);

  res.json({
    success: true,
    data: {
      orders,
      metrics: {
        totalOrders: orders.length,
        totalRevenueInCents,
      },
    },
  });
});

// Update Order Status & Tracking
router.patch('/orders/:orderId/status', (req: AuthenticatedRequest, res) => {
  const orderId = String(req.params.orderId);
  const { status, trackingNumber } = req.body;

  const validStatuses = ['processing', 'assembling', 'quality_check', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid order status value' } });
    return;
  }

  const success = store.updateOrderStatus(orderId, status as any, trackingNumber);
  if (!success) {
    res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } });
    return;
  }

  res.json({
    success: true,
    data: store.getOrderById(orderId),
    message: `Order ${orderId} updated to status "${status}"`,
  });
});

export default router;
