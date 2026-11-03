<?php
/**
 * IEEE SWEBOK v4 Front Controller & Router
 * Wrist Watch Web Application (PHP & MySQL Backend)
 */

declare(strict_types=1);

// Autoload application classes
spl_autoload_register(function ($class) {
    $prefix = 'WristWatch\\';
    $baseDir = __DIR__ . '/';

    $len = strlen($prefix);
    if (strncmp($prefix, $class, $len) !== 0) {
        return;
    }

    $relativeClass = substr($class, $len);
    $file = $baseDir . str_replace('\\', '/', $relativeClass) . '.php';

    if (file_exists($file)) {
        require $file;
    }
});

use WristWatch\Middleware\SecurityHeaders;
use WristWatch\Controllers\CatalogController;
use WristWatch\Controllers\CartController;
use WristWatch\Controllers\OrderController;
use WristWatch\Controllers\AuthController;
use WristWatch\Controllers\AdminController;
use WristWatch\Controllers\HealthController;

// Apply Security & CORS Headers
SecurityHeaders::apply();

// Parse Request URI & Method
$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Normalize URI (remove base directory if running in subdirectory like /wristWatch/php-backend/...)
$normalizedUri = preg_replace('#^.*?/api#', '/api', $requestUri);

try {
    // --- HEALTH ---
    if ($normalizedUri === '/api/health' && $method === 'GET') {
        HealthController::check();
        exit;
    }

    // --- CATALOG & CUSTOMIZER ---
    if ($normalizedUri === '/api/catalog' && $method === 'GET') {
        CatalogController::listWatches();
        exit;
    }

    if ($normalizedUri === '/api/catalog/customizer/options' && $method === 'GET') {
        CatalogController::getCustomizerOptions();
        exit;
    }

    if ($normalizedUri === '/api/catalog/customizer/price' && $method === 'POST') {
        CatalogController::calculateCustomizerPrice();
        exit;
    }

    if (preg_match('#^/api/catalog/([a-zA-Z0-9_\-]+)$#', $normalizedUri, $matches) && $method === 'GET') {
        CatalogController::getWatchById($matches[1]);
        exit;
    }

    // --- CART ---
    if ($normalizedUri === '/api/cart' && $method === 'GET') {
        CartController::getCart();
        exit;
    }

    if ($normalizedUri === '/api/cart/add' && $method === 'POST') {
        CartController::addToCart();
        exit;
    }

    if (preg_match('#^/api/cart/([a-zA-Z0-9_\-]+)$#', $normalizedUri, $matches)) {
        if ($method === 'PATCH' || $method === 'POST') {
            CartController::updateQuantity($matches[1]);
            exit;
        } elseif ($method === 'DELETE') {
            CartController::removeFromCart($matches[1]);
            exit;
        }
    }

    if ($normalizedUri === '/api/cart' && $method === 'DELETE') {
        CartController::clearCart();
        exit;
    }

    // --- ORDERS & CHECKOUT ---
    if ($normalizedUri === '/api/orders/checkout' && $method === 'POST') {
        OrderController::checkout();
        exit;
    }

    if ($normalizedUri === '/api/orders/my-orders' && $method === 'GET') {
        OrderController::myOrders();
        exit;
    }

    // --- AUTH & GDPR ---
    if ($normalizedUri === '/api/auth/register' && $method === 'POST') {
        AuthController::register();
        exit;
    }

    if ($normalizedUri === '/api/auth/login' && $method === 'POST') {
        AuthController::login();
        exit;
    }

    if ($normalizedUri === '/api/auth/me' && $method === 'GET') {
        AuthController::me();
        exit;
    }

    if ($normalizedUri === '/api/auth/logout' && $method === 'POST') {
        AuthController::logout();
        exit;
    }

    if ($normalizedUri === '/api/auth/gdpr/export' && $method === 'GET') {
        AuthController::exportGdpr();
        exit;
    }

    if ($normalizedUri === '/api/auth/gdpr/delete' && $method === 'DELETE') {
        AuthController::deleteGdpr();
        exit;
    }

    if ($normalizedUri === '/api/auth/gdpr/consent' && $method === 'POST') {
        AuthController::updateConsent();
        exit;
    }

    // --- ADMIN (RBAC Protected) ---
    if ($normalizedUri === '/api/admin/inventory' && $method === 'GET') {
        AdminController::getInventory();
        exit;
    }

    if (preg_match('#^/api/admin/inventory/([a-zA-Z0-9_\-]+)$#', $normalizedUri, $matches) && ($method === 'PATCH' || $method === 'POST')) {
        AdminController::updateInventory($matches[1]);
        exit;
    }

    if ($normalizedUri === '/api/admin/orders' && $method === 'GET') {
        AdminController::getOrders();
        exit;
    }

    if (preg_match('#^/api/admin/orders/([a-zA-Z0-9_\-]+)/status$#', $normalizedUri, $matches) && ($method === 'PATCH' || $method === 'POST')) {
        AdminController::updateOrderStatus($matches[1]);
        exit;
    }

    // 404 Not Found
    http_response_code(404);
    echo json_encode([
        'success' => false,
        'error'   => ['code' => 'ENDPOINT_NOT_FOUND', 'message' => "Route '{$requestUri}' does not exist."],
    ]);
} catch (\Throwable $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error'   => [
            'code'    => 'INTERNAL_SERVER_ERROR',
            'message' => 'An internal server exception occurred.',
        ],
    ]);
}
