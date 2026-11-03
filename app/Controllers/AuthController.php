<?php
/**
 * IEEE SWEBOK v4 Chapter 13 & 14 - Authentication & Privacy Controller
 */

declare(strict_types=1);

namespace WristWatch\Controllers;

use WristWatch\Config\Database;
use WristWatch\Services\AuthService;
use WristWatch\Middleware\AuthMiddleware;
use Exception;

class AuthController {
    public static function register(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $fullName = $input['fullName'] ?? '';
        $password = $input['password'] ?? '';

        try {
            $result = AuthService::register($email, $fullName, $password);

            setcookie('wrist_auth_token', $result['token'], [
                'expires'  => time() + 86400,
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'data'    => $result,
            ]);
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'error'   => ['code' => 'REGISTRATION_FAILED', 'message' => $e->getMessage()],
            ]);
        }
    }

    public static function login(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $input = json_decode(file_get_contents('php://input'), true);
        $email = $input['email'] ?? '';
        $password = $input['password'] ?? '';

        try {
            $result = AuthService::login($email, $password);

            setcookie('wrist_auth_token', $result['token'], [
                'expires'  => time() + 86400,
                'path'     => '/',
                'httponly' => true,
                'samesite' => 'Lax',
            ]);

            echo json_encode([
                'success' => true,
                'data'    => $result,
            ]);
        } catch (Exception $e) {
            http_response_code(401);
            echo json_encode([
                'success' => false,
                'error'   => ['code' => 'INVALID_CREDENTIALS', 'message' => $e->getMessage()],
            ]);
        }
    }

    public static function me(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $user = AuthMiddleware::requireAuth();
        $db = Database::getConnection();

        $stmt = $db->prepare('SELECT `id`, `email`, `full_name`, `role`, `created_at` FROM `users` WHERE `id` = :id LIMIT 1');
        $stmt->execute([':id' => $user['userId']]);
        $profile = $stmt->fetch();

        if (!$profile) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => ['message' => 'User not found']]);
            return;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'id'       => $profile['id'],
                'email'    => $profile['email'],
                'fullName' => $profile['full_name'],
                'role'     => $profile['role'],
            ],
        ]);
    }

    public static function logout(): void {
        header('Content-Type: application/json; charset=UTF-8');
        setcookie('wrist_auth_token', '', [
            'expires'  => time() - 3600,
            'path'     => '/',
            'httponly' => true,
            'samesite' => 'Lax',
        ]);
        echo json_encode(['success' => true, 'message' => 'Logged out successfully']);
    }

    public static function exportGdpr(): void {
        $user = AuthMiddleware::requireAuth();

        try {
            $data = AuthService::exportUserData($user['userId']);
            header('Content-Type: application/json; charset=UTF-8');
            header('Content-Disposition: attachment; filename="gdpr-export-' . $user['userId'] . '.json"');
            echo json_encode($data, JSON_PRETTY_PRINT);
        } catch (Exception $e) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
            echo json_encode(['success' => false, 'error' => ['message' => $e->getMessage()]]);
        }
    }

    public static function deleteGdpr(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $user = AuthMiddleware::requireAuth();

        try {
            $success = AuthService::deleteUserData($user['userId']);
            if (!$success) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => ['message' => 'Unable to erase account']]);
                return;
            }

            self::logout();
        } catch (Exception $e) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => ['message' => $e->getMessage()]]);
        }
    }

    public static function updateConsent(): void {
        header('Content-Type: application/json; charset=UTF-8');
        $user = AuthMiddleware::requireAuth();
        $input = json_decode(file_get_contents('php://input'), true);

        $db = Database::getConnection();
        $stmt = $db->prepare('
            INSERT INTO `user_consents` (`user_id`, `necessary_cookies`, `analytics_cookies`, `marketing_cookies`, `consented_at`)
            VALUES (:uid, 1, :analytics, :marketing, NOW())
            ON DUPLICATE KEY UPDATE `analytics_cookies` = :analytics, `marketing_cookies` = :marketing, `consented_at` = NOW()
        ');
        $stmt->execute([
            ':uid'       => $user['userId'],
            ':analytics' => !empty($input['analyticsCookies']) ? 1 : 0,
            ':marketing' => !empty($input['marketingCookies']) ? 1 : 0,
        ]);

        echo json_encode(['success' => true, 'message' => 'Consent preferences updated']);
    }
}

