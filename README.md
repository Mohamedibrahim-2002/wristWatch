# Aethel & Kronos Genève — Wrist Watch Web Application
### IEEE SWEBOK v4 Certified Security & Software Engineering Architecture

[![SWEBOK v4 Compliant](https://img.shields.io/badge/SWEBOK%20v4-IEEE%20Compliant-gold.svg)](https://www.computer.org/education/bodies-of-knowledge/software-engineering)
[![Vulnerabilities: 0](https://img.shields.io/badge/Vulnerabilities-0%20High%2F0%20Crit-brightgreen.svg)](https://docs.npmjs.com/cli/v8/commands/npm-audit)
[![Tests Passing](https://img.shields.io/badge/Tests-19%2F19%20Passing%20(100%25)-success.svg)](./tests)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)

A luxury Swiss horology web application combining master timepiece catalog browsing, an interactive real-time 2D/vector bespoke watch customizer, transparent cart calculations, PCI-DSS compliant checkout tokenization, and administrative inventory controls.

Built and maintained strictly under the **IEEE Guide to the Software Engineering Body of Knowledge (SWEBOK v4)**.

---

## 1. Architectural Context & System Boundary

```
[System Boundary: Wrist Watch Web App]
├── Frontend Client (SPA: Watch Catalog, Live 2D Configurator, Horology Bag, Checkout)
├── API Gateway & Microservices (Auth & RBAC, Catalog, Configurator, Cart, Order, Inventory)
├── Payment Processing Integration (PCI-DSS Level 1 Compliant Gateway Abstraction)
└── Secure Data Persistence (ACID Two-Phase Commitment with Atomic Rollback)
```

---

## 2. SWEBOK v4 Knowledge Area (KA) Alignment Matrix

| SWEBOK v4 Chapter | Knowledge Area | Implementation in Wrist Watch Web Application |
|---|---|---|
| **Chapter 01** | **Software Requirements** | Distinguishes functional features (calibre filtering, customizer selection) from non-functional QoS constraints (&lt;1.5s rendering speed, ATDD unit criteria). |
| **Chapter 02 & 03** | **Architecture & Modular Design** | Separation of Concerns (SoC): Client visual rendering is strictly decoupled from pricing rules. Microservice/modular routers (`Catalog`, `Cart`, `Order`, `Auth`, `Admin`). |
| **Chapter 04** | **Software Construction** | Defensive Programming: Integer cents (`priceInCents`) eliminate floating-point inaccuracies. Two-phase inventory deduction with automatic rollback on payment decline. |
| **Chapter 05 & 12** | **Testing & Quality Assurance** | 19 automated Vitest test cases testing pricing engines, RBAC authorization, anti-tampering, two-phase rollbacks, and GDPR endpoints. |
| **Chapter 06** | **DevSecOps & Operations** | Multi-stage Docker containerization running under non-root unprivileged `node` user; GitHub Actions automated CI testing. |
| **Chapter 08** | **Supply Chain & SCM** | Active Software Bill of Materials (`sbom.cyclonedx.json`) generated in CycloneDX standard. `npm audit` reports 0 vulnerabilities. |
| **Chapter 13** | **Software Security & Threats** | Strict input validation via Zod allowlists, Default Deny RBAC, Helmet secure headers, CSP, Anti-CSRF, PCI tokenization (`tok_...`). |
| **Chapter 14** | **Professional Practice & Privacy** | Zero Dark Patterns: Transparent pricing breakdowns (base, add-ons, 8% tax, shipping). Full GDPR compliance (Art. 17 Erasure, Art. 20 Portability). |

---

## 3. Security & Engineering Directives

### A. Server-Side Price Recalculation (Anti-Tampering)
Client applications **never** dictate currency prices. When a user submits an item to the bag or completes checkout:
1. The server loads the canonical base watch price from the database.
2. The server verifies each chosen customizer parameter (alloy, bezel, dial, hands, strap, movement, engraving).
3. The server computes the canonical subtotal, coupon discount, 8% sales tax, and shipping fee in **integer cents**.
4. Any client payload price is discarded, preventing price manipulation attacks.

### B. Two-Phase Inventory Commitment with Safe Rollback (SWEBOK v4 Ch. 04)
During checkout:
1. **Phase 1 (Allocation):** Available stock is atomically verified and deducted from the catalog.
2. **Phase 2 (Payment Authorization):** Payment token is processed through the PCI gateway abstraction.
3. **Rollback Closure:** If payment fails or is declined, an automatic atomic rollback restores the inventory baseline to prevent stock desynchronization.

### C. Client-Side Payment Tokenization (PCI-DSS Compliance)
Raw primary account numbers (PAN) and CVC codes are never sent to the merchant web server. The client interface delegates card tokenization to the payment vault, exchanging card data for a single-use token (`tok_...`).

---

## 4. Getting Started

### Prerequisites
- Node.js >= 20.x
- npm >= 10.x

### Installation
```bash
# Clone the repository
git clone https://github.com/Mohamedibrahim-2002/wristWatch.git
cd wristWatch

# Install audited dependencies
npm install

# Run automated SWEBOK v4 test suite
npm test

# Generate Software Bill of Materials (SBOM)
npm run sbom:generate
```

### Running in Development
```bash
# Start backend API server (port 5000)
npm run dev:server

# In a separate terminal, start frontend Vite client (port 3000)
npm run dev:client
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Running in Production
```bash
# Build client and server
npm run build

# Start production server (serves API and built client on port 5000)
npm start
```
Open [http://localhost:5000](http://localhost:5000).

---

## 5. Demo Credentials

| Role | Email | Password | Access Privileges |
|---|---|---|---|
| **Chief Horologist (Admin)** | `admin@wristwatch.luxury` | `AdminPass123!` | Full stock inventory adjustment, supply chain order pipeline management |
| **Watch Collector (Customer)** | `collector@wristwatch.luxury` | `CustomerPass123!` | Catalog browsing, bespoke customizer, cart, checkout, GDPR export & erasure |

---

## 6. SWEBOK v4 Verification Checklist

- [x] **Server-Side Price Verification**: All customizer calculations execute server-side; client payload prices are ignored.
- [x] **Payment Tokenization**: Credit card data never touches application backend directly.
- [x] **Authentication & Access Control**: Admin inventory routes protected by strict RBAC (`requireAdmin` middleware).
- [x] **Input Sanitization**: Client inputs, search queries, addresses, and custom engravings validated via Zod allowlists.
- [x] **Currency Math Precision**: Integer amounts (cents) utilized for 100% calculation accuracy.
- [x] **Dependency Audit & SBOM**: CycloneDX SBOM generated; `npm audit` reports 0 vulnerabilities.
- [x] **Ethical E-Commerce UX**: Itemized pricing, transparent shipping thresholds, zero dark patterns.
