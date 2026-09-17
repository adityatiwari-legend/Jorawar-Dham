# Shri Jorawar Dham Platform — Complete System Inventory

**Date:** September 18, 2026  
**Auditor:** Senior Full-Stack, Security, QA & DevOps Engineering Auditor  
**Repository:** `d:\Stashlar internship projects\Joravar Dham`  
**Platform Version:** 1.0.0 Production Foundation  
**Framework:** Next.js 16.3.5 (Turbopack, React 19, TypeScript 5.7)  
**Database:** PostgreSQL 16 via Prisma ORM 6.19.3  

---

## 1. Repository Structure

```text
d:\Stashlar internship projects\Joravar Dham\
├── .env.example                          # Environment variable specifications & security guidance
├── .env.production.example               # Hardened production template
├── Dockerfile                            # Multi-stage production container build (non-root)
├── docker-compose.yml                    # Local / staging container orchestration
├── middleware.ts                         # Edge routing, session gatekeeping, security headers
├── next.config.ts                        # Next.js security headers, image domains, optimizations
├── nginx/
│   └── default.conf                      # Nginx reverse proxy with SSL, rate limiting & gzip
├── app/
│   ├── [locale]/                         # Bilingual public and devotee localized pages
│   │   ├── (public pages)                # Home, about, darshan, dham, seva, events, gallery, etc.
│   │   ├── auth/login                    # Devotee phone OTP login portal
│   │   ├── devotee/dashboard             # Devotee account, booking history, receipts
│   │   └── booking/[serviceSlug]         # Interactive slot selection & booking checkout
│   ├── admin/                            # Super Admin & Staff administration interface
│   │   ├── login/                        # Admin credential login
│   │   ├── dashboard/                    # Operational & financial KPIs
│   │   ├── bookings/                     # Booking ledger & status management
│   │   ├── scanner/                      # Gate entry QR code ticket scanner
│   │   ├── slots/                        # Capacity & slot schedule management
│   │   ├── payments/                     # Financial payment ledger & refunds
│   │   ├── donations/                    # Philanthropy ledger & cause management
│   │   ├── reports/                      # Daily audits & sanitized CSV data export
│   │   ├── users/                        # RBAC staff & admin account management
│   │   ├── audit-logs/                   # Immutable security audit trails
│   │   └── settings/                     # Operational configuration & toggles
│   └── api/                              # REST API Route Handlers
│       ├── admin/                        # 17 Protected administrative endpoints
│       ├── auth/                         # Devotee OTP request, verification, logout
│       ├── bookings/                     # Devotee booking creation, receipt, cancellation
│       ├── cron/                         # Background hold sweeper & reconciler
│       ├── devotee/                      # Devotee self-service endpoints
│       ├── donations/                    # Razorpay order, verification, receipts
│       ├── media/                        # Secure asset upload & serving
│       ├── payments/                     # Razorpay checkout, verification, webhook
│       ├── public/                       # Unauthenticated read endpoints (events, notices)
│       ├── services/                     # Service slot availability
│       └── ticket/                       # Public ticket verification
├── components/                           # Modular React UI components
├── lib/
│   ├── auth/                             # Argon2id, OTP generator, session cookies
│   ├── booking/                          # Slot capacity engine, lock management, receipts
│   ├── db/                               # Prisma singleton client with connection pooling
│   ├── logger/                           # Structured audit & privacy logger
│   ├── notifications/                    # Masked multi-channel notification abstraction
│   ├── payment/                          # Razorpay gateway wrapper & signature verifier
│   ├── security/                         # Rate limiting, CSRF, HTTP headers, sanitizers
│   ├── storage/                          # Local/S3 filesystem abstraction with magic-byte check
│   └── ticket/                           # Opaque QR token generator & check-in verifier
├── prisma/
│   ├── schema.prisma                     # 20 Data models with strict indexes & constraints
│   ├── seed.ts                           # Canonical permissions, roles & admin bootstrap
│   └── migrations/                       # Deterministic SQL migration history
├── scripts/                              # Automated backup & adversarial verification tests
└── docs/                                 # Operational runbooks & disaster recovery manual
```

---

## 2. Applications & Services

