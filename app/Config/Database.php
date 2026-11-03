<?php
/**
 * IEEE SWEBOK v4 Chapter 13 (Software Security: Injection Prevention)
 * Singleton PDO MySQL Connection with Prepared Statements & UTF-8.
 */

declare(strict_types=1);

namespace WristWatch\Config;

use PDO;
use PDOException;

class Database {
    private static ?PDO $instance = null;

    private function __construct() {}
    private function __clone() {}

    public static function getConnection(): PDO {
        if (self::$instance === null) {
            $dsn = sprintf(
                'mysql:host=%s;port=%d;dbname=%s;charset=utf8mb4',
                Config::$dbHost,
                Config::$dbPort,
                Config::$dbName
            );

            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false, // Enforce true server-side prepared statements
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci"
            ];

            try {
                self::$instance = new PDO($dsn, Config::$dbUser, Config::$dbPass, $options);
            } catch (PDOException $e) {
                // Defensive exception handling: Never leak database credentials in production
                http_response_code(500);
                header('Content-Type: application/json; charset=UTF-8');
                echo json_encode([
                    'success' => false,
                    'error' => [
                        'code' => 'DATABASE_CONNECTION_ERROR',
                        'message' => 'Unable to connect to MySQL database. Please ensure MySQL is running in XAMPP or your server.'
                    ]
                ]);
                exit;
            }
        }

        return self::$instance;
    }
}

