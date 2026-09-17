# Shri Jorawar Dham Platform Architecture (Phase 1 – 4)

## 1. Architectural Overview
The Shri Jorawar Dham digital platform is engineered as a high-integrity, bilingual (Hindi & English), production-grade pilgrimage management system. It serves two distinct audiences:
1. **Public Devotee Experience**: Pilgrims seeking spiritual information, darshan/aarti timings, sacred gallery access, festival schedules, slot-based booking passes, and digital charitable donations.
2. **Administrative & Operational Command**: Temple administrators, priests, accounting officers, and security gate staff executing capacity management, financial ledger reconciliation, spot counter passes, and entry validation.

```
                     +-------------------------------------------------+
                     |                 Internet Clients                |
                     |       (Devotees Mobile/Web & Admin Users)       |
                     +-------------------------------------------------+
                                              |
                                              v
                     +-------------------------------------------------+
                     |            Nginx Reverse Proxy & TLS            |
                     |         (Port 80 -> 443 Strict HTTPS)           |
                     |         Rate Limiting | Gzip | CSP              |
                     +-------------------------------------------------+
                                              |
                                              v
                     +-------------------------------------------------+
                     |             Next.js 16 (App Router)             |
                     |  - Public Bilingual Routes (/[locale]/...)      |
                     |  - Devotee Portal & OTP Authentication          |
                     |  - Admin Portal & Least-Privilege RBAC          |
                     |  - RESTful APIs with Zod Input Validation       |
                     +-------------------------------------------------+
                             |                       |
                             v                       v
    +----------------------------------+   +----------------------------------+
    |   PostgreSQL 16 Relational DB    |   |     External Gateway / APIs      |
    |  - Normalized Prisma Schema      |   |  - Razorpay Payments & Webhooks  |
    |  - SELECT FOR UPDATE Row Locking |   |  - Multi-channel Notifications   |
    |  - Tamper-resistant Audit Logs   |   |    (SMS / WhatsApp / Email)      |
    |  - Zero Card/CVV Storage         |   |  - Static Map / Fonts Assets     |
    +----------------------------------+   +----------------------------------+
```

---

## 2. Core Subsystems

### 2.1 Bilingual Internationalization Subsystem (`next-intl`)
* **Prefix-Based Routing**: Clean URL structure (`/hi/...` and `/en/...`) with language selector and automatic cookie persistence.
* **Translation Catalogues**: Structured JSON dictionaries in `messages/hi.json` and `messages/en.json` covering all navigational labels, rituals, booking forms, and legal terms.
* **SEO Metadata**: Bilingual `title`, `description`, OpenGraph cards, and canonical hreflang links rendered per route.

### 2.2 Devotee Authentication Subsystem
* **Passwordless Mobile OTP**: Devotees authenticate via their 10-digit Indian mobile number.
* **Cryptographic Salted Nonces**: Plaintext OTPs are never stored in the database. Only SHA-256 salted hashes are persisted with short expiration windows (5 minutes) and single-use enforcement.
* **Rate Limiting**: Sliding window rate-limiting restricts OTP generation to prevent SMS toll fraud and brute-force enumeration.

### 2.3 Capacity & Slot Management Subsystem
* **Granular Time Slots**: Temple services (Special Darshan, Aarti, Rudrabhishek Seva, Shringar Pooja) have discrete start/end times and maximum capacities.
* **Concurrency Protection**: Slot allocation uses PostgreSQL `SELECT ... FOR UPDATE` row-level locks within ACID transactions, guaranteeing zero overbooking even under high concurrent load.
* **Holding Mechanism**: Unpaid bookings occupy a 10-minute slot hold. A background sweeper automatically expires stale holds and reclaims capacity.

### 2.4 Digital Donation Subsystem
* **Configurable Causes**: Support for General Seva, Gaushala Seva, Annakshetra (Bhandara), Mandir Jirnoddhar, and Veda Pathshala.
* **Server-Side Paise Representation**: All monetary values are strictly handled as integer paise ($₹1.00 = 100\text{ paise}$) to prevent floating-point calculation drift.
* **Zero 80G Claims**: Tax exemption claims are disabled by default until the organization establishes legal eligibility.
* **Instant Digital Receipts**: Unique receipts (`REC-DON-YYYYMM-...`) generated upon gateway HMAC signature verification.

### 2.5 Administrative RBAC Subsystem
* **Least Privilege Roles**:
  - `SUPER_ADMIN`: Full administrative control, system settings, user creation.
  - `FINANCE_ADMIN`: Access to payment ledgers, refunds, donation reconciliation, and financial reports.
  - `BOOKING_ADMIN`: Manual counter passes, slot capacity adjustment, and booking rescheduling.
  - `CONTENT_ADMIN`: Dynamic CMS pages, history, gallery, notices, and FAQs.
  - `EVENT_ADMIN`: Festivals, melas, and event publication.
  - `STAFF`: Gate check-in QR scanner operations.
* **Server-Side Enforcement**: All administrative mutations are authorized server-side through `getAuthenticatedAdmin()`.

### 2.6 Notification Engine Abstraction
* **Provider Agnostic**: Decoupled interface (`NotificationProvider`) supporting Console, generic SMS gateways, SMTP email, and WhatsApp Cloud APIs.
* **Zero Secret Exposure**: Message payloads contain only non-sensitive metadata (reference numbers, devotee name, date, time) and exclude card data, authentication tokens, or internal credentials.
