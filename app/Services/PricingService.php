<?php
/**
 * IEEE SWEBOK v4 Chapter 04 (Defensive Construction) & Chapter 13 (Threat Mitigation)
 * PHP Pricing Engine utilizing Integer Cents arithmetic for zero floating-point loss.
 */

declare(strict_types=1);

namespace WristWatch\Services;

use WristWatch\Config\Config;
use InvalidArgumentException;

class PricingService {
    public const COMPONENT_PRICING_RULES = [
        'materials' => [
            'Stainless Steel' => 0,
            'Titanium'        => 45000,   // +$450.00
            'Ceramic'         => 65000,   // +$650.00
            'Yellow Gold'     => 180000,  // +$1,800.00
            'Rose Gold'       => 195000,  // +$1,950.00
        ],
        'bezels' => [
            'Smooth Polished'             => 0,
            'Ceramic Tachymeter'          => 25000,  // +$250.00
            'Diver 60-Min Unidirectional' => 30000,  // +$300.00
            'Fluted Luxury'               => 40000,  // +$400.00
        ],
        'dials' => [
            'Midnight Obsidian'   => 0,
            'Silver Guilloche'    => 15000,  // +$150.00
            'Sunburst Royal Blue' => 20000,  // +$200.00
            'Emerald Forest'      => 25000,  // +$250.00
            'Champagne Gold'      => 35000,  // +$350.00
            'Skeleton Open-Heart' => 85000,  // +$850.00
        ],
        'hands' => [
            'Baton Luminous'   => 0,
            'Dauphine'         => 10000,  // +$100.00
            'Blued Steel Leaf' => 18000,  // +$180.00
            'Breguet Classic'  => 25000,  // +$250.00
        ],
        'straps' => [
            'Horween Calfskin'       => 0,
            'Vulcanized Rubber'      => 8000,   // +$80.00
            'Milanese Mesh'          => 16000,  // +$160.00
            'Stainless Steel Oyster' => 28000,  // +$280.00
            'Alligator Leather'      => 38000,  // +$380.00
        ],
        'movements' => [
            'Precision Quartz' => 0,
            'Quartz'           => 0,
            'Manual'           => 35000,   // +$350.00
            'Automatic'        => 45000,   // +$450.00
            'Tourbillon'       => 350000,  // +$3,500.00
        ],
        'engravingPriceInCents' => 5000,   // +$50.00
    ];

    public const PROMOTIONAL_COUPONS = [
        'HOROLOGY10' => ['type' => 'percentage', 'value' => 10], // 10% off
        'SWEBOK50'   => ['type' => 'fixed',      'value' => 5000], // $50.00 off
        'LUXURYVIP'  => ['type' => 'percentage', 'value' => 15], // 15% off
    ];

    public static function calculateCustomizationAddonsInCents(?array $config): int {
        if (!$config) return 0;

        $addons = 0;
        $rules = self::COMPONENT_PRICING_RULES;

        if (!empty($config['caseMaterial'])) {
            $addons += $rules['materials'][$config['caseMaterial']] ?? 0;
        }
        if (!empty($config['bezel'])) {
            $addons += $rules['bezels'][$config['bezel']] ?? 0;
        }
        if (!empty($config['dialColor'])) {
            $addons += $rules['dials'][$config['dialColor']] ?? 0;
        }
        if (!empty($config['hands'])) {
            $addons += $rules['hands'][$config['hands']] ?? 0;
        }
        if (!empty($config['strap'])) {
            $addons += $rules['straps'][$config['strap']] ?? 0;
        }
        if (!empty($config['movement'])) {
            $addons += $rules['movements'][$config['movement']] ?? 0;
        }
        if (!empty($config['engraving']) && trim((string)$config['engraving']) !== '') {
            $addons += $rules['engravingPriceInCents'];
        }

        return $addons;
    }

    public static function calculateItemUnitPriceInCents(int $basePriceInCents, ?array $customConfig): int {
        if ($basePriceInCents < 0) {
            throw new InvalidArgumentException('Base price cannot be negative');
        }
        return $basePriceInCents + self::calculateCustomizationAddonsInCents($customConfig);
    }

    public static function computeOrderPricingBreakdown(array $items, ?string $couponCode = null): array {
        if (empty($items)) {
            throw new InvalidArgumentException('Cannot calculate pricing for empty item list');
        }

        $baseTotalInCents = 0;
        $customizationAddonsInCents = 0;

        foreach ($items as $item) {
            $qty = (int)($item['quantity'] ?? 1);
            if ($qty <= 0) {
                throw new InvalidArgumentException("Invalid quantity {$qty}");
            }
            $basePrice = (int)$item['basePriceInCents'];
            $addon = self::calculateCustomizationAddonsInCents($item['customConfig'] ?? null);

            $baseTotalInCents += $basePrice * $qty;
            $customizationAddonsInCents += $addon * $qty;
        }

        $subtotalInCents = $baseTotalInCents + $customizationAddonsInCents;

        // Promotional Coupon Calculation
        $discountInCents = 0;
        $normalizedCoupon = null;

        if ($couponCode) {
            $cleanCode = strtoupper(trim($couponCode));
            if (isset(self::PROMOTIONAL_COUPONS[$cleanCode])) {
                $promo = self::PROMOTIONAL_COUPONS[$cleanCode];
                $normalizedCoupon = $cleanCode;

                if ($promo['type'] === 'percentage') {
                    $discountInCents = (int)round(($subtotalInCents * $promo['value']) / 100);
                } elseif ($promo['type'] === 'fixed') {
                    $discountInCents = min($promo['value'], $subtotalInCents);
                }
            }
        }

        $subtotalAfterDiscount = max(0, $subtotalInCents - $discountInCents);

        // Exact Integer 8% Tax
        $taxInCents = (int)round(($subtotalAfterDiscount * Config::$taxRatePercent) / 100);

        // Transparent Shipping Threshold
        $isFreeShipping = $subtotalAfterDiscount >= Config::$freeShippingThresholdCents;
        $shippingInCents = $isFreeShipping ? 0 : Config::$flatShippingCents;

        $finalTotalInCents = $subtotalAfterDiscount + $taxInCents + $shippingInCents;

        return [
            'baseTotalInCents'           => $baseTotalInCents,
            'customizationAddonsInCents' => $customizationAddonsInCents,
            'subtotalInCents'            => $subtotalInCents,
            'discountInCents'            => $discountInCents,
            'discountCodeApplied'        => $normalizedCoupon,
            'taxRatePercent'             => Config::$taxRatePercent,
            'taxInCents'                 => $taxInCents,
            'shippingInCents'            => $shippingInCents,
            'isFreeShipping'             => $isFreeShipping,
            'finalTotalInCents'          => $finalTotalInCents,
        ];
    }
}
