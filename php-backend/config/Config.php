<?php
/**
 * IEEE SWEBOK v4 - Application Configuration & Environment Settings
 */

declare(strict_types=1);

namespace WristWatch\Config;

class Config {
    // Database credentials (Default XAMPP / WampServer settings)
    public static string $dbHost = '127.0.0.1';
    public static int $dbPort = 3306;
    public static string $dbName = 'wristwatch_db';
    public static string $dbUser = 'root';
    public static string $dbPass = '';

    // Security & Cryptography (SWEBOK v4 Ch. 13)
    public static string $jwtSecret = 'swebok_v4_php_secret_key_wrist_watch_enterprise_2026';
    public static int $jwtExpiresInSeconds = 86400; // 24 hours

    // Financial & Taxation Rules (Integer Cents - SWEBOK v4 Ch. 04)
    public static int $taxRatePercent = 8;
    public static int $freeShippingThresholdCents = 150000; // $1,500.00
    public static int $flatShippingCents = 2500; // $25.00

    // CORS & Origins
    public static array $allowedOrigins = [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://localhost:5000',
        'http://127.0.0.1:5000',
        'http://localhost'
    ];

    public static function init(): void {
        if ($host = getenv('DB_HOST')) self::$dbHost = $host;
        if ($port = getenv('DB_PORT')) self::$dbPort = (int)$port;
        if ($name = getenv('DB_NAME')) self::$dbName = $name;
        if ($user = getenv('DB_USER')) self::$dbUser = $user;
        if ($pass = getenv('DB_PASS')) self::$dbPass = $pass;
        if ($secret = getenv('JWT_SECRET')) self::$jwtSecret = $secret;
    }
}

Config::init();
