<?php
/**
 * IEEE SWEBOK v4 Chapter 04 (Defensive Construction) & Chapter 13 (Threat Mitigation)
 * Order Processing Controller with MySQL ACID Transactions & Safe Rollback.
 */

declare(strict_types=1);

namespace WristWatch\Controllers;

use WristWatch\Config\Database;
use WristWatch\Middleware\AuthMiddleware;
use WristWatch\Services\PricingService;
use WristWatch\Services\PaymentGateway;
use Exception;
use PDO;

class OrderController {
    public static function checkout(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $input = json_decode(file_get_contents('php://input'), true);
        $user = AuthMiddleware::getAuthenticatedUser();

        $customerEmail = trim((string)($input['customerEmail'] ?? ''));
        $customerName = trim((string)($input['customerName'] ?? ''));
        $shippingAddress = $input['shippingAddress'] ?? [];
        $rawItems = $input['items'] ?? [];
        $couponCode = $input['couponCode'] ?? null;
        $paymentToken = trim((string)($input['paymentToken'] ?? ''));
        $cardLastFour = $input['cardLastFour'] ?? '4242';
        $cardBrand = $input['cardBrand'] ?? 'Visa';

        if (empty($rawItems)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => ['message' => 'Cart cannot be empty']]);
            return;
        }

        if (empty($paymentToken) || !str_starts_with($paymentToken, 'tok_')) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => ['message' => 'Invalid payment token format (PCI compliance)']]);
            return;
        }

        $db = Database::getConnection();

        try {
            // STEP 1: Two-Phase Commitment Phase 1 (Allocation & Lock)
            $db->beginTransaction();

            $verifiedItems = [];
            $pricingItems = [];

            foreach ($rawItems as $item) {
                $watchId = $item['watchId'];
                $qty = max(1, (int)($item['quantity'] ?? 1));
                $isCustom = !empty($item['isCustom']);
                $customConfig = $item['customConfig'] ?? null;

                // Lock row for update and check stock
                $stmt = $db->prepare('SELECT * FROM `watches` WHERE `id` = :id FOR UPDATE');
                $stmt->execute([':id' => $watchId]);
                $watch = $stmt->fetch();

                if (!$watch) {
                    throw new Exception("Watch reference {$watchId} does not exist");
                }

                if ((int)$watch['stock_quantity'] < $qty) {
                    throw new Exception("Insufficient inventory for {$watch['name']}. Requested: {$qty}, Available: {$watch['stock_quantity']}");
                }

                // Deduct inventory atomically
                $deductStmt = $db->prepare('UPDATE `watches` SET `stock_quantity` = `stock_quantity` - :qty WHERE `id` = :id');
                $deductStmt->execute([':qty' => $qty, ':id' => $watchId]);

                $basePrice = (int)$watch['base_price_in_cents'];
                $unitPrice = PricingService::calculateItemUnitPriceInCents($basePrice, $customConfig);
                $totalPrice = $unitPrice * $qty;

                $summary = "{$watch['brand']} - {$watch['name']}";
                if ($isCustom && $customConfig) {
                    $summary .= " [Customized: {$customConfig['caseMaterial']}, {$customConfig['dialColor']}, {$customConfig['strap']}]";
                }

                $verifiedItems[] = [
                    'id'                => 'item_' . time() . '_' . bin2hex(random_bytes(3)),
                    'watchId'           => $watchId,
                    'isCustom'          => $isCustom,
                    'customConfig'      => $customConfig,
                    'quantity'          => $qty,
                    'unitPriceInCents'  => $unitPrice,
                    'totalPriceInCents' => $totalPrice,
                    'watchSnapshot'     => [
                        'name'     => $watch['name'],
                        'brand'    => $watch['brand'],
                        'imageUrl' => $watch['image_url'],
                        'summary'  => $summary,
                    ],
                ];

                $pricingItems[] = [
                    'basePriceInCents' => $basePrice,
                    'customConfig'     => $customConfig,
                    'quantity'         => $qty,
                ];
            }

            // STEP 2: Compute Canonical Pricing Breakdown
            $pricing = PricingService::computeOrderPricingBreakdown($pricingItems, $couponCode);

            $orderNumber = 'WW-' . date('Y') . '-' . random_int(100000, 999999);
            $orderId = 'ord_' . time() . '_' . bin2hex(random_bytes(3));

            // STEP 3: Payment Gateway Charge
            $charge = PaymentGateway::chargeToken(
                $paymentToken,
                $pricing['finalTotalInCents'],
                $orderNumber,
                $customerEmail
            );

            if (!$charge['success']) {
                // SWEBOK v4 Ch. 04: Roll back inventory allocation to pre-order baseline!
                $db->rollBack();
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'error'   => ['code' => $charge['errorCode'], 'message' => $charge['errorMessage']],
                ]);
                return;
            }

            // STEP 4: Persist Order Record
            $trackingNumber = 'TRK-LUX-' . random_int(10000000, 99999999);

            $orderStmt = $db->prepare('
                INSERT INTO `orders` (
                    `id`, `order_number`, `user_id`, `customer_email`, `customer_name`,
                    `shipping_address`, `pricing`, `payment_gateway`, `payment_token_masked`,
                    `card_brand`, `card_last_four`, `payment_status`, `transaction_id`,
                    `order_status`, `tracking_number`, `created_at`
                ) VALUES (
                    :id, :num, :uid, :email, :name,
                    :address, :pricing, :gateway, :tokenMask,
                    :brand, :lastFour, "captured", :txId,
                    "processing", :trk, NOW()
                )
            ');

            $orderStmt->execute([
                ':id'        => $orderId,
                ':num'       => $orderNumber,
                ':uid'       => $user['userId'] ?? null,
                ':email'     => $customerEmail,
                ':name'      => $customerName,
                ':address'   => json_encode($shippingAddress),
                ':pricing'   => json_encode($pricing),
                ':gateway'   => $charge['gateway'],
                ':tokenMask' => substr($paymentToken, 0, 10) . '...',
                ':brand'     => $cardBrand,
                ':lastFour'  => $cardLastFour,
                ':txId'      => $charge['transactionId'],
                ':trk'       => $trackingNumber,
            ]);

            // Persist Order Items
            $itemStmt = $db->prepare('
                INSERT INTO `order_items` (
                    `id`, `order_id`, `watch_id`, `is_custom`, `custom_config`,
                    `quantity`, `unit_price_in_cents`, `total_price_in_cents`,
                    `watch_name`, `watch_brand`, `watch_image_url`
                ) VALUES (
                    :id, :ordId, :wid, :isCustom, :config,
                    :qty, :unitPrice, :totalPrice,
                    :name, :brand, :img
                )
            ');

            foreach ($verifiedItems as $v) {
                $itemStmt->execute([
                    ':id'         => $v['id'],
                    ':ordId'      => $orderId,
                    ':wid'        => $v['watchId'],
                    ':isCustom'   => $v['isCustom'] ? 1 : 0,
                    ':config'     => $v['customConfig'] ? json_encode($v['customConfig']) : null,
                    ':qty'        => $v['quantity'],
                    ':unitPrice'  => $v['unitPriceInCents'],
                    ':totalPrice' => $v['totalPriceInCents'],
                    ':name'       => $v['watchSnapshot']['name'],
                    ':brand'      => $v['watchSnapshot']['brand'],
                    ':img'        => $v['watchSnapshot']['imageUrl'],
                ]);
            }

            // Two-Phase Commitment Phase 2: Commit Transaction
            $db->commit();

            // Clear Cart Session
            $guestKey = $_COOKIE['wrist_guest_id'] ?? null;
            if ($guestKey) {
                $delCart = $db->prepare('DELETE FROM `cart_items` WHERE `session_key` = :key');
                $delCart->execute([':key' => $guestKey]);
            }
            if ($user) {
                $delCart = $db->prepare('DELETE FROM `cart_items` WHERE `session_key` = :key');
                $delCart->execute([':key' => 'usr_' . $user['userId']]);
            }

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data' => [
                    'id'             => $orderId,
                    'orderNumber'    => $orderNumber,
                    'customerEmail'  => $customerEmail,
                    'customerName'   => $customerName,
                    'items'          => $verifiedItems,
                    'pricing'        => $pricing,
                    'orderStatus'    => 'processing',
                    'trackingNumber' => $trackingNumber,
                    'createdAt'      => date('c'),
                ],
            ]);
        } catch (Exception $e) {
            if ($db->inTransaction()) {
                $db->rollBack();
            }
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => ['code' => 'CHECKOUT_FAILED', 'message' => $e->getMessage()],
            ]);
        }
    }

    public static function myOrders(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $user = AuthMiddleware::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT * FROM `orders` WHERE `user_id` = :uid ORDER BY `created_at` DESC');
        $stmt->execute([':uid' => $user['userId']]);
        $orders = $stmt->fetchAll();

        $results = [];
        foreach ($orders as $o) {
            $itemsStmt = $db->prepare('SELECT * FROM `order_items` WHERE `order_id` = :oid');
            $itemsStmt->execute([':oid' => $o['id']]);
            $items = $itemsStmt->fetchAll();

            $formattedItems = [];
            foreach ($items as $i) {
                $formattedItems[] = [
                    'id'                => $i['id'],
                    'watchId'           => $i['watch_id'],
                    'isCustom'          => (bool)$i['is_custom'],
                    'customConfig'      => $i['custom_config'] ? json_decode($i['custom_config'], true) : null,
                    'quantity'          => (int)$i['quantity'],
                    'unitPriceInCents'  => (int)$i['unit_price_in_cents'],
                    'totalPriceInCents' => (int)$i['total_price_in_cents'],
                    'watchSnapshot'     => [
                        'name'     => $i['watch_name'],
                        'brand'    => $i['watch_brand'],
                        'imageUrl' => $i['watch_image_url'],
                    ],
                ];
            }

            $results[] = [
                'id'             => $o['id'],
                'orderNumber'    => $o['order_number'],
                'customerEmail'  => $o['customer_email'],
                'customerName'   => $o['customer_name'],
                'items'          => $formattedItems,
                'pricing'        => json_decode($o['pricing'], true),
                'orderStatus'    => $o['order_status'],
                'trackingNumber' => $o['tracking_number'],
                'createdAt'      => $o['created_at'],
            ];
        }

        echo json_encode(['success' => true, 'data' => $results]);
    }
}
