# Threat Model — Shri Jorawar Dham Digital Platform

**Date:** September 18, 2026  
**Methodology:** STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)  
**Classification:** Critical Religious & Financial Infrastructure  

---

## 1. Asset Inventory & Criticality

| Asset Category | Specific Asset | Impact of Compromise | Confidentiality | Integrity | Availability |
| :--- | :--- | :--- | :---: | :---: | :---: |
| **Financial** | Payment Records & Gateway Secrets | Financial loss, fraudulent confirmations, legal liability | High | Critical | High |
| **Financial** | Donation Records & 80G Receipts | Tax regulatory non-compliance, reputational damage | High | Critical | High |
| **Devotee PII** | Names, Mobile Numbers, PAN Cards, Cities | Identity theft, harassment, loss of trust | High | High | Medium |
| **Operational** | Booking Capacity & Slot Allocations | Stampede / overcrowding at temple, VIP gate corruption | Medium | Critical | Critical |
| **Verification**| Digital Tickets & QR Security Tokens | Gate bypass, unauthorized entry, scalping | Medium | Critical | High |
| **Identity** | Admin Accounts & Super Admin Credentials | Total system compromise, unauthorized database changes | Critical | Critical | High |
| **Audit** | Audit Logs | Inability to attribute malicious actions (Repudiation) | Medium | Critical | High |
| **Data** | PostgreSQL Database & Encrypted Backups | Catastrophic data loss, permanent offline status | Critical | Critical | Critical |

---

## 2. Threat Actors & Capabilities

1. **Unauthenticated External Attacker:**
   - *Motivation:* Financial fraud, database extortion, service vandalism, scanning for CVEs.
   - *Capabilities:* Automated HTTP scanners, parameter tampering, brute force scripts, SSRF attempts, CSV formula injection.
2. **Malicious / Opportunistic Devotee:**
   - *Motivation:* Free darshan, jumping the queue, accessing another devotee's ticket/receipt, claiming false tax deductions.
   - *Capabilities:* Client-side code manipulation (DevTools), IDOR attempts on `/api/bookings/[id]`, race condition exploitation during booking checkout.
3. **Dishonest Gate Scalper / Fraudster:**
   - *Motivation:* Selling duplicate or forged QR tickets outside the temple premises.
   - *Capabilities:* QR screenshot replication, timing attacks, modifying URL parameters in ticket QR codes.
4. **Disgruntled or Malicious Staff / Admin:**
   - *Motivation:* Bribery, unauthorized financial refunds, tampering with audit logs, exfiltrating devotee donor lists.
   - *Capabilities:* Internal administrative dashboard access, abusing partial privileges (e.g., Content Admin attempting financial actions).
5. **Compromised Gateway / Webhook Attacker:**
   - *Motivation:* Fabricating fake payment confirmations without paying.
   - *Capabilities:* Replaying past webhook payloads, spoofing headers, manipulating order IDs.

---

## 3. Attack Surface & Trust Boundaries

```text
[ UNTRUSTED INTERNET ]
        │
        ▼ (HTTPS / TLS 1.3)
┌────────────────────────────────────────────────────────┐
│ Reverse Proxy: Nginx (DDoS limiting, SSL Termination)   │
└───────────────────────┬────────────────────────────────┘
                        │
                        ▼ (Reverse Proxy Header Check)
┌────────────────────────────────────────────────────────┐
│ Next.js Application Layer (Node.js non-root runtime)   │
│  ├─ Middleware: CSRF, Security Headers, Edge Routing   │
│  ├─ Rate Limiting: IP/Token bucket                     │
│  ├─ Input Validation: Zod schemas                      │
│  └─ Session Vault: Argon2id, SHA-256 token hashing     │
└───────────┬────────────────────────────────┬───────────┘
            │                                │
            ▼ (Secure Local Storage)         ▼ (Signed Webhook / HTTPS SDK)
┌───────────────────────────────┐  ┌─────────────────────────────────────┐
│ Media Uploads (Magic Bytes)   │  │ Razorpay Payment Gateway Sandbox/Prod│
└───────────────────────────────┘  └─────────────────────────────────────┘
            │
            ▼ (Prisma ORM Parameterized Client)
┌────────────────────────────────────────────────────────┐
│ PostgreSQL 16 Database                                 │
│  ├─ Row-Level Serializable Locking                     │
│  ├─ Unique Constraints & Atomic State Transitions      │
│  └─ AES-256-CBC Encrypted Backups at Rest              │
└────────────────────────────────────────────────────────┘
```

