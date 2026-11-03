<?php
/**
 * IEEE SWEBOK v4 Chapter 03 & 13 - Cart Operations with MySQL Persistence & Price Recalculation
 */

declare(strict_types=1);

namespace WristWatch\Controllers;

use WristWatch\Config\Database;
use WristWatch\Middleware\AuthMiddleware;
use WristWatch\Services\PricingService;

class CartController {
    private static function getSessionKey(): string {
        $user = AuthMiddleware::getAuthenticatedUser();
        if ($user) {
            return 'usr_' . $user['userId'];
        }

        $guestId = $_COOKIE['wrist_guest_id'] ?? null;
        if (!$guestId) {
            $guestId = 'guest_' . bin2hex(random_bytes(6));
            setcookie('wrist_guest_id', $guestId, [
                'expires'  => time() + 7 * 86400,
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);
        }
        return $guestId;
    }

    public static function getCart(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $sessionKey = self::getSessionKey();
        $db = Database::getConnection();

        $stmt = $db->prepare('
            SELECT c.*, w.name, w.brand, w.image_url, w.base_price_in_cents
            FROM `cart_items` c
            JOIN `watches` w ON c.watch_id = w.id
            WHERE c.session_key = :key
            ORDER BY c.updated_at ASC
        ');
        $stmt->execute([':key' => $sessionKey]);
        $rows = $stmt->fetchAll();

        $items = [];
        $pricingItems = [];

        foreach ($rows as $r) {
            $customConfig = $r['custom_config'] ? json_decode($r['custom_config'], true) : null;
            $basePrice = (int)$r['base_price_in_cents'];
            $unitPrice = PricingService::calculateItemUnitPriceInCents($basePrice, $customConfig);
            $qty = (int)$r['quantity'];

            $summary = "{$r['brand']} - {$r['name']}";
            if ($r['is_custom'] && $customConfig) {
                $summary .= " [Customized: {$customConfig['caseMaterial']}, {$customConfig['dialColor']}, {$customConfig['strap']}]";
            }

            $items[] = [
                'id'                => $r['id'],
                'watchId'           => $r['watch_id'],
                'isCustom'          => (bool)$r['is_custom'],
                'customConfig'      => $customConfig,
                'quantity'          => $qty,
                'unitPriceInCents'  => $unitPrice,
                'totalPriceInCents' => $unitPrice * $qty,
                'watchSnapshot'     => [
                    'name'     => $r['name'],
                    'brand'    => $r['brand'],
                    'imageUrl' => $r['image_url'],
                    'summary'  => $summary,
                ],
            ];

            $pricingItems[] = [
                'basePriceInCents' => $basePrice,
                'customConfig'     => $customConfig,
                'quantity'         => $qty,
            ];
        }

        $coupon = $_GET['coupon'] ?? null;
        $breakdown = !empty($pricingItems) ? PricingService::computeOrderPricingBreakdown($pricingItems, $coupon) : null;

        echo json_encode([
            'success' => true,
            'data' => [
                'items'     => $items,
                'itemCount' => array_sum(array_column($items, 'quantity')),
                'breakdown' => $breakdown,
            ],
        ]);
    }

    public static function addToCart(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $sessionKey = self::getSessionKey();
        $input = json_decode(file_get_contents('php://input'), true);

        $watchId = $input['watchId'] ?? '';
        $isCustom = !empty($input['isCustom']);
        $customConfig = $input['customConfig'] ?? null;
        $quantity = max(1, (int)($input['quantity'] ?? 1));

        $db = Database::getConnection();

        // Verify watch exists
        $wStmt = $db->prepare('SELECT `id` FROM `watches` WHERE `id` = :id LIMIT 1');
        $wStmt->execute([':id' => $watchId]);
        if (!$wStmt->fetch()) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => ['message' => 'Watch not found']]);
            return;
        }

        // Check if non-custom item already in cart
        if (!$isCustom) {
            $existStmt = $db->prepare('SELECT `id`, `quantity` FROM `cart_items` WHERE `session_key` = :key AND `watch_id` = :wid AND `is_custom` = 0 LIMIT 1');
            $existStmt->execute([':key' => $sessionKey, ':wid' => $watchId]);
            $existing = $existStmt->fetch();

            if ($existing) {
                $newQty = (int)$existing['quantity'] + $quantity;
                $upStmt = $db->prepare('UPDATE `cart_items` SET `quantity` = :qty WHERE `id` = :id');
                $upStmt->execute([':qty' => $newQty, ':id' => $existing['id']]);

                self::getCart();
                return;
            }
        }

        $cartId = 'item_' . time() . '_' . bin2hex(random_bytes(3));
        $insStmt = $db->prepare('
            INSERT INTO `cart_items` (`id`, `session_key`, `watch_id`, `is_custom`, `custom_config`, `quantity`)
            VALUES (:id, :key, :wid, :isCustom, :config, :qty)
        ');
        $insStmt->execute([
            ':id'       => $cartId,
            ':key'      => $sessionKey,
            ':wid'      => $watchId,
            ':isCustom' => $isCustom ? 1 : 0,
            ':config'   => $customConfig ? json_encode($customConfig) : null,
            ':qty'      => $quantity,
        ]);

        http_response_code(201);
        self::getCart();
    }

    public static function updateQuantity(string $itemId): void {
        header('Content-Type: application/json; charset=UTF-8');
        $sessionKey = self::getSessionKey();
        $input = json_decode(file_get_contents('php://input'), true);
        $quantity = (int)($input['quantity'] ?? 1);

        $db = Database::getConnection();

        if ($quantity <= 0) {
            $delStmt = $db->prepare('DELETE FROM `cart_items` WHERE `id` = :id AND `session_key` = :key');
            $delStmt->execute([':id' => $itemId, ':key' => $sessionKey]);
        } else {
            $upStmt = $db->prepare('UPDATE `cart_items` SET `quantity` = :qty WHERE `id` = :id AND `session_key` = :key');
            $upStmt->execute([':qty' => $quantity, ':id' => $itemId, ':key' => $sessionKey]);
        }

        self::getCart();
    }

    public static function removeFromCart(string $itemId): void {
        header('Content-Type: application/json; charset=UTF-8');
        $sessionKey = self::getSessionKey();
        $db = Database::getConnection();
        $delStmt = $db->prepare('DELETE FROM `cart_items` WHERE `id` = :id AND `session_key` = :key');
        $delStmt->execute([':id' => $itemId, ':key' => $sessionKey]);

        self::getCart();
    }

    public static function clearCart(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $sessionKey = self::getSessionKey();
        $db = Database::getConnection();
        $delStmt = $db->prepare('DELETE FROM `cart_items` WHERE `session_key` = :key');
        $delStmt->execute([':key' => $sessionKey]);

        echo json_encode(['success' => true, 'message' => 'Cart cleared']);
    }
}
