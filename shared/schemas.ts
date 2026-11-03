/**
 * IEEE SWEBOK v4 Chapter 13 (Software Security) & Chapter 04 (Defensive Construction)
 * Strict Input Validation & Sanitization using Zod Allowlists.
 */

import { z } from 'zod';

// Allowed enumerations
export const CaseMaterialEnum = z.enum([
  'Stainless Steel',
  'Rose Gold',
  'Yellow Gold',
  'Titanium',
  'Ceramic',
]);

export const MovementTypeEnum = z.enum([
  'Automatic',
  'Manual',
  'Quartz',
  'Tourbillon',
]);

export const StrapMaterialEnum = z.enum([
  'Alligator Leather',
  'Stainless Steel Oyster',
  'Milanese Mesh',
  'Vulcanized Rubber',
  'Horween Calfskin',
]);

export const DialColorEnum = z.enum([
  'Midnight Obsidian',
  'Sunburst Royal Blue',
  'Emerald Forest',
  'Champagne Gold',
  'Silver Guilloche',
  'Skeleton Open-Heart',
]);

export const BezelTypeEnum = z.enum([
  'Smooth Polished',
  'Fluted Luxury',
  'Ceramic Tachymeter',
  'Diver 60-Min Unidirectional',
]);

export const HandsStyleEnum = z.enum([
  'Dauphine',
  'Baton Luminous',
  'Breguet Classic',
  'Blued Steel Leaf',
]);

// Customizer Selection Schema
export const CustomizerSelectionSchema = z.object({
  baseWatchId: z.string().min(1, 'Base watch ID is required').max(64),
  caseMaterial: CaseMaterialEnum,
  caseDiameterMm: z.number().int().min(36).max(46),
  bezel: BezelTypeEnum,
  dialColor: DialColorEnum,
  hands: HandsStyleEnum,
  strap: StrapMaterialEnum,
  movement: MovementTypeEnum,
  engraving: z
    .string()
    .max(25, 'Engraving text cannot exceed 25 characters')
    .regex(/^[a-zA-Z0-9\s.,'’\-]*$/, 'Engraving contains unsupported characters')
    .optional(),
});

// Calculate Price Request Schema (client provides configuration, server recalculates price)
export const CalculatePriceSchema = z.object({
  baseWatchId: z.string().min(1).max(64),
  customConfig: CustomizerSelectionSchema.optional(),
  quantity: z.number().int().min(1).max(10).default(1),
  couponCode: z.string().trim().max(32).optional(),
});

// Cart Item Schema
export const AddToCartSchema = z.object({
  watchId: z.string().min(1).max(64),
  isCustom: z.boolean(),
  customConfig: CustomizerSelectionSchema.optional(),
  quantity: z.number().int().min(1).max(10).default(1),
});

export const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1).max(10),
});

// Shipping Address Schema with strict field validation
export const ShippingAddressSchema = z.object({
  fullName: z.string().trim().min(2, 'Name is required').max(80),
  streetAddress: z.string().trim().min(5, 'Street address is required').max(120),
  apartmentOrSuite: z.string().trim().max(40).optional(),
  city: z.string().trim().min(2, 'City is required').max(60),
  stateOrProvince: z.string().trim().min(2, 'State or province is required').max(60),
  postalCode: z.string().trim().min(3, 'Postal code is required').max(20),
  country: z.string().trim().min(2, 'Country is required').max(60),
  phoneNumber: z
    .string()
    .trim()
    .min(7, 'Valid phone number is required')
    .max(25)
    .regex(/^[\d+\-\s()]+$/, 'Invalid phone number format'),
});

// Checkout Schema (PCI-DSS compliance: credit card numbers are tokenized client-side)
export const CheckoutSchema = z.object({
  customerEmail: z.string().trim().email('Valid email address is required').max(120),
  customerName: z.string().trim().min(2).max(80),
  shippingAddress: ShippingAddressSchema,
  items: z.array(
    z.object({
      watchId: z.string().min(1),
      isCustom: z.boolean(),
      customConfig: CustomizerSelectionSchema.optional(),
      quantity: z.number().int().min(1).max(10),
    })
  ).min(1, 'Cart cannot be empty'),
  couponCode: z.string().trim().max(32).optional(),
  paymentToken: z
    .string()
    .min(8, 'Valid payment token required')
    .max(128)
    .regex(/^tok_[a-zA-Z0-9_]+$/, 'Invalid payment token format from gateway'),
  cardLastFour: z.string().length(4).regex(/^\d{4}$/).optional(),
  cardBrand: z.string().max(20).optional(),
});

// User Auth Schemas
export const RegisterUserSchema = z.object({
  email: z.string().trim().email('Invalid email address').max(120),
  fullName: z.string().trim().min(2, 'Name must be at least 2 characters').max(80),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100)
    .regex(/[A-Z]/, 'Password must include at least one uppercase letter')
    .regex(/[a-z]/, 'Password must include at least one lowercase letter')
    .regex(/[0-9]/, 'Password must include at least one number'),
});

export const LoginUserSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(100),
});

// Admin Inventory Update Schema
export const UpdateInventorySchema = z.object({
  stockQuantity: z.number().int().min(0, 'Stock cannot be negative').max(10000),
  basePriceInCents: z.number().int().min(1000, 'Price must be at least $10.00').optional(),
});

// GDPR Privacy Consent Schema
export const PrivacyConsentSchema = z.object({
  necessaryCookies: z.boolean().default(true),
  analyticsCookies: z.boolean().default(false),
  marketingCookies: z.boolean().default(false),
});

