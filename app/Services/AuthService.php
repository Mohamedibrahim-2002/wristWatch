<?php
/**
 * IEEE SWEBOK v4 Chapter 13 & 14 - Authentication & Privacy Service
 */

declare(strict_types=1);

namespace WristWatch\Services;

use WristWatch\Config\Config;
use WristWatch\Config\Database;
use PDO;
use Exception;

class AuthService {
    public static function generateToken(array $user): string {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload = json_encode([
            'userId'   => $user['id'],
            'email'    => $user['email'],
            'role'     => $user['role'],
            'fullName' => $user['full_name'],
            'exp'      => time() + Config::$jwtExpiresInSeconds,
            'iat'      => time(),
        ]);

        $base64Header = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64Payload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, Config::$jwtSecret, true);
        $base64Signature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
    }

    public static function verifyToken(string $token): ?array {
        $parts = explode('.', $token);
        if (count($parts) !== 3) return null;

        [$header64, $payload64, $signature64] = $parts;

        $expectedSig = hash_hmac('sha256', $header64 . '.' . $payload64, Config::$jwtSecret, true);
        $expectedSig64 = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($expectedSig));

        if (!hash_equals($expectedSig64, $signature64)) {
            return null;
        }

        $payload = json_decode(base64_decode(str_replace(['-', '_'], ['+', '/'], $payload64)), true);
        if (!$payload || !isset($payload['exp']) || $payload['exp'] < time()) {
            return null;
        }

        return $payload;
    }

    public static function login(string $email, string $password): array {
        $db = Database::getConnection();
        $stmt = $db->prepare('SELECT * FROM `users` WHERE `email` = :email LIMIT 1');
        $stmt->execute([':email' => strtolower(trim($email))]);
        $user = $stmt->fetch();

        if (!$user || !password_verify($password, $user['password_hash'])) {
            password_verify($password, '$2y$10$dummyhashforconstanttimingdefense00000000000000000000000');
            throw new Exception('Invalid email or password');
        }

        $updateStmt = $db->prepare('UPDATE `users` SET `last_login_at` = NOW() WHERE `id` = :id');
        $updateStmt->execute([':id' => $user['id']]);

        $token = self::generateToken($user);
        unset($user['password_hash']);

        return [
            'user' => [
                'id'       => $user['id'],
                'email'    => $user['email'],
                'fullName' => $user['full_name'],
                'role'     => $user['role'],
            ],
            'token' => $token,
        ];
    }

    public static function register(string $email, string $fullName, string $password): array {
        $db = Database::getConnection();

        $checkStmt = $db->prepare('SELECT `id` FROM `users` WHERE `email` = :email LIMIT 1');
        $checkStmt->execute([':email' => strtolower(trim($email))]);
        if ($checkStmt->fetch()) {
            throw new Exception('An account with this email address already exists');
        }

        if (strlen($password) < 8 || !preg_match('/[A-Z]/', $password) || !preg_match('/[0-9]/', $password)) {
            throw new Exception('Password must be at least 8 characters with at least one uppercase letter and one number');
        }

        $userId = 'usr_' . time() . '_' . bin2hex(random_bytes(3));
        $hash = password_hash($password, PASSWORD_BCRYPT, ['cost' => 10]);

        $insertStmt = $db->prepare('
            INSERT INTO `users` (`id`, `email`, `full_name`, `role`, `password_hash`, `created_at`)
            VALUES (:id, :email, :fullName, "customer", :hash, NOW())
        ');
        $insertStmt->execute([
            ':id'       => $userId,
            ':email'    => strtolower(trim($email)),
            ':fullName' => trim($fullName),
            ':hash'     => $hash,
        ]);

        $consentStmt = $db->prepare('
            INSERT INTO `user_consents` (`user_id`, `necessary_cookies`, `analytics_cookies`, `marketing_cookies`, `consented_at`)
            VALUES (:userId, 1, 0, 0, NOW())
        ');
        $consentStmt->execute([':userId' => $userId]);

        $userData = [
            'id'        => $userId,
            'email'     => strtolower(trim($email)),
            'full_name' => trim($fullName),
            'role'      => 'customer',
        ];

        $token = self::generateToken($userData);

        return [
            'user' => [
                'id'       => $userId,
                'email'    => strtolower(trim($email)),
                'fullName' => trim($fullName),
                'role'     => 'customer',
            ],
            'token' => $token,
        ];
    }

    public static function exportUserData(string $userId): array {
        $db = Database::getConnection();

        $userStmt = $db->prepare('SELECT `id`, `email`, `full_name`, `role`, `created_at` FROM `users` WHERE `id` = :id');
        $userStmt->execute([':id' => $userId]);
        $profile = $userStmt->fetch();
        if (!$profile) throw new Exception('User not found');

        $ordersStmt = $db->prepare('SELECT * FROM `orders` WHERE `user_id` = :id ORDER BY `created_at` DESC');
        $ordersStmt->execute([':id' => $userId]);
        $orders = $ordersStmt->fetchAll();

        foreach ($orders as &$order) {
            $order['shipping_address'] = json_decode($order['shipping_address'], true);
            $order['pricing'] = json_decode($order['pricing'], true);
        }

        return [
            'exportTimestamp'    => date('c'),
            'complianceStandard' => 'IEEE SWEBOK v4 / GDPR Article 20 Portability',
            'profile'            => $profile,
            'orders'             => $orders,
        ];
    }

    public static function deleteUserData(string $userId): bool {
        $db = Database::getConnection();

        $checkStmt = $db->prepare('SELECT `role` FROM `users` WHERE `id` = :id');
        $checkStmt->execute([':id' => $userId]);
        $user = $checkStmt->fetch();

        if (!$user) return false;
        if ($user['role'] === 'admin') {
            throw new Exception('Administrative accounts cannot be self-deleted');
        }

        $delStmt = $db->prepare('DELETE FROM `users` WHERE `id` = :id');
        return $delStmt->execute([':id' => $userId]);
    }
}