1. **Public Web Application:** Server-rendered bilingual (Hindi/English) spiritual portal with SEO metadata, localized slugs, and interactive booking/donation interfaces.
2. **Devotee Portal:** Mobile-number + OTP authenticated portal allowing devotees to inspect booking history, download official seva receipts, view digital entry tickets, and cancel reservations.
3. **Staff Gate Scanner:** Mobile-optimized camera scanner interface allowing ground staff to scan devotee ticket QR codes, verify authentic signatures, and process gate check-in.
4. **Admin Management Suite:** Role-based administrative back-office covering content management, booking rosters, payment reconciliation, financial donations, and system settings.
5. **Background Sweeper (Cron):** Automated job releasing expired booking holds (`PENDING_PAYMENT` older than 15 minutes) and reclaiming slot capacity.

---

## 3. Database Models (Prisma)

| Model Name | Table Name | Purpose | Critical Constraints / Indexes |
| :--- | :--- | :--- | :--- |
| `Admin` | `admins` | Administrative users | Unique email, username; status enum; Argon2id hash |
| `Role` | `roles` | RBAC roles | Unique name; `isSystem` flag |
| `Permission` | `permissions` | Granular permission definitions | Unique code; category classification |
| `AdminRole` | `admin_roles` | Admin-to-Role junction | Unique `[adminId, roleId]` composite key |
| `RolePermission` | `role_permissions` | Role-to-Permission junction | Unique `[roleId, permissionId]` composite key |
| `AdminSession` | `admin_sessions` | Stateful administrative sessions | Unique `sessionTokenHash` (SHA-256); indexed `expiresAt` |
| `User` | `users` | Devotees | Unique `phone`, optional `email`; status enum |
| `UserSession` | `user_sessions` | Stateful devotee sessions | Unique `sessionTokenHash` (SHA-256); indexed `expiresAt` |
| `OtpToken` | `otp_tokens` | Single-use authentication OTPs | Salted hash; single-use flag; indexed `[identifier, purpose]` |
| `Service` | `services` | Temple darshan & pooja catalog | Unique slug; active toggle; price in paise |
| `ServiceSlot` | `service_slots` | Time slots and seat capacity | Indexed `[serviceId, date, isActive]`; booked count cache |
| `BlockedDate` | `blocked_dates` | Blackout dates | Unique `[serviceId, date]` composite constraint |
| `Booking` | `bookings` | Devotee reservations | Unique `bookingReference`, `qrSecurityToken`; serializable locking |
| `Payment` | `payments` | Financial transaction ledger | Unique `paymentReference`, `gatewayOrderId`, `gatewayPaymentId` |
| `Refund` | `refunds` | Refund records | Indexed `paymentId`, `status`; gateway tracking ID |
| `Receipt` | `receipts` | Official seva receipts | Unique `receiptNumber`, unique `bookingId` |
| `DonationCause` | `donation_causes`| Philanthropic initiatives | Unique slug; integer target & collected paise |
| `Donation` | `donations` | Philanthropic donations | Unique `donationReference`, `gatewayOrderId`, `receiptNumber` |
| `AuditLog` | `audit_logs` | Immutable audit trail | Actor metadata, JSON details, indexed timestamp |
| `SiteSetting` | `site_settings` | Dynamic operational settings | Unique key; typed values; public/private toggle |

---

## 4. API Endpoints Inventory & Security Matrix

### A. Authentication & Devotee Endpoints

| Method | Endpoint | Auth Required | RBAC Role | Input Validation | Rate Limit | External Service | Sensitive Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/otp/send` | None | Public | Zod (`phone`, `purpose`) | 5 req/10 min | SMS Gateway | Masked phone |
| `POST` | `/api/auth/otp/verify` | None | Public | Zod (`phone`, `otp`) | 5 req/10 min | None | Session token |
| `POST` | `/api/auth/devotee/logout` | Session | Devotee | None | Standard | None | Session cookie |
| `GET` | `/api/auth/devotee/me` | Session | Devotee | None | Standard | None | Profile (PII) |

### B. Devotee Booking & Payment Endpoints

| Method | Endpoint | Auth Required | RBAC Role | Input Validation | Rate Limit | External Service | Sensitive Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/bookings` | Session | Devotee | Zod (`slotId`, `date`, `devotees`) | 10 req/min | None | Devotee name/phone |
| `GET` | `/api/bookings` | Session | Devotee | Query params | Standard | None | Devotee bookings |
| `GET` | `/api/bookings/[id]` | Session | Devotee | Path UUID | Standard | None | Booking details (IDOR check) |
| `POST` | `/api/bookings/[id]/cancel` | Session | Devotee | Path UUID | 5 req/min | Gateway (Refund) | Refund record |
| `GET` | `/api/bookings/[id]/receipt` | Session | Devotee | Path UUID | Standard | None | Receipt details (IDOR check) |
| `POST` | `/api/payments/create-order` | Session | Devotee | Zod (`bookingId`) | 10 req/min | Razorpay API | Gateway Order ID |
| `POST` | `/api/payments/verify` | Session | Devotee | Zod (`orderId`, `paymentId`, `signature`) | 10 req/min | Razorpay SDK | HMAC Signature |
| `POST` | `/api/payments/webhook` | Webhook Sig | Razorpay | HMAC SHA-256 (`x-razorpay-signature`) | Gateway IP | Razorpay Webhook | Payment Payload |

