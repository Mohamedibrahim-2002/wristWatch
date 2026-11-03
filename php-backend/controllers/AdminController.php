<?php
/**
 * IEEE SWEBOK v4 Chapter 13 - Admin RBAC Protected Inventory & Order Management
 */

declare(strict_types=1);

namespace WristWatch\Controllers;

use WristWatch\Config\Database;
use WristWatch\Middleware\AuthMiddleware;
use PDO;

class AdminController {
    public static function getInventory(): void {
        AuthMiddleware::requireAdmin();
        $db = Database::getConnection();

        $stmt = $db->query('SELECT * FROM `watches` ORDER BY `name` ASC');
        $rows = $stmt->fetchAll();

        $items = [];
        $totalUnits = 0;
        $lowStockCount = 0;

        foreach ($rows as $r) {
            $stock = (int)$r['stock_quantity'];
            $totalUnits += $stock;
            if ($stock <= 5) $lowStockCount++;

            $items[] = [
                'id'                     => $r['id'],
                'name'                   => $r['name'],
                'brand'                  => $r['brand'],
                'modelCode'              => $r['model_code'],
                'collection'             => $r['collection'],
                'basePriceInCents'       => (int)$r['base_price_in_cents'],
                'movement'               => $r['movement'],
                'caseDiameterMm'         => (int)$r['case_diameter_mm'],
                'stockQuantity'          => $stock,
                'imageUrl'               => $r['image_url'],
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'items' => $items,
                'metrics' => [
                    'totalProducts'      => count($items),
                    'totalStockUnits'    => $totalUnits,
                    'lowStockAlertCount' => $lowStockCount,
                ],
            ],
        ]);
    }

    public static function updateInventory(string $watchId): void {
        AuthMiddleware::requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);

        $stock = isset($input['stockQuantity']) ? (int)$input['stockQuantity'] : null;
        $basePrice = isset($input['basePriceInCents']) ? (int)$input['basePriceInCents'] : null;

        $db = Database::getConnection();

        if ($stock !== null) {
            $stmt = $db->prepare('UPDATE `watches` SET `stock_quantity` = :stock WHERE `id` = :id');
            $stmt->execute([':stock' => max(0, $stock), ':id' => $watchId]);
        }

        if ($basePrice !== null && $basePrice >= 1000) {
            $stmt = $db->prepare('UPDATE `watches` SET `base_price_in_cents` = :price WHERE `id` = :id');
            $stmt->execute([':price' => $basePrice, ':id' => $watchId]);
        }

        echo json_encode(['success' => true, 'message' => 'Inventory updated successfully']);
    }

    public static function getOrders(): void {
        AuthMiddleware::requireAdmin();
        $db = Database::getConnection();

        $stmt = $db->query('SELECT * FROM `orders` ORDER BY `created_at` DESC');
        $orders = $stmt->fetchAll();

        $totalRevenue = 0;
        $formatted = [];

        foreach ($orders as $o) {
            $pricing = json_decode($o['pricing'], true);
            $totalRevenue += (int)($pricing['finalTotalInCents'] ?? 0);

            $formatted[] = [
                'id'             => $o['id'],
                'orderNumber'    => $o['order_number'],
                'customerEmail'  => $o['customer_email'],
                'customerName'   => $o['customer_name'],
                'pricing'        => $pricing,
                'orderStatus'    => $o['order_status'],
                'trackingNumber' => $o['tracking_number'],
                'createdAt'      => $o['created_at'],
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'orders'  => $formatted,
                'metrics' => [
                    'totalOrders'         => count($formatted),
                    'totalRevenueInCents' => $totalRevenue,
                ],
            ],
        ]);
    }

    public static function updateOrderStatus(string $orderId): void {
        AuthMiddleware::requireAdmin();
        $input = json_decode(file_get_contents('php://input'), true);
        $status = $input['status'] ?? 'processing';
        $tracking = $input['trackingNumber'] ?? null;

        $validStatuses = ['processing', 'assembling', 'quality_check', 'shipped', 'delivered', 'cancelled'];
        if (!in_array($status, $validStatuses, true)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => ['message' => 'Invalid order status value']]);
            return;
        }

        $db = Database::getConnection();
        $query = 'UPDATE `orders` SET `order_status` = :st';
        $params = [':st' => $status, ':id' => $orderId];

        if ($tracking) {
            $query .= ', `tracking_number` = :trk';
            $params[':trk'] = $tracking;
        }
        $query .= ' WHERE `id` = :id';

        $stmt = $db->prepare($query);
        $stmt->execute($params);

        echo json_encode(['success' => true, 'message' => "Order {$orderId} updated to {$status}"]);
    }
}
