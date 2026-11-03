<?php
/**
 * IEEE SWEBOK v4 - Unified Master Front Controller
 * Wrist Watch Web Application (100% PHP & MySQL Architecture)
 * Zero Node.js / Zero Express dependency required!
 */

declare(strict_types=1);

// Class Autoloader
spl_autoload_register(function ($class) {
    $prefix = 'WristWatch\\';
    $baseDir = __DIR__ . '/app/';

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

$requestUri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');

// Compute base directory path (supports running in XAMPP subdirectory e.g. /wristwatch/ or at root /)
$scriptDir = dirname($_SERVER['SCRIPT_NAME'] ?? '');
$scriptDir = str_replace('\\', '/', $scriptDir);
if ($scriptDir === '/') $scriptDir = '';
$basePath = rtrim($scriptDir, '/');

// Relative path inside this application
$relPath = $requestUri;
if ($basePath !== '' && str_starts_with($relPath, $basePath)) {
    $relPath = substr($relPath, strlen($basePath));
}
if ($relPath === '' || $relPath === false) $relPath = '/';

// ---------------------------------------------------------------------
// 1. STATIC ASSET SERVING (CSS, JS, Fonts, Images)
// ---------------------------------------------------------------------
if (preg_match('#^/assets/(.+\.(js|css|png|jpg|jpeg|svg|woff2?|ttf))$#i', $relPath, $matches)) {
    $assetPath = __DIR__ . '/public/assets/' . $matches[1];
    if (file_exists($assetPath)) {
        $ext = strtolower(pathinfo($assetPath, PATHINFO_EXTENSION));
        $mimes = [
            'js'    => 'application/javascript; charset=UTF-8',
            'css'   => 'text/css; charset=UTF-8',
            'svg'   => 'image/svg+xml',
            'png'   => 'image/png',
            'jpg'   => 'image/jpeg',
            'jpeg'  => 'image/jpeg',
            'woff'  => 'font/woff',
            'woff2' => 'font/woff2',
            'ttf'   => 'font/ttf',
        ];
        header('Content-Type: ' . ($mimes[$ext] ?? 'application/octet-stream'));
        header('Cache-Control: public, max-age=31536000, immutable');
        readfile($assetPath);
        exit;
    }
}

// ---------------------------------------------------------------------
// 2. REST API ROUTING (/api/...)
// ---------------------------------------------------------------------
if (str_starts_with($relPath, '/api')) {
    SecurityHeaders::apply();

    try {
        // Health & SWEBOK Verification
        if ($relPath === '/api/health' && $method === 'GET') {
            HealthController::check();
            exit;
        }

        // Catalog & Customizer
        if ($relPath === '/api/catalog' && $method === 'GET') {
            CatalogController::listWatches();
            exit;
        }

        if ($relPath === '/api/catalog/customizer/options' && $method === 'GET') {
            CatalogController::getCustomizerOptions();
            exit;
        }

        if ($relPath === '/api/catalog/customizer/price' && $method === 'POST') {
            CatalogController::calculateCustomizerPrice();
            exit;
        }

        if (preg_match('#^/api/catalog/([a-zA-Z0-9_\-]+)$#', $relPath, $matches) && $method === 'GET') {
            CatalogController::getWatchById($matches[1]);
            exit;
        }

        // Cart
        if ($relPath === '/api/cart' && $method === 'GET') {
            CartController::getCart();
            exit;
        }

        if ($relPath === '/api/cart/add' && $method === 'POST') {
            CartController::addToCart();
            exit;
        }

        if (preg_match('#^/api/cart/([a-zA-Z0-9_\-]+)$#', $relPath, $matches)) {
            if ($method === 'PATCH' || $method === 'POST') {
                CartController::updateQuantity($matches[1]);
                exit;
            } elseif ($method === 'DELETE') {
                CartController::removeFromCart($matches[1]);
                exit;
            }
        }

        if ($relPath === '/api/cart' && $method === 'DELETE') {
            CartController::clearCart();
            exit;
        }

        // Orders & Checkout
        if ($relPath === '/api/orders/checkout' && $method === 'POST') {
            OrderController::checkout();
            exit;
        }

        if ($relPath === '/api/orders/my-orders' && $method === 'GET') {
            OrderController::myOrders();
            exit;
        }

        // Auth & GDPR
        if ($relPath === '/api/auth/register' && $method === 'POST') {
            AuthController::register();
            exit;
        }

        if ($relPath === '/api/auth/login' && $method === 'POST') {
            AuthController::login();
            exit;
        }

        if ($relPath === '/api/auth/me' && $method === 'GET') {
            AuthController::me();
            exit;
        }

        if ($relPath === '/api/auth/logout' && $method === 'POST') {
            AuthController::logout();
            exit;
        }

        if ($relPath === '/api/auth/gdpr/export' && $method === 'GET') {
            AuthController::exportGdpr();
            exit;
        }

        if ($relPath === '/api/auth/gdpr/delete' && $method === 'DELETE') {
            AuthController::deleteGdpr();
            exit;
        }

        if ($relPath === '/api/auth/gdpr/consent' && $method === 'POST') {
            AuthController::updateConsent();
            exit;
        }

        // Admin (RBAC Protected)
        if ($relPath === '/api/admin/inventory' && $method === 'GET') {
            AdminController::getInventory();
            exit;
        }

        if (preg_match('#^/api/admin/inventory/([a-zA-Z0-9_\-]+)$#', $relPath, $matches) && ($method === 'PATCH' || $method === 'POST')) {
            AdminController::updateInventory($matches[1]);
            exit;
        }

        if ($relPath === '/api/admin/orders' && $method === 'GET') {
            AdminController::getOrders();
            exit;
        }

        if (preg_match('#^/api/admin/orders/([a-zA-Z0-9_\-]+)/status$#', $relPath, $matches) && ($method === 'PATCH' || $method === 'POST')) {
            AdminController::updateOrderStatus($matches[1]);
            exit;
        }

        // API 404
        http_response_code(404);
        echo json_encode([
            'success' => false,
            'error'   => ['code' => 'ENDPOINT_NOT_FOUND', 'message' => "Route '{$relPath}' does not exist."],
        ]);
        exit;
    } catch (\Throwable $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error'   => [
                'code'    => 'INTERNAL_SERVER_ERROR',
                'message' => 'An internal server exception occurred.',
            ],
        ]);
        exit;
    }
}

// ---------------------------------------------------------------------
// 3. MAIN WEB APPLICATION UI (PHP Served)
// ---------------------------------------------------------------------
// Determine correct asset prefix for running in root or subdirectory
$assetPrefix = $basePath . '/assets';

?>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>AETHEL & KRONOS | Haute Horlogerie & Bespoke Timepieces (PHP & MySQL)</title>
    <meta name="description" content="Masterpiece wrist watches and interactive bespoke 2D configurator engineered under IEEE SWEBOK v4 security standards in PHP & MySQL." />
    <!-- Luxury Typography Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <link rel="stylesheet" crossorigin href="<?= htmlspecialchars($assetPrefix) ?>/index-DRQG0K5B.css">
    <script type="module" crossorigin src="<?= htmlspecialchars($assetPrefix) ?>/index-xkUZ-plk.js"></script>
  </head>
  <body class="bg-luxury-950 text-slate-100 antialiased selection:bg-luxury-gold selection:text-black">
    <div id="root"></div>
  </body>
</html>