### C. Donation Endpoints

| Method | Endpoint | Auth Required | RBAC Role | Input Validation | Rate Limit | External Service | Sensitive Data |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/donations/create-order` | None | Public | Zod (`amount`, `name`, `pan`, `phone`) | 10 req/min | Razorpay API | Donor PAN/Phone |
| `POST` | `/api/donations/verify` | None | Public | Zod (`donationId`, `signature`, etc.) | 10 req/min | Razorpay SDK | HMAC Signature |
| `GET` | `/api/donations/[id]/receipt` | None | Public Token | Path UUID + Reference | Standard | None | Donation receipt |
| `GET` | `/api/devotee/donations` | Session | Devotee | None | Standard | None | Devotee donation history |

### D. Administrative Endpoints (Back-Office)

| Method | Endpoint | Auth Required | RBAC Role / Permission | Input Validation | Sensitive Data |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/admin/auth/login` | None | Public | Zod (`email`, `password`) | Password hash, cookie |
| `POST` | `/api/admin/auth/logout` | Admin Session | Admin | None | Session destruction |
| `GET` | `/api/admin/auth/me` | Admin Session | Admin | None | Admin roles & permissions |
| `GET` | `/api/admin/bookings` | Admin Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Query filters, pagination | Devotee PII (masked) |
| `POST` | `/api/admin/bookings/check-in` | Admin Session | `STAFF`, `BOOKING_ADMIN`, `SUPER_ADMIN` | Zod (`bookingReference`, `qrToken`) | Ticket verification |
| `POST` | `/api/admin/bookings/manual` | Admin Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Zod (`serviceId`, `devotee`) | Devotee PII |
| `POST` | `/api/admin/bookings/[id]/cancel` | Admin Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Path UUID, cancellation reason | Financial refund trigger |
| `POST` | `/api/admin/bookings/[id]/reschedule` | Admin Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Zod (`newSlotId`, `newDate`) | Schedule modification |
| `GET` | `/api/admin/payments` | Admin Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Query filters, pagination | Financial transaction ledger |
| `POST` | `/api/admin/payments/[id]/refund` | Admin Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Path UUID, Zod reason | Gateway refund execution |
| `GET` | `/api/admin/donations` | Admin Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Query filters, pagination | Donor PII & PAN |
| `POST` | `/api/admin/donations/causes` | Admin Session | `CONTENT_ADMIN`, `SUPER_ADMIN` | Zod cause payload | Cause content |
| `GET` | `/api/admin/reports` | Admin Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Zod (`type`, `range`, `format`) | Sanitized CSV export |
| `GET` | `/api/admin/users` | Admin Session | `SUPER_ADMIN` | None | Staff accounts & roles |
| `POST` | `/api/admin/users` | Admin Session | `SUPER_ADMIN` | Zod (`email`, `roles`, `password`) | Admin account creation |
| `GET` | `/api/admin/audit-logs` | Admin Session | `SUPER_ADMIN` | Pagination & entity filters | Full system audit trail |
| `GET` | `/api/admin/settings` | Admin Session | `SUPER_ADMIN` | None | Operational configs |
| `POST` | `/api/admin/settings` | Admin Session | `SUPER_ADMIN` | Zod key-value map | System configuration |

### E. Background Jobs & Utilities

| Method | Endpoint | Auth Required | Enforcement | Function |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/cron/expire-bookings` | Token / Admin | `Bearer ${CRON_SECRET}` or Super Admin | Releases stale pending booking holds |
| `GET` | `/api/cron/expire-bookings` | Token / Admin | `x-cron-secret` header or Super Admin | Manual trigger / health check |
| `POST` | `/api/media/upload` | Admin Session | `CONTENT_ADMIN`, `SUPER_ADMIN` | Validates magic bytes, uploads media |
| `GET` | `/api/media/[filename]` | None | Public safe streaming | Serves static uploads without traversal |
