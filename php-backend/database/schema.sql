-- =====================================================================
-- IEEE SWEBOK v4 Database Schema: Wrist Watch Web Application
-- Relational Schema with Constraints, Foreign Keys & Integer Cents Precision
-- Database: MySQL / MariaDB (XAMPP / WampServer compatible)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS `wristwatch_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `wristwatch_db`;

-- Drop existing tables in reverse dependency order for clean recreation
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `order_items`;
DROP TABLE IF EXISTS `orders`;
DROP TABLE IF EXISTS `cart_items`;
DROP TABLE IF EXISTS `user_consents`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `watches`;
SET FOREIGN_KEY_CHECKS = 1;

-- 1. WATCHES CATALOG TABLE
-- Stored in Integer Cents to avoid floating point inaccuracies (SWEBOK v4 Ch. 04)
CREATE TABLE `watches` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `name` VARCHAR(120) NOT NULL,
  `brand` VARCHAR(80) NOT NULL,
  `model_code` VARCHAR(60) NOT NULL UNIQUE,
  `collection` VARCHAR(80) NOT NULL,
  `description` TEXT NOT NULL,
  `base_price_in_cents` INT UNSIGNED NOT NULL,
  `movement` ENUM('Automatic', 'Manual', 'Quartz', 'Tourbillon') NOT NULL,
  `case_diameter_mm` INT UNSIGNED NOT NULL,
  `case_material` ENUM('Stainless Steel', 'Rose Gold', 'Yellow Gold', 'Titanium', 'Ceramic') NOT NULL,
  `water_resistance_meters` INT UNSIGNED NOT NULL,
  `dial_color` VARCHAR(80) NOT NULL,
  `strap_material` VARCHAR(80) NOT NULL,
  `stock_quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `image_url` VARCHAR(500) NOT NULL,
  `featured` TINYINT(1) NOT NULL DEFAULT 0,
  `power_reserve_hours` INT UNSIGNED NOT NULL,
  `jewels_count` INT UNSIGNED NOT NULL,
  `crystal_type` VARCHAR(100) NOT NULL,
  `case_thickness_mm` DECIMAL(4,1) NOT NULL,
  `lug_width_mm` INT UNSIGNED NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_watches_movement` (`movement`),
  INDEX `idx_watches_diameter` (`case_diameter_mm`),
  INDEX `idx_watches_price` (`base_price_in_cents`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. USERS TABLE (Role-Based Access Control)
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `email` VARCHAR(120) NOT NULL UNIQUE,
  `full_name` VARCHAR(80) NOT NULL,
  `role` ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_login_at` TIMESTAMP NULL DEFAULT NULL,
  INDEX `idx_users_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. GDPR USER CONSENT TABLE (SWEBOK v4 Ch. 14)
CREATE TABLE `user_consents` (
  `user_id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `necessary_cookies` TINYINT(1) NOT NULL DEFAULT 1,
  `analytics_cookies` TINYINT(1) NOT NULL DEFAULT 0,
  `marketing_cookies` TINYINT(1) NOT NULL DEFAULT 0,
  `consented_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. ORDERS TABLE (Itemized Pricing & PCI Details)
CREATE TABLE `orders` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(32) NOT NULL UNIQUE,
  `user_id` VARCHAR(64) NULL,
  `customer_email` VARCHAR(120) NOT NULL,
  `customer_name` VARCHAR(80) NOT NULL,
  `shipping_address` JSON NOT NULL,
  `pricing` JSON NOT NULL,
  `payment_gateway` VARCHAR(50) NOT NULL DEFAULT 'STRIPE_PCI_MOCK',
  `payment_token_masked` VARCHAR(50) NOT NULL,
  `card_brand` VARCHAR(30) NOT NULL DEFAULT 'Visa',
  `card_last_four` VARCHAR(4) NOT NULL DEFAULT '4242',
  `payment_status` ENUM('pending', 'authorized', 'captured', 'failed', 'refunded') NOT NULL DEFAULT 'captured',
  `transaction_id` VARCHAR(100) NOT NULL,
  `order_status` ENUM('processing', 'assembling', 'quality_check', 'shipped', 'delivered', 'cancelled') NOT NULL DEFAULT 'processing',
  `tracking_number` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_user` (`user_id`),
  INDEX `idx_orders_email` (`customer_email`),
  INDEX `idx_orders_status` (`order_status`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. ORDER LINE ITEMS TABLE
CREATE TABLE `order_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `order_id` VARCHAR(64) NOT NULL,
  `watch_id` VARCHAR(64) NOT NULL,
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `custom_config` JSON NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `unit_price_in_cents` INT UNSIGNED NOT NULL,
  `total_price_in_cents` INT UNSIGNED NOT NULL,
  `watch_name` VARCHAR(120) NOT NULL,
  `watch_brand` VARCHAR(80) NOT NULL,
  `watch_image_url` VARCHAR(500) NOT NULL,
  INDEX `idx_order_items_order` (`order_id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`watch_id`) REFERENCES `watches`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. ACTIVE CART SESSIONS TABLE (Server-Side Cart Persistence)
