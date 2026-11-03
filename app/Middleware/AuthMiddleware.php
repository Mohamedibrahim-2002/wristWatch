<?php
/**
 * IEEE SWEBOK v4 Chapter 13 - Role-Based Access Control (RBAC) & Default Deny
 */

declare(strict_types=1);

namespace WristWatch\Middleware;

use WristWatch\Services\AuthService;

class AuthMiddleware {
    public static function getAuthenticatedUser(): ?array {
        $token = null;

        $headers = function_exists('getallheaders') ? getallheaders() : [];
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? $_SERVER['HTTP_AUTHORIZATION'] ?? '';

        if (str_starts_with($authHeader, 'Bearer ')) {
            $token = substr($authHeader, 7);
        } elseif (!empty($_COOKIE['wrist_auth_token'])) {
            $token = $_COOKIE['wrist_auth_token'];
        }

        if (!$token) return null;

        return AuthService::verifyToken($token);
    }

    public static function requireAuth(): array {
        $user = self::getAuthenticatedUser();
        if (!$user) {
            http_response_code(401);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'error' => [
                    'code' => 'UNAUTHORIZED',
                    'message' => 'Authentication token required to access this resource.',
                ],
            ]);
            exit;
        }
        return $user;
    }

    public static function requireAdmin(): array {
        $user = self::requireAuth();
        if ($user['role'] !== 'admin') {
            http_response_code(403);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode([
                'success' => false,
                'error' => [
                    'code' => 'FORBIDDEN',
                    'message' => 'Access denied: Administrative privileges required.',
                ],
            ]);
            exit;
        }
        return $user;
    }
}

