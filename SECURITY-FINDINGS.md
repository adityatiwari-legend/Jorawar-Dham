# Security Findings & Vulnerability Register — Shri Jorawar Dham

**Last Updated:** September 18, 2026  
**Status:** All Identified Vulnerabilities Fully Remediated  
**Auditor:** Senior Full-Stack, Security, QA & DevOps Engineering Auditor  

---

## Vulnerability Summary Table

| Finding ID | Title | Severity | Confidence | Affected Component | Fix Status |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **SEC-001** | Asynchronous Webhook Drops Donation Orders & Lacks Idempotency | CRITICAL | CONFIRMED | Payments Webhook | **FIXED** |
| **SEC-002** | CSV Formula Injection (CWE-1236) in Admin Report Generation | HIGH | CONFIRMED | Admin Reporting | **FIXED** |
| **SEC-003** | Missing Authentication / Bearer Token on Cron Hold Sweeper | HIGH | CONFIRMED | Cron Background Jobs | **FIXED** |
| **SEC-004** | Missing Strict Role-Based Access Control on Gate Check-in | MEDIUM | CONFIRMED | Gate Scanner / Booking | **FIXED** |
| **SEC-005** | Unencrypted Database Backup Archives at Rest | MEDIUM | CONFIRMED | Backup & Disaster Recovery | **FIXED** |
| **SEC-006** | Inappropriate 80G Tax Exemption Claim on Darshan Seva Receipts | LOW | CONFIRMED | Booking Receipts | **FIXED** |

---

## Detailed Vulnerability Records

### Finding ID: SEC-001
- **Title:** Asynchronous Razorpay Webhook Drops Donation Orders & Lacks Unified Idempotency
- **Severity:** CRITICAL
- **Confidence:** CONFIRMED
- **Affected Component:** Payment Webhook Handler
- **Attack Surface:** `POST /api/payments/webhook`
- **Evidence:** `app/api/payments/webhook/route.ts:46-52`
- **Observed Behavior:** Incoming `payment.captured` webhooks queried only `prisma.payment`. When an order belonged to a philanthropic donation (`prisma.donation`), the handler returned `"Order not recognized"` without updating donation state.
- **Expected Behavior:** Webhook handler must inspect both `payment` and `donation` models, transitioning successful donations to `PAID`, issuing receipts, and incrementing cause collected amounts transactionally. Duplicate webhooks must be safely ignored.
- **Impact:** Devotees donating via Razorpay whose browser closed before redirect would have their donations remain in `PENDING` status despite money being collected by the temple trust.
- **Reproduction:**
  1. Create pending donation with `gatewayOrderId: "order_test_123"`.
  2. Send signed Razorpay webhook payload with `event: "payment.captured"` and `order_id: "order_test_123"`.
  3. Pre-fix handler returned `"Order not recognized"`; donation remained `PENDING`.
- **Root Cause:** Separate database models for seva bookings and donations without unified webhook dispatching.
- **Recommended Fix:** Query `prisma.donation` if `payment` is null. Implement status check `donation.status === PaymentStatus.PAID` for idempotency, execute atomic update in transaction, and increment `collectedAmountInPaise`.
- **Fix Status:** FIXED
- **Verification:** Verified via `TEST-WEB-002` and `TEST-WEB-003` in `scripts/test-fitcheck-redteam.ts`. Both passed.

---

### Finding ID: SEC-002
- **Title:** CSV Formula Injection (CWE-1236) in Admin Report Generation
- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** Administrative Reporting Service
- **Attack Surface:** `GET /api/admin/reports` (CSV Export Format)
- **Evidence:** `app/api/admin/reports/route.ts:40-75`
- **Observed Behavior:** User-controlled strings (devotee names, remarks, booking references) were concatenated directly into CSV lines without formula character escaping.
- **Expected Behavior:** All spreadsheet formula prefix characters (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) must be neutralized by prepending an apostrophe (`'`).
- **Impact:** Remote Code Execution (RCE) or local file exfiltration on the workstation of temple administrators opening exported CSV rosters in Microsoft Excel or LibreOffice.
- **Reproduction:**
  1. Book a darshan seva with devotee name `=cmd|' /C calc'!A0`.
  2. Log in as Admin and download CSV report from `/api/admin/reports?type=bookings&format=csv`.
  3. Pre-fix CSV contained raw `"=cmd|' /C calc'!A0"`.
- **Root Cause:** Direct string interpolation into CSV without spreadsheet formula sanitization.
- **Recommended Fix:** Implement `sanitizeCsvCell()` with regex `/^[\=\+\-\@\t\r\%]/` prepending `'`.
- **Fix Status:** FIXED
- **Verification:** Verified via `TEST-CSV-001` through `TEST-CSV-009` in `scripts/test-fitcheck-redteam.ts`.

---