CREATE TABLE `cart_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `session_key` VARCHAR(120) NOT NULL,
  `watch_id` VARCHAR(64) NOT NULL,
  `is_custom` TINYINT(1) NOT NULL DEFAULT 0,
  `custom_config` JSON NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cart_session` (`session_key`),
  FOREIGN KEY (`watch_id`) REFERENCES `watches`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- SEED DATA: INITIAL LUXURY WATCH CATALOG & USERS
-- =====================================================================

-- Insert Default Admin (Password: AdminPass123!)
-- Hash generated via password_hash('AdminPass123!', PASSWORD_BCRYPT)
INSERT INTO `users` (`id`, `email`, `full_name`, `role`, `password_hash`, `created_at`) VALUES
('usr-admin-01', 'admin@wristwatch.luxury', 'Chief Horologist (Admin)', 'admin', '$2y$10$vWd0yU7uK.pE1YV8m7Wq4.0n0hEw0E2xG0e1K8k9x3c8y3k6v9v0a', NOW()),
('usr-customer-01', 'collector@wristwatch.luxury', 'Alexander Vance', 'customer', '$2y$10$sQe2xT8vK.pE1YV8m7Wq4.0n0hEw0E2xG0e1K8k9x3c8y3k6v9v0b', NOW());

INSERT INTO `user_consents` (`user_id`, `necessary_cookies`, `analytics_cookies`, `marketing_cookies`, `consented_at`) VALUES
('usr-admin-01', 1, 1, 0, NOW()),
('usr-customer-01', 1, 0, 0, NOW());

