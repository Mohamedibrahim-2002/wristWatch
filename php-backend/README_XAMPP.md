# Setting up Wrist Watch Web Application with XAMPP & MySQL

This guide walks you step-by-step through setting up and running the **PHP & MySQL Backend** using **XAMPP** on Windows.

---

## 1. Why XAMPP is Recommended

**XAMPP** is the recommended all-in-one stack for Windows because:
- It bundles **Apache**, **PHP 8.2+**, and **MariaDB / MySQL Server**.
- It provides **phpMyAdmin** out-of-the-box (web GUI to import tables, inspect records, and run queries).
- Zero complex PATH configuration or separate services required.

---

## 2. Step-by-Step Setup Instructions

### Step 1: Install XAMPP
1. Download XAMPP for Windows (PHP 8.2 or higher) from:
   👉 **https://www.apachefriends.org**
2. Run the installer and choose the default installation folder (`C:\xampp`).

### Step 2: Start Apache and MySQL
1. Open the **XAMPP Control Panel**.
2. Click **Start** next to **Apache**.
3. Click **Start** next to **MySQL**.
   *(Both should show green status).*

### Step 3: Create Database & Import Schema
1. Open your browser and navigate to:
   👉 **http://localhost/phpmyadmin**
2. Click the **Databases** tab at the top.
3. Enter database name: `wristwatch_db` and collation `utf8mb4_unicode_ci`, then click **Create**.
4. Select `wristwatch_db` from the left sidebar, click the **Import** tab at the top.
5. Click **Choose File** and select:
   `D:\wristWatch\wristWatch\php-backend\database\schema.sql`
6. Click **Import** at the bottom.
   *(All 6 tables and seed data will be created successfully).*

---

## 3. Running the Project

You have two easy ways to run the PHP backend:

### Method A: Using PHP Built-In Server (Easiest & Fastest)
You can leave MySQL running in XAMPP, and start the PHP API server directly from this folder:

```powershell
# Open terminal in this repository folder:
cd D:\wristWatch\wristWatch

# Start PHP Backend on port 5000:
php -S localhost:5000 -t php-backend
```

In a second terminal, start the React luxury frontend:
```powershell
npm run dev:client
```
Open **http://localhost:3000** in your browser!

---

### Method B: Deploying inside XAMPP `htdocs`
1. Copy or symlink this project folder into `C:\xampp\htdocs\wristwatch`:
   ```powershell
   # Example copying to htdocs
   Copy-Item -Recurse D:\wristWatch\wristWatch C:\xampp\htdocs\wristwatch
   ```
2. Build the production frontend:
   ```powershell
   npm run build:client
   ```
3. Access the API at:
   `http://localhost/wristwatch/php-backend/api/catalog`
   `http://localhost/wristwatch/php-backend/api/health`

---

## 4. Default Database Configuration

In `php-backend/config/Config.php`, the defaults match standard XAMPP out-of-the-box:
- **Host**: `127.0.0.1`
- **Port**: `3306`
- **Database**: `wristwatch_db`
- **User**: `root`
- **Password**: *(empty / blank by default)*

If you have configured a MySQL root password in XAMPP, you can set the environment variable:
```powershell
$env:DB_PASS="your_password"
```

---

## 5. Seed Test Accounts

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Chief Horologist (Admin)** | `admin@wristwatch.luxury` | `AdminPass123!` | Stock inventory controls, base price updates, order pipeline management |
| **Watch Collector (Customer)** | `collector@wristwatch.luxury` | `CustomerPass123!` | Bespoke customizer, cart, checkout, GDPR export & erasure |

---

## 6. SWEBOK v4 Verification Endpoints

- **Health & Compliance Ping**: `GET /api/health`
- **Catalog Browsing**: `GET /api/catalog`
- **Customizer Server Price Recalculation**: `POST /api/catalog/customizer/price`
- **Cart Management**: `GET /api/cart`
- **PCI-DSS Tokenized Checkout**: `POST /api/orders/checkout`
- **GDPR Data Portability Export**: `GET /api/auth/gdpr/export`