### Finding ID: SEC-003
- **Title:** Missing Authentication / Bearer Token on Automated Cron Hold Sweeper (CWE-306)
- **Severity:** HIGH
- **Confidence:** CONFIRMED
- **Affected Component:** Background Booking Hold Sweeper
- **Attack Surface:** `GET` / `POST` `/api/cron/expire-bookings`
- **Evidence:** `app/api/cron/expire-bookings/route.ts:5-18`
- **Observed Behavior:** The endpoint executed `sweepExpiredBookings()` without verifying incoming credentials.
- **Expected Behavior:** Must require a secret bearer token matching `CRON_SECRET` or an authenticated Super Admin session.
- **Impact:** Denial of service through repeated database lock contention, or premature expiration of pending booking holds.
- **Reproduction:**
  1. Send `curl -X POST http://localhost:3000/api/cron/expire-bookings`.
  2. Pre-fix response was HTTP 200 with sweep results.
- **Root Cause:** Omission of authentication gatekeeper on the cron route handler.
- **Recommended Fix:** Validate `Authorization: Bearer ${CRON_SECRET}` or `x-cron-secret` header, falling back to `getAuthenticatedAdmin().isSuperAdmin`.
- **Fix Status:** FIXED
- **Verification:** Verified via `TEST-CRON-001`, `TEST-CRON-002`, and `TEST-CRON-003` in `scripts/test-fitcheck-redteam.ts`.

---

### Finding ID: SEC-004
- **Title:** Missing Strict Role-Based Access Control on Gate Entry Check-in
- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** Gate Scanner / Booking Module
- **Attack Surface:** `POST /api/admin/bookings/check-in`
- **Evidence:** `app/api/admin/bookings/check-in/route.ts:16-19`
- **Observed Behavior:** Endpoint verified `if (!admin)`, permitting any authenticated admin (including `CONTENT_ADMIN` and `EVENT_ADMIN`) to scan and check in devotee tickets.
- **Expected Behavior:** Least privilege enforcement: only `STAFF`, `BOOKING_ADMIN`, and `SUPER_ADMIN` may execute gate check-ins.
- **Impact:** Unauthorized staff could validate tickets or manipulate temple attendance records.
- **Reproduction:**
  1. Authenticate as an admin with only `CONTENT_ADMIN` role.
  2. Submit ticket QR token to `/api/admin/bookings/check-in`.
  3. Pre-fix code allowed check-in.
- **Root Cause:** Generic admin session check without granular role verification.
- **Recommended Fix:** Verify `admin.isSuperAdmin || admin.roles.includes("SUPER_ADMIN") || admin.roles.includes("BOOKING_ADMIN") || admin.roles.includes("STAFF")`. Return HTTP 403 Forbidden otherwise.
- **Fix Status:** FIXED
- **Verification:** Verified via `TEST-RBAC-001` through `TEST-RBAC-006` in `scripts/test-fitcheck-redteam.ts`.

---

### Finding ID: SEC-005
- **Title:** Unencrypted Database Backup Archives at Rest (CWE-311)
- **Severity:** MEDIUM
- **Confidence:** CONFIRMED
- **Affected Component:** Backup & Disaster Recovery Infrastructure
- **Attack Surface:** Local host backup directory (`/opt/backups/postgres`) & remote storage
- **Evidence:** `docs/backup-recovery.md:43`
- **Observed Behavior:** Database dumps were compressed with `gzip`, leaving devotee phone numbers, donor PAN cards, and booking details unencrypted at rest.
- **Expected Behavior:** Backup pipeline must strongly encrypt archives using OpenSSL AES-256-CBC with PBKDF2 (100k iterations) and salt.
- **Impact:** Compromise of backup storage media could lead to bulk PII and financial record leakage.
- **Root Cause:** Omission of cryptographic encryption step in backup runbook.
- **Recommended Fix:** Create `scripts/backup-encrypted.sh` and update restore documentation using OpenSSL AES-256-CBC.
- **Fix Status:** FIXED
- **Verification:** Verified script creation and header inspection preventing unencrypted gzip magic bytes `1f8b`.

---

### Finding ID: SEC-006
- **Title:** Inappropriate 80G Tax Exemption Claim on Darshan Seva Receipts
- **Severity:** LOW (Regulatory / Compliance)
- **Confidence:** CONFIRMED
- **Affected Component:** Devotee Booking Receipt API
- **Attack Surface:** `GET /api/bookings/[id]/receipt`
- **Evidence:** `app/api/bookings/[id]/receipt/route.ts:60`
- **Observed Behavior:** Seva booking receipts returned `taxExemption80G: "CIT(E)/JAIPUR/80G/2022-23/A/10492"`.
- **Expected Behavior:** Pooja/Darshan seva fees are religious service fees, not Section 80G tax-deductible donations under the Indian Income Tax Act.
- **Impact:** Compliance liability with Indian Income Tax Department and potential rejection of devotee tax filings.
- **Root Cause:** Organization metadata template copied into seva receipt without differentiating seva fees from donations.
- **Recommended Fix:** Set `taxExemption80G: null` and `receiptType: "SEVA_FEE"` on booking receipts.
- **Fix Status:** FIXED
- **Verification:** Verified via `TEST-REC-001` in `scripts/test-fitcheck-redteam.ts`.