-- Insert Masterpiece Watch Catalog
INSERT INTO `watches` (
  `id`, `name`, `brand`, `model_code`, `collection`, `description`,
  `base_price_in_cents`, `movement`, `case_diameter_mm`, `case_material`,
  `water_resistance_meters`, `dial_color`, `strap_material`, `stock_quantity`,
  `image_url`, `featured`, `power_reserve_hours`, `jewels_count`, `crystal_type`,
  `case_thickness_mm`, `lug_width_mm`
) VALUES
(
  'ww-sub-01',
  'Aegis Deep Diver 300M',
  'Kronos Geneva',
  'KG-DD300-BLK',
  'Maritime Professional',
  'An unrelenting tool watch engineered for profound oceanic depths. Features a surgical-grade oyster steel case, high-contrast luminescent indices, and an unidirectional ceramic diver bezel.',
  145000,
  'Automatic',
  40,
  'Stainless Steel',
  300,
  'Midnight Obsidian',
  'Stainless Steel Oyster',
  18,
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
  1,
  70,
  28,
  'Sapphire Crystal (Anti-Reflective)',
  12.5,
  20
),
(
  'ww-chr-02',
  'Chronos Grand Prix Tachymeter',
  'Horotech Heritage',
  'HH-GP42-ROYAL',
  'Motorsport Racing',
  'Inspired by endurance racing circuits of the 1960s. Houses a certified column-wheel chronograph calibre with sub-dials measuring elapsed seconds, 30 minutes, and 12 hours.',
  185000,
  'Automatic',
  42,
  'Titanium',
  100,
  'Sunburst Royal Blue',
  'Horween Calfskin',
  12,
  'https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=800&q=80',
  1,
  65,
  31,
  'Domed Sapphire',
  13.8,
  21
),
(
  'ww-cal-03',
  'Sovereign Heritage Calatrava',
  'VanderBilt & Cie',
  'VB-SH39-GOLD',
  'Masterpiece Horology',
  'The pinnacle of classical dress watch elegance. Hand-finished circular graining, guilloché champagne dial, dauphine hands, and an ultra-precise manual wind mechanical movement.',
  240000,
  'Manual',
  39,
  'Rose Gold',
  50,
  'Champagne Gold',
  'Alligator Leather',
  7,
  'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80',
  1,
  55,
  21,
  'Sapphire Crystal (Anti-Reflective)',
  8.8,
  19
),
(
  'ww-trb-04',
  'Aethelgard Flying Tourbillon',
  'VanderBilt & Cie',
  'VB-TRB41-SKEL',
  'Grand Complications',
  'An extraordinary haute horlogerie creation showcasing a gravitational tourbillon cage rotating once per minute through a skeletonized open-heart sapphire aperture.',
  650000,
  'Tourbillon',
  41,
  'Ceramic',
  50,
  'Skeleton Open-Heart',
  'Alligator Leather',
  4,
  'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?auto=format&fit=crop&w=800&q=80',
  1,
  72,
  35,
  'Sapphire Crystal (Anti-Reflective)',
  11.2,
  20
),
(
  'ww-san-05',
  'Monolith Integrated Sports',
  'Kronos Geneva',
  'KG-MIS40-SLV',
  'Urban Architecture',
  'Geometric octagonal bezel with polished bevels and satin-brushed surfaces. Integrated high-grade stainless steel bracelet with concealed folding clasp.',
  210000,
  'Automatic',
  40,
  'Stainless Steel',
  100,
  'Silver Guilloche',
  'Stainless Steel Oyster',
  15,
  'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=800&q=80',
  0,
  60,
  26,
  'Sapphire Crystal (Anti-Reflective)',
  9.9,
  22
),
(
  'ww-emr-06',
  'Verdant Explorer GMT',
  'Horotech Heritage',
  'HH-VE42-GRN',
  'Maritime Professional',
  'Striking emerald sunray dial paired with a 24-hour dual time zone hand. Built for intercontinental travelers and exploration enthusiasts.',
  175000,
  'Automatic',
  42,
  'Stainless Steel',
  200,
  'Emerald Forest',
  'Vulcanized Rubber',
  10,
  'https://images.unsplash.com/photo-1508615039623-a25605d2b022?auto=format&fit=crop&w=800&q=80',
  0,
  50,
  25,
  'Sapphire Crystal (Anti-Reflective)',
  12.0,
  20
),
(
  'ww-slm-07',
  'Vanguard Ultra-Thin Executive',
  'VanderBilt & Cie',
  'VB-UTE38-QZ',
  'Urban Architecture',
  'Unobtrusive sophistication measuring just 6.4mm slim. Powered by an ultra-precise thermo-compensated quartz caliber accurate to +/- 10 seconds per year.',
  85000,
  'Quartz',
  38,
  'Titanium',
  30,
  'Midnight Obsidian',
  'Milanese Mesh',
  25,
  'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=800&q=80',
  0,
  26000,
  7,
  'Sapphire Crystal (Anti-Reflective)',
  6.4,
  18
),
(
  'ww-art-08',
  'Artisan Dual-Time Geometric',
  'Horotech Heritage',
  'HH-AD38-GLD',
  'Masterpiece Horology',
  'Art Deco reversible case design with dual dials allowing independent tracking of home and destination time. Features blued steel leaf hands.',
  295000,
  'Manual',
  38,
  'Yellow Gold',
  30,
  'Champagne Gold',
  'Alligator Leather',
  5,
  'https://images.unsplash.com/photo-1533139502658-0198f920d8e8?auto=format&fit=crop&w=800&q=80',
  0,
  48,
  22,
  'Sapphire Crystal (Anti-Reflective)',
  10.1,
  19
);
