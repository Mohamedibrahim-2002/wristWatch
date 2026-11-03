<?php
/**
 * IEEE SWEBOK v4 Chapter 01 (Requirements) & Chapter 03 (Modular Design)
 * Watch Catalog & Customizer Controller
 */

declare(strict_types=1);

namespace WristWatch\Controllers;

use WristWatch\Config\Database;
use WristWatch\Services\PricingService;

class CatalogController {
    private static function formatWatchRow(array $row): array {
        return [
            'id'                     => $row['id'],
            'name'                   => $row['name'],
            'brand'                  => $row['brand'],
            'modelCode'              => $row['model_code'],
            'collection'             => $row['collection'],
            'description'            => $row['description'],
            'basePriceInCents'       => (int)$row['base_price_in_cents'],
            'movement'               => $row['movement'],
            'caseDiameterMm'         => (int)$row['case_diameter_mm'],
            'caseMaterial'           => $row['case_material'],
            'waterResistanceMeters'  => (int)$row['water_resistance_meters'],
            'dialColor'              => $row['dial_color'],
            'strapMaterial'          => $row['strap_material'],
            'stockQuantity'          => (int)$row['stock_quantity'],
            'imageUrl'               => $row['image_url'],
            'featured'               => (bool)$row['featured'],
            'specs'                  => [
                'powerReserveHours' => (int)$row['power_reserve_hours'],
                'jewelsCount'       => (int)$row['jewels_count'],
                'crystalType'       => $row['crystal_type'],
                'caseThicknessMm'   => (float)$row['case_thickness_mm'],
                'lugWidthMm'        => (int)$row['lug_width_mm'],
            ],
        ];
    }

    public static function listWatches(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $db = Database::getConnection();

        $query = 'SELECT * FROM `watches` WHERE 1=1';
        $params = [];

        if (!empty($_GET['movement'])) {
            $query .= ' AND LOWER(`movement`) = LOWER(:movement)';
            $params[':movement'] = $_GET['movement'];
        }

        if (!empty($_GET['caseDiameter'])) {
            $query .= ' AND `case_diameter_mm` = :diameter';
            $params[':diameter'] = (int)$_GET['caseDiameter'];
        }

        if (!empty($_GET['waterResistance'])) {
            $query .= ' AND `water_resistance_meters` >= :wr';
            $params[':wr'] = (int)$_GET['waterResistance'];
        }

        if (!empty($_GET['strap'])) {
            $query .= ' AND `strap_material` LIKE :strap';
            $params[':strap'] = '%' . $_GET['strap'] . '%';
        }

        if (!empty($_GET['search'])) {
            $query .= ' AND (`name` LIKE :search OR `brand` LIKE :search OR `collection` LIKE :search OR `model_code` LIKE :search)';
            $params[':search'] = '%' . $_GET['search'] . '%';
        }

        $sort = $_GET['sort'] ?? 'featured';
        if ($sort === 'price_asc') {
            $query .= ' ORDER BY `base_price_in_cents` ASC';
        } elseif ($sort === 'price_desc') {
            $query .= ' ORDER BY `base_price_in_cents` DESC';
        } else {
            $query .= ' ORDER BY `featured` DESC, `name` ASC';
        }

        $stmt = $db->prepare($query);
        $stmt->execute($params);
        $rows = $stmt->fetchAll();

        $watches = array_map([self::class, 'formatWatchRow'], $rows);

        echo json_encode([
            'success' => true,
            'data'    => $watches,
            'meta'    => [
                'count'     => count($watches),
                'timestamp' => date('c'),
            ],
        ]);
    }

    public static function getWatchById(string $id): void {
        header('Content-Type: application/json; charset=UTF-8');
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM `watches` WHERE `id` = :id LIMIT 1');
        $stmt->execute([':id' => $id]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error'   => ['code' => 'NOT_FOUND', 'message' => "Watch with ID '{$id}' was not found."],
            ]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data'    => self::formatWatchRow($row),
        ]);
    }

    public static function getCustomizerOptions(): void {
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => true,
            'data' => [
                'pricingRules' => PricingService::COMPONENT_PRICING_RULES,
                'options' => [
                    'materials' => ['Stainless Steel', 'Titanium', 'Ceramic', 'Yellow Gold', 'Rose Gold'],
                    'bezels'    => ['Smooth Polished', 'Fluted Luxury', 'Ceramic Tachymeter', 'Diver 60-Min Unidirectional'],
                    'dials'     => [
                        'Midnight Obsidian',
                        'Sunburst Royal Blue',
                        'Emerald Forest',
                        'Champagne Gold',
                        'Silver Guilloche',
                        'Skeleton Open-Heart',
                    ],
                    'hands'     => ['Dauphine', 'Baton Luminous', 'Breguet Classic', 'Blued Steel Leaf'],
                    'straps'    => [
                        'Horween Calfskin',
                        'Vulcanized Rubber',
                        'Milanese Mesh',
                        'Stainless Steel Oyster',
                        'Alligator Leather',
                    ],
                    'movements' => ['Automatic', 'Manual', 'Quartz', 'Tourbillon'],
                    'diameters' => [38, 39, 40, 41, 42, 44],
                ],
            ],
        ]);
    }

    public static function calculateCustomizerPrice(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $input = json_decode(file_get_contents('php://input'), true);
        $baseWatchId = $input['baseWatchId'] ?? '';
        $customConfig = $input['customConfig'] ?? null;
        $quantity = (int)($input['quantity'] ?? 1);
        $couponCode = $input['couponCode'] ?? null;

        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT `base_price_in_cents` FROM `watches` WHERE `id` = :id LIMIT 1');
        $stmt->execute([':id' => $baseWatchId]);
        $row = $stmt->fetch();

        if (!$row) {
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'error' => ['code' => 'WATCH_NOT_FOUND', 'message' => 'Base watch not found.'],
            ]);
            return;
        }

        $basePriceInCents = (int)$row['base_price_in_cents'];
        $unitPriceInCents = PricingService::calculateItemUnitPriceInCents($basePriceInCents, $customConfig);

        $breakdown = PricingService::computeOrderPricingBreakdown(
            [['basePriceInCents' => $basePriceInCents, 'customConfig' => $customConfig, 'quantity' => $quantity]],
            $couponCode
        );

        echo json_encode([
            'success' => true,
            'data' => [
                'unitPriceInCents' => $unitPriceInCents,
                'breakdown'        => $breakdown,
            ],
        ]);
    }
}

