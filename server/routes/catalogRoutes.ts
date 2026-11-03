/**
 * IEEE SWEBOK v4 Chapter 01 (Requirements) & Chapter 03 (Modular Design)
 * Watch Catalog & Customizer Endpoints.
 */

import { Router } from 'express';
import { store } from '../data/store.js';
import {
  COMPONENT_PRICING_RULES,
  calculateItemUnitPriceInCents,
  computeOrderPricingBreakdown,
} from '../services/pricingService.js';
import { validateBody } from '../middleware/validationMiddleware.js';
import { CalculatePriceSchema } from '../../shared/schemas.js';

const router = Router();

// List and search watches with filtering (SWEBOK v4 Ch. 01)
router.get('/', (req, res) => {
  const { movement, caseDiameter, strap, waterResistance, search, sort } = req.query;

  let watches = store.getAllWatches();

  if (movement && typeof movement === 'string') {
    watches = watches.filter((w) => w.movement.toLowerCase() === movement.toLowerCase());
  }

  if (caseDiameter) {
    const dia = parseInt(caseDiameter as string, 10);
    if (!isNaN(dia)) {
      watches = watches.filter((w) => w.caseDiameterMm === dia);
    }
  }

  if (strap && typeof strap === 'string') {
    watches = watches.filter((w) => w.strapMaterial.toLowerCase().includes(strap.toLowerCase()));
  }

  if (waterResistance) {
    const wr = parseInt(waterResistance as string, 10);
    if (!isNaN(wr)) {
      watches = watches.filter((w) => w.waterResistanceMeters >= wr);
    }
  }

  if (search && typeof search === 'string') {
    const term = search.toLowerCase().trim();
    watches = watches.filter(
      (w) =>
        w.name.toLowerCase().includes(term) ||
        w.brand.toLowerCase().includes(term) ||
        w.collection.toLowerCase().includes(term) ||
        w.description.toLowerCase().includes(term) ||
        w.modelCode.toLowerCase().includes(term)
    );
  }

  if (sort === 'price_asc') {
    watches.sort((a, b) => a.basePriceInCents - b.basePriceInCents);
  } else if (sort === 'price_desc') {
    watches.sort((a, b) => b.basePriceInCents - a.basePriceInCents);
  }

  res.json({
    success: true,
    data: watches,
    meta: {
      count: watches.length,
      timestamp: new Date().toISOString(),
    },
  });
});

// Watch Details
router.get('/:id', (req, res) => {
  const watchId = String(req.params.id);
  const watch = store.getWatchById(watchId);
  if (!watch) {
    res.status(404).json({
      success: false,
      error: { code: 'WATCH_NOT_FOUND', message: `Watch with ID "${watchId}" was not found.` },
    });
    return;
  }
  res.json({ success: true, data: watch });
});

// Customizer options & price rules metadata
router.get('/customizer/options', (_req, res) => {
  res.json({
    success: true,
    data: {
      pricingRules: COMPONENT_PRICING_RULES,
      options: {
        materials: ['Stainless Steel', 'Titanium', 'Ceramic', 'Yellow Gold', 'Rose Gold'],
        bezels: ['Smooth Polished', 'Fluted Luxury', 'Ceramic Tachymeter', 'Diver 60-Min Unidirectional'],
        dials: [
          'Midnight Obsidian',
          'Sunburst Royal Blue',
          'Emerald Forest',
          'Champagne Gold',
          'Silver Guilloche',
          'Skeleton Open-Heart',
        ],
        hands: ['Dauphine', 'Baton Luminous', 'Breguet Classic', 'Blued Steel Leaf'],
        straps: [
          'Horween Calfskin',
          'Vulcanized Rubber',
          'Milanese Mesh',
          'Stainless Steel Oyster',
          'Alligator Leather',
        ],
        movements: ['Automatic', 'Manual', 'Quartz', 'Tourbillon'],
        diameters: [38, 39, 40, 41, 42, 44],
      },
    },
  });
});

// Server-Side Recalculate Price Preview (SWEBOK v4 Ch. 03 & 13)
// Client NEVER dictates price; server calculates based on base watch + component add-ons
router.post('/customizer/price', validateBody(CalculatePriceSchema), (req, res) => {
  const { baseWatchId, customConfig, quantity, couponCode } = req.body;
  const watch = store.getWatchById(baseWatchId);

  if (!watch) {
    res.status(404).json({
      success: false,
      error: { code: 'WATCH_NOT_FOUND', message: 'Base watch for configuration was not found.' },
    });
    return;
  }

  const unitPriceInCents = calculateItemUnitPriceInCents(watch.basePriceInCents, customConfig);
  const breakdown = computeOrderPricingBreakdown(
    [{ basePriceInCents: watch.basePriceInCents, customConfig, quantity }],
    couponCode
  );

  res.json({
    success: true,
    data: {
      unitPriceInCents,
      breakdown,
    },
  });
});

export default router;
