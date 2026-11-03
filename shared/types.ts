/**
 * IEEE SWEBOK v4 - Domain Data Models & Types
 * Enforces Defensive Programming & Separation of Concerns (Chapters 01, 02, 04, 13)
 */

export type MovementType = 'Automatic' | 'Manual' | 'Quartz' | 'Tourbillon';
export type CaseMaterial = 'Stainless Steel' | 'Rose Gold' | 'Yellow Gold' | 'Titanium' | 'Ceramic';
export type StrapMaterial = 'Alligator Leather' | 'Stainless Steel Oyster' | 'Milanese Mesh' | 'Vulcanized Rubber' | 'Horween Calfskin';
export type DialColor = 'Midnight Obsidian' | 'Sunburst Royal Blue' | 'Emerald Forest' | 'Champagne Gold' | 'Silver Guilloche' | 'Skeleton Open-Heart';
export type BezelType = 'Smooth Polished' | 'Fluted Luxury' | 'Ceramic Tachymeter' | 'Diver 60-Min Unidirectional';
export type HandsStyle = 'Dauphine' | 'Baton Luminous' | 'Breguet Classic' | 'Blued Steel Leaf';

export interface WatchItem {
  id: string;
  name: string;
  brand: string;
  modelCode: string;
  collection: string;
  description: string;
  basePriceInCents: number; // Stored in integer cents to eliminate floating-point inaccuracies (SWEBOK v4 Ch. 04)
  movement: MovementType;
  caseDiameterMm: number;
  caseMaterial: CaseMaterial;
  waterResistanceMeters: number;
  dialColor: DialColor;
  strapMaterial: StrapMaterial;
  stockQuantity: number;
  imageUrl: string;
  featured?: boolean;
  specs: {
    powerReserveHours: number;
    jewelsCount: number;
    crystalType: 'Sapphire Crystal (Anti-Reflective)' | 'Domed Sapphire';
    caseThicknessMm: number;
    lugWidthMm: number;
  };
}

export interface CustomizerSelection {
  baseWatchId: string;
  caseMaterial: CaseMaterial;
  caseDiameterMm: number;
  bezel: BezelType;
  dialColor: DialColor;
  hands: HandsStyle;
  strap: StrapMaterial;
  movement: MovementType;
  engraving?: string; // Optional custom caseback text (max 25 chars)
}

export interface ComponentPriceModifier {
  name: string;
  additionalCents: number;
  description?: string;
}

export interface CustomizerPricingRules {
  materials: Record<CaseMaterial, number>;
  bezels: Record<BezelType, number>;
  dials: Record<DialColor, number>;
  hands: Record<HandsStyle, number>;
  straps: Record<StrapMaterial, number>;
  movements: Record<MovementType, number>;
  engravingPriceInCents: number;
}

export interface CartItem {
  id: string; // unique cart line id
  watchId: string;
  isCustom: boolean;
  customConfig?: CustomizerSelection;
  quantity: number;
  // Prices are verified and calculated server-side
  unitPriceInCents: number;
  totalPriceInCents: number;
  watchSnapshot: {
    name: string;
    brand: string;
    imageUrl: string;
    summary: string;
  };
}

export interface TransparentPriceBreakdown {
  baseTotalInCents: number;
  customizationAddonsInCents: number;
  subtotalInCents: number;
  discountInCents: number;
  discountCodeApplied?: string;
  taxRatePercent: number;
  taxInCents: number;
  shippingInCents: number;
  isFreeShipping: boolean;
  finalTotalInCents: number;
}

export interface ShippingAddress {
  fullName: string;
  streetAddress: string;
  apartmentOrSuite?: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

export type OrderStatus = 'processing' | 'assembling' | 'quality_check' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded';

export interface Order {
  id: string;
  orderNumber: string;
  userId?: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: ShippingAddress;
  items: CartItem[];
  pricing: TransparentPriceBreakdown;
  paymentDetails: {
    gateway: 'STRIPE_PCI_MOCK' | 'BRAINTREE_PCI_MOCK';
    paymentToken: string;
    cardBrand?: string;
    lastFourDigits?: string;
    status: PaymentStatus;
    transactionId: string;
    paidAt?: string;
  };
  orderStatus: OrderStatus;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = 'customer' | 'admin';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  passwordHash?: string;
  createdAt: string;
  lastLoginAt?: string;
  consentSettings?: {
    necessaryCookies: boolean;
    analyticsCookies: boolean;
    marketingCookies: boolean;
    consentedAt: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

