import { describe, it, expect } from 'vitest';
import {
  calculateCustomizationAddonsInCents,
  calculateItemUnitPriceInCents,
  computeOrderPricingBreakdown,
  formatCurrencyCents,
  COMPONENT_PRICING_RULES,
} from '../server/services/pricingService.js';
import { CustomizerSelection } from '../shared/types.js';

describe('SWEBOK v4 Ch. 04: Pricing Engine & Integer Cents Precision', () => {
  it('should compute base item price without modifiers correctly', () => {
    const baseCents = 145000; // $1,450.00
    const unitPrice = calculateItemUnitPriceInCents(baseCents);
    expect(unitPrice).toBe(145000);
  });

  it('should correctly sum customizer component add-ons in cents', () => {
    const customConfig: CustomizerSelection = {
      baseWatchId: 'ww-sub-01',
      caseMaterial: 'Rose Gold',         // 195000
      caseDiameterMm: 40,
      bezel: 'Fluted Luxury',             // 40000
      dialColor: 'Emerald Forest',        // 25000
      hands: 'Dauphine',                  // 10000
      strap: 'Alligator Leather',         // 38000
      movement: 'Automatic',              // 45000
      engraving: 'VANCE 2026',            // 5000
    };

    const addons = calculateCustomizationAddonsInCents(customConfig);
    const expected = 195000 + 40000 + 25000 + 10000 + 38000 + 45000 + 5000;
    expect(addons).toBe(expected);
    expect(addons).toBe(358000); // Exactly $3,580.00

    const unitPrice = calculateItemUnitPriceInCents(100000, customConfig);
    expect(unitPrice).toBe(458000); // $1,000.00 + $3,580.00 = $4,580.00
  });

  it('should apply percentage promotional coupon transparently', () => {
    // 2 items @ $1,000.00 = $2,000.00 (200000 cents)
    const breakdown = computeOrderPricingBreakdown(
      [{ basePriceInCents: 100000, quantity: 2 }],
      'HOROLOGY10' // 10% off
    );

    expect(breakdown.subtotalInCents).toBe(200000);
    expect(breakdown.discountInCents).toBe(20000); // $200.00 off
    expect(breakdown.discountCodeApplied).toBe('HOROLOGY10');

    // Subtotal after discount = 180000 cents ($1,800.00)
    // 180000 >= 150000 threshold -> Free Shipping
    expect(breakdown.isFreeShipping).toBe(true);
    expect(breakdown.shippingInCents).toBe(0);

    // 8% tax on $1,800.00 = $144.00 (14400 cents)
    expect(breakdown.taxInCents).toBe(14400);

    // Final total = $1,800.00 + $144.00 = $1,944.00 (194400 cents)
    expect(breakdown.finalTotalInCents).toBe(194400);
  });

  it('should calculate shipping for orders below the free shipping threshold', () => {
    // $850.00 order
    const breakdown = computeOrderPricingBreakdown(
      [{ basePriceInCents: 85000, quantity: 1 }]
    );

    expect(breakdown.subtotalInCents).toBe(85000);
    expect(breakdown.isFreeShipping).toBe(false);
    expect(breakdown.shippingInCents).toBe(2500); // $25.00 flat rate

    // 8% tax on 85000 = 6800
    expect(breakdown.taxInCents).toBe(6800);
    // Total = 85000 + 6800 + 2500 = 94300 ($943.00)
    expect(breakdown.finalTotalInCents).toBe(94300);
  });

  it('should reject invalid or negative quantities defensively', () => {
    expect(() => {
      computeOrderPricingBreakdown([{ basePriceInCents: 100000, quantity: -1 }]);
    }).toThrow('Invalid quantity');

    expect(() => {
      computeOrderPricingBreakdown([]);
    }).toThrow('Cannot calculate pricing for empty item list');
  });

  it('should format cents into accurate human-readable currency strings', () => {
    expect(formatCurrencyCents(145000)).toBe('$1,450.00');
    expect(formatCurrencyCents(2500)).toBe('$25.00');
    expect(formatCurrencyCents(99)).toBe('$0.99');
  });
});

