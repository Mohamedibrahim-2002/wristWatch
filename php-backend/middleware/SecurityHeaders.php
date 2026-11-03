<?php
/**
 * IEEE SWEBOK v4 Chapter 13 - Secure Headers & CORS Policy Middleware
 */

declare(strict_types=1);

namespace WristWatch\Middleware;

use WristWatch\Config\Config;

class SecurityHeaders {
    public static function apply(): void {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';

        if (in_array($origin, Config::$allowedOrigins, true)) {
            header("Access-Control-Allow-Origin: {$origin}");
            header('Access-Control-Allow-Credentials: true');
        } elseif (empty($origin)) {
            header('Access-Control-Allow-Origin: *');
        }

        header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Content-Type: application/json; charset=UTF-8');
        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: DENY');
        header('X-XSS-Protection: 1; mode=block');

        // Handle CORS preflight
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit;
        }
    }
}
