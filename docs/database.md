# PostgreSQL Database Architecture & Hardening Guide

## 1. Relational Database Overview
The Shri Jorawar Dham digital platform utilizes a normalized, relational PostgreSQL 16 database managed via Prisma ORM. The schema enforces strict data integrity constraints, foreign keys, unique indices, and transaction boundaries.

```
+-----------------------------------------------------------------------------------+
|                                 CORE DATA DOMAINS                                 |
+-----------------------------------------------------------------------------------+
|  1. Identity & RBAC   : admins, roles, permissions, admin_roles, role_permissions |
|  2. Devotee & Auth    : users, user_sessions, otp_requests                        |
|  3. Services & Slots  : services, service_slots, blocked_dates                    |
|  4. Bookings & Passes : bookings, receipts                                        |
|  5. Payments & Ledgers: payments, refunds                                         |
|  6. Charitable Giving : donation_causes, donations                                |
|  7. Content & Events  : events, notices, faqs, gallery_items, site_settings       |
|  8. Security Audit    : audit_logs                                                |
+-----------------------------------------------------------------------------------+
```

---

## 2. Key Data Models & Relations

### 2.1 Identity & RBAC (Role-Based Access Control)
* `Admin`: Administrative staff accounts with Argon2id password hashes, failed login counters, and lockouts.
* `Role`: System roles (`SUPER_ADMIN`, `CONTENT_ADMIN`, `BOOKING_ADMIN`, `FINANCE_ADMIN`, `EVENT_ADMIN`, `STAFF`).
* `Permission`: Granular capabilities (e.g., `bookings:manage`, `payments:read`, `donations:read`, `users:manage`).
* `AdminRole` & `RolePermission`: Many-to-many junction tables maintaining role assignments and capability bindings.

### 2.2 Devotee & Authentication
* `User`: Devotee profiles identified by unique 10-digit mobile numbers with international dial codes.
* `UserSession`: Active HTTP sessions stored as SHA-256 token hashes with explicit expiration timestamps.
* `OtpRequest`: Passwordless authentication requests holding salted OTP hashes with 5-minute lifespans and attempt counters.

### 2.3 Services, Capacity Slots & Bookings
* `Service`: Temple offerings (Special Darshan, Morning Aarti, Shringar Seva, etc.) with bilingual titles and descriptions.
* `ServiceSlot`: Discrete time slots with defined capacities (`capacity`), active booked tallies (`bookedCount`), and integer pricing (`priceInPaise`).
* `BlockedDate`: Dates blocked for temple festivals or VIP visits where public bookings are prohibited.
* `Booking`: Pilgrimage passes linking a devotee, service, and slot. Holds unique references (`JD-YYYYMM-XXXXXX`), devotee companions, status, and single-use `qrSecurityToken`.
* `Receipt`: Immutable digital receipt linking booking and payment records with masked phone numbers.

### 2.4 Payments & Refunds
* `Payment`: Transaction records referencing gateway order IDs (`gatewayOrderId`), gateway payment IDs (`gatewayPaymentId`), HMAC signatures, and status (`PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUND_PENDING`, `REFUNDED`).
* `Refund`: Audit trail of returned payments linking back to original booking and payment records with admin audit tracking.

### 2.5 Digital Donation System
* `DonationCause`: Configurable charitable causes (Gaushala, Annakshetra, Temple Renovation) with target amounts and collected totals.
* `Donation`: Charitable contributions recording donor details, PAN (for legal Indian compliance), integer amount in paise, gateway payment verification, and unique donation receipt numbers (`REC-DON-YYYYMM-...`).

---

## 3. High-Performance Indexing Strategy

To guarantee millisecond query response times under pilgrim festival traffic, strategic composite indices are established:

| Table | Index Columns | Purpose |
| :--- | :--- | :--- |
| `bookings` | `[serviceId, bookingDate]` | Fast lookup of service capacity and daily devotee schedules. |
| `bookings` | `[slotId, bookingDate]` | Direct lookups during slot reconciliation and concurrency locks. |
| `bookings` | `[bookingStatus, expiresAt]` | Efficient polling and purging of stale uncompleted booking holds. |
| `bookings` | `[qrSecurityToken]` | Instant $O(1)$ lookup during gate scanner verification. |
| `payments` | `[gatewayOrderId]`, `[gatewayPaymentId]` | Immediate reconciliation upon webhook receipt. |
| `payments` | `[status]`, `[createdAt]` | Rapid financial ledger reporting and CSV generation. |
| `donations` | `[status]`, `[causeId]` | Real-time aggregation of cause totals and donor receipts. |
| `audit_logs` | `[action]`, `[entity]`, `[createdAt]` | Fast forensic filtering of administrative events. |

---

## 4. Transaction Boundaries & Concurrency Isolation

### 4.1 Anti-Overbooking Row-Level Locking
During concurrent booking creation, standard `SELECT` queries can suffer from dirty reads or race conditions. The platform solves this by executing a raw PostgreSQL row-level lock within an interactive transaction:

```sql
-- Executed inside Prisma interactive transaction:
SELECT "id", "capacity", "bookedCount"
FROM "service_slots"
WHERE "id" = $1
FOR UPDATE;
```

1. The row for the requested slot is locked at the database engine level.
2. The available capacity is evaluated: `capacity - bookedCount >= requestedSeats`.
3. If sufficient capacity exists, `bookedCount` is incremented and the booking hold is created.
4. If capacity is exhausted, a `CapacityExceededError` is thrown immediately and the transaction rolls back cleanly.
5. All competing requests wait in line for the lock, guaranteeing strictly zero overbooking.

---

## 5. Database Hardening & Security Best Practices
1. **Application-Only Access**: The PostgreSQL database is bound strictly to `127.0.0.1` or internal Docker networks. It is never exposed directly to the public Internet.
2. **Dedicated Least-Privilege Database User**: In production, the application connects via an unprivileged database user (`jorawar_app`) restricted to CRUD operations on the `public` schema.
3. **Prepared Statements**: All database operations use Prisma's parameterized SQL engine, rendering SQL injection structurally impossible.
