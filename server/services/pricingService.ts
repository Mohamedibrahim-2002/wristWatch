/**
 * IEEE SWEBOK v4 Chapter 04 (Defensive Construction) & Chapter 13 (Threat Mitigation)
 * Pure Pricing Engine using Integer Cents arithmetic to eliminate floating-point inaccuracies.
 * Strictly verifies and recalculates prices server-side; client pricing is NEVER trusted.
 */

import {
  CustomizerSelection,
  CustomizerPricingRules,
  TransparentPriceBreakdown,
  CaseMaterial,
  BezelType,
  DialColor,
  HandsStyle,
  StrapMaterial,
  MovementType,
} from '../../shared/types.js';

export const COMPONENT_PRICING_RULES: CustomizerPricingRules = {
  materials: {
    'Stainless Steel': 0,
    'Titanium': 45000,        // +$450.00
    'Ceramic': 65000,         // +$650.00
    'Yellow Gold': 180000,     // +$1,800.00
    'Rose Gold': 195000,       // +$1,950.00
  },
  bezels: {
    'Smooth Polished': 0,
    'Ceramic Tachymeter': 25000,           // +$250.00
    'Diver 60-Min Unidirectional': 30000,   // +$300.00
    'Fluted Luxury': 40000,                // +$400.00
  },
  dials: {
    'Midnight Obsidian': 0,
    'Silver Guilloche': 15000,             // +$150.00
    'Sunburst Royal Blue': 20000,          // +$200.00
    'Emerald Forest': 25000,               // +$250.00
    'Champagne Gold': 35000,               // +$350.00
    'Skeleton Open-Heart': 85000,          // +$850.00
  },
  hands: {
    'Baton Luminous': 0,
    'Dauphine': 10000,                     // +$100.00
    'Blued Steel Leaf': 18000,             // +$180.00
    'Breguet Classic': 25000,              // +$250.00
  },
  straps: {
    'Horween Calfskin': 0,
    'Vulcanized Rubber': 8000,             // +$80.00
    'Milanese Mesh': 16000,                // +$160.00
    'Stainless Steel Oyster': 28000,       // +$280.00
    'Alligator Leather': 38000,            // +$380.00
  },
  movements: {
    'Quartz': 0,
    'Manual': 35000,                       // +$350.00
    'Automatic': 45000,                    // +$450.00
    'Tourbillon': 350000,                  // +$3,500.00
  },
  engravingPriceInCents: 5000,             // +$50.00 for custom engraving
};

// Verified coupons store
export const PROMOTIONAL_COUPONS: Record<string, { type: 'percentage' | 'fixed'; value: number }> = {
  'HOROLOGY10': { type: 'percentage', value: 10 }, // 10% off
  'SWEBOK50': { type: 'fixed', value: 5000 },      // $50.00 off
  'LUXURYVIP': { type: 'percentage', value: 15 },  // 15% off
};

export const TAX_RATE_PERCENT = 8; // 8% sales tax
export const FREE_SHIPPING_THRESHOLD_CENTS = 150000; // Free shipping on orders >= $1,500.00
export const FLAT_SHIPPING_CENTS = 2500; // $25.00 flat rate insured shipping

/**
 * Calculates additional cost of customized watch components.
 * Precondition: config contains valid selections verified by Zod schema.
 */
export function calculateCustomizationAddonsInCents(config?: CustomizerSelection): number {
  if (!config) return 0;

  let addons = 0;
  addons += COMPONENT_PRICING_RULES.materials[config.caseMaterial] || 0;
  addons += COMPONENT_PRICING_RULES.bezels[config.bezel] || 0;
  addons += COMPONENT_PRICING_RULES.dials[config.dialColor] || 0;
  addons += COMPONENT_PRICING_RULES.hands[config.hands] || 0;
  addons += COMPONENT_PRICING_RULES.straps[config.strap] || 0;
  addons += COMPONENT_PRICING_RULES.movements[config.movement] || 0;

  if (config.engraving && config.engraving.trim().length > 0) {
    addons += COMPONENT_PRICING_RULES.engravingPriceInCents;
  }

  return addons;
}

/**
 * Computes single item unit price in cents.
 */
export function calculateItemUnitPriceInCents(basePriceInCents: number, customConfig?: CustomizerSelection): number {
  if (basePriceInCents < 0) {
    throw new Error('Base price cannot be negative');
  }
  const addons = calculateCustomizationAddonsInCents(customConfig);
  return basePriceInCents + addons;
}

/**
 * Computes complete transparent price breakdown according to SWEBOK v4 Chapter 14 (No Dark Patterns).
 */
export function computeOrderPricingBreakdown(
  items: Array<{ basePriceInCents: number; customConfig?: CustomizerSelection; quantity: number }>,
  couponCode?: string
): TransparentPriceBreakdown {
  if (!items || items.length === 0) {
    throw new Error('Cannot calculate pricing for empty item list');
  }

  let baseTotalInCents = 0;
  let customizationAddonsInCents = 0;

  for (const item of items) {
    if (item.quantity <= 0 || !Number.isInteger(item.quantity)) {
      throw new Error(`Invalid quantity ${item.quantity}`);
    }
    const itemAddon = calculateCustomizationAddonsInCents(item.customConfig);
    baseTotalInCents += item.basePriceInCents * item.quantity;
    customizationAddonsInCents += itemAddon * item.quantity;
  }

  const subtotalInCents = baseTotalInCents + customizationAddonsInCents;

  // Calculate promotional discount
  let discountInCents = 0;
  let normalizedCoupon: string | undefined = undefined;

  if (couponCode) {
    const cleanCode = couponCode.trim().toUpperCase();
    const promo = PROMOTIONAL_COUPONS[cleanCode];
    if (promo) {
      normalizedCoupon = cleanCode;
      if (promo.type === 'percentage') {
        discountInCents = Math.round((subtotalInCents * promo.value) / 100);
      } else if (promo.type === 'fixed') {
        discountInCents = Math.min(promo.value, subtotalInCents);
      }
    }
  }

  const subtotalAfterDiscount = Math.max(0, subtotalInCents - discountInCents);

  // Exact integer tax calculation
  const taxInCents = Math.round((subtotalAfterDiscount * TAX_RATE_PERCENT) / 100);

  // Transparent shipping calculation
  const isFreeShipping = subtotalAfterDiscount >= FREE_SHIPPING_THRESHOLD_CENTS;
  const shippingInCents = isFreeShipping ? 0 : FLAT_SHIPPING_CENTS;

  const finalTotalInCents = subtotalAfterDiscount + taxInCents + shippingInCents;

  // Postcondition defensive checks
  if (finalTotalInCents < 0 || !Number.isInteger(finalTotalInCents)) {
    throw new Error('Defensive check failed: Computed total must be a positive integer in cents');
  }

  return {
    baseTotalInCents,
    customizationAddonsInCents,
    subtotalInCents,
    discountInCents,
    discountCodeApplied: normalizedCoupon,
    taxRatePercent: TAX_RATE_PERCENT,
    taxInCents,
    shippingInCents,
    isFreeShipping,
    finalTotalInCents,
  };
}

/**
 * Format integer cents into human-readable currency ($1,250.00).
 */
export function formatCurrencyCents(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(dollars);
}
