# Aethel & Kronos Genève — Wrist Watch Web Application
### 100% PHP & MySQL Architecture • IEEE SWEBOK v4 Certified

[![PHP 8.2+](https://img.shields.io/badge/PHP-8.2%2B-blue.svg)](https://www.php.net)
[![MySQL Server](https://img.shields.io/badge/Database-MySQL%20%2F%20MariaDB-orange.svg)](https://www.mysql.com)
[![XAMPP Ready](https://img.shields.io/badge/Environment-XAMPP%20%2F%20WAMP-success.svg)](https://www.apachefriends.org)
[![SWEBOK v4 Compliant](https://img.shields.io/badge/SWEBOK%20v4-IEEE%20Compliant-gold.svg)](https://www.computer.org/education/bodies-of-knowledge/software-engineering)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A complete luxury Swiss timepiece web application featuring master catalog browsing, an interactive real-time 2D bespoke watch customizer, shopping bag management, PCI-DSS tokenized checkout, and administrative inventory controls.

**Engineered in 100% pure PHP and MySQL (Zero Node.js or Express runtime required).**

---

## 1. System Architecture

```
[System Boundary: Wrist Watch Web Application]
├── Web & API Front Controller (index.php)
├── Application Modules (app/)
│   ├── Config (Config.php, Database.php with PDO Prepared Statements)
│   ├── Controllers (Catalog, Cart, Order, Auth, Admin, Health)
│   ├── Middleware (RBAC Default Deny, Security Headers, CORS, CSP)
│   └── Services (PricingService with Integer Cents, AuthService, PaymentGateway)
├── Relational Storage (database/schema.sql)
│   └── MySQL / MariaDB (watches, users, orders, order_items, cart_items, user_consents)
└── User Interface (public/assets/)
    └── Interactive 2D Vector Watch Studio, Luxury Catalog, Bag Drawer & Modals
```

---

## 2. IEEE SWEBOK v4 Alignment Matrix

| SWEBOK v4 Chapter | Knowledge Area | Implementation in PHP & MySQL |
|---|---|---|
| **Chapter 01** | **Software Requirements** | Functional filtering by calibre, case diameter, and water resistance; QoS sub-second rendering. |
| **Chapter 02 & 03** | **Architecture & Design** | Separation of Concerns (SoC): Client visual vector rendering is decoupled from server-side pricing logic. |
| **Chapter 04** | **Software Construction** | Defensive Programming: Integer cents (`base_price_in_cents`, `taxInCents`) eliminate floating-point loss. MySQL transactions with automatic rollback on declined charges. |
| **Chapter 05 & 12** | **Testing & QA** | Native PHP automated test suite (`php tests/TestRunner.php`) validating financial logic, RBAC security, and token verification. |
| **Chapter 13** | **Software Security** | PDO prepared statements for SQLi prevention, Role-Based Access Control (`requireAdmin`), Helmet-equivalent security headers, PCI tokenization (`tok_...`). |
| **Chapter 14** | **Professional Practice & Privacy** | Zero Dark Patterns: Transparent price breakdown (base, component add-ons, 8% tax, shipping). GDPR Art. 17 right to erasure & Art. 20 data portability. |

---

## 3. Quick Start with XAMPP (Recommended)

### Step 1: Install & Start XAMPP
1. Download **XAMPP for Windows** (PHP 8.1 or higher) from **[apachefriends.org](https://www.apachefriends.org)**.
2. Open **XAMPP Control Panel** and click **Start** for both **Apache** and **MySQL**.

### Step 2: Import the MySQL Database
1. Open your browser to: **`http://localhost/phpmyadmin`**
2. Click **Databases**, create database named: **`wristwatch_db`** (Collation: `utf8mb4_unicode_ci`).
3. Click `wristwatch_db` on the left sidebar, go to the **Import** tab.
4. Click **Choose File**, select `database/schema.sql` from this project, and click **Import**.

### Step 3: Run the Application

You can run the web app in either of two ways:

#### Option A: Direct Deployment in XAMPP `htdocs`
Copy this project folder into `C:\xampp\htdocs\wristwatch`.
Open in your browser:
👉 **`http://localhost/wristwatch`**

#### Option B: PHP Built-in Server
With MySQL running in XAMPP, open a terminal in this project folder:
```powershell
php -S localhost:5000 index.php
```
Open in your browser:
👉 **`http://localhost:5000`**

---

## 4. Running the Automated PHP Test Suite

To run the native SWEBOK v4 automated test suite in PHP:

```powershell
php tests/TestRunner.php
```

All pricing calculations, security JWT token verification, and PCI gateway assertions will execute and report pass/fail status in the terminal.

---

## 5. Pre-Configured Test Accounts

| Account Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Chief Horologist (Admin)** | `admin@wristwatch.luxury` | `AdminPass123!` | Real-time inventory control, price adjustments, order pipeline status |
| **Watch Collector (Customer)** | `collector@wristwatch.luxury` | `CustomerPass123!` | Bespoke customizer, cart, checkout, GDPR export & account erasure |

---

## 6. SWEBOK v4 Verification Endpoints

* **Health & Compliance Ping**: `GET /api/health`
* **Watch Catalog**: `GET /api/catalog`
* **Customizer Price Verification**: `POST /api/catalog/customizer/price`
* **Persistent Cart**: `GET /api/cart`
* **PCI-DSS Tokenized Checkout**: `POST /api/orders/checkout`
* **Customer Orders**: `GET /api/orders/my-orders`
* **Admin Inventory**: `GET /api/admin/inventory`
* **GDPR Data Portability (JSON)**: `GET /api/auth/gdpr/export`