### Critical Trust Boundaries:
1. **Client Browser ↔ API Routes:** Untrusted input boundary. No client-supplied prices, amounts, or user IDs are trusted.
2. **Devotee A ↔ Devotee B:** Horizontal privilege boundary. Server verifies session ownership for every booking, payment, and receipt fetch.
3. **Staff Roles ↔ Financial Ledgers:** Vertical privilege boundary. Only `FINANCE_ADMIN` and `SUPER_ADMIN` can view donations or process refunds.
4. **Third-Party Webhooks ↔ Internal State:** External callback boundary. All incoming webhooks must strictly validate cryptographic HMAC-SHA256 signatures before triggering state transitions.

---

## 4. STRIDE Threat Analysis & Implemented Controls

| Threat Category | Potential Vulnerability | Implemented Defense Mechanism | Verification Status |
| :--- | :--- | :--- | :--- |
| **Spoofing** | Devotee account takeover via OTP brute forcing | 6-digit random crypto OTP, SHA-256 hashed at rest, 10-minute expiry, max 5 attempts, single-use invalidation. | **PASS (Confirmed)** |
| **Spoofing** | Forged Payment Confirmation via Webhook | Razorpay HMAC-SHA256 signature verification over raw request body using `crypto.createHmac`. | **PASS (Confirmed)** |
| **Tampering** | Price manipulation in client booking request | Server ignores client amount; calculates authoritative total: `slot.priceInPaise * numberOfDevotees`. | **PASS (Confirmed)** |
| **Tampering** | Double Booking / Overbooking via race conditions | Prisma atomic transaction with `SELECT ... FOR UPDATE` row locking; capacity strictly verified before write. | **PASS (Confirmed)** |
| **Tampering** | QR Ticket Forgery / Cloning | Opaque high-entropy random token (`crypto.randomBytes(24)`), signed HMAC signature, single-use state transition to `CHECKED_IN`. | **PASS (Confirmed)** |
| **Tampering** | CSV Formula Injection (CWE-1236) | `sanitizeCsvCell()` automatically prepends single quote `'` to all cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`, `%`. | **PASS (Confirmed)** |
| **Repudiation** | Admin performs illicit refund and denies action | Every sensitive mutation writes immutable `AuditLog` containing admin ID, email, IP, entity, and state before/after. | **PASS (Confirmed)** |
| **Information Disclosure** | IDOR on booking and receipt records | Enforced devotee ownership check (`booking.userId === authenticatedDevotee.id`); returns HTTP 403 on mismatch. | **PASS (Confirmed)** |
| **Information Disclosure** | Plaintext PII in Database Backups | OpenSSL AES-256-CBC encryption pipeline with PBKDF2 (100k iterations) and salt applied to all database dumps. | **PASS (Confirmed)** |
| **Denial of Service** | OTP SMS bombing / Denial of Wallet | IP + phone rate limiting in memory/Redis (max 5 requests per 10 minutes). | **PASS (Confirmed)** |
| **Denial of Service** | Capacity hoarding without payment | Automated background cron job sweeps and releases unconfirmed booking holds after 15 minutes. | **PASS (Confirmed)** |
| **Elevation of Privilege**| Unauthorized check-in by Content Admin | Server-side role inspection restricts `/api/admin/bookings/check-in` strictly to `SUPER_ADMIN`, `BOOKING_ADMIN`, and `STAFF`. | **PASS (Confirmed)** |
