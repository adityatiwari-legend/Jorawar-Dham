# Security Hardening Changelog — Shri Jorawar Dham

**Platform Version:** 1.0.0 Hardened  
**Audit Completion Date:** September 18, 2026  

---

### SEC-FIX-001
- **Date:** 2026-09-18
- **Change ID:** SEC-FIX-001
- **Issue:** CSV Formula Injection (CWE-1236) in administrative reporting CSV export.
- **Original Behavior:** CSV values were formatted with standard double-quote wrapping, allowing formula triggers (`=`, `+`, `-`, `@`, `\t`, `\r`, `%`) to execute in spreadsheet software.
- **Changed Behavior:** Implemented `sanitizeCsvCell()` that checks regex `/^[\=\+\-\@\t\r\%]/` and prepends an apostrophe (`'`), disabling formula execution.
- **Files Modified:**
  - `app/api/admin/reports/route.ts`
- **Security Impact:** Eliminates Remote Code Execution (RCE) and data exfiltration risks on administrator workstations opening exported reports.
- **Tests Added:** `TEST-CSV-001` through `TEST-CSV-009` in `scripts/test-fitcheck-redteam.ts`.
- **Verification Result:** PASS (All 9 attack vectors neutralized).

---

### SEC-FIX-002
- **Date:** 2026-09-18
- **Change ID:** SEC-FIX-002
- **Issue:** Missing authentication on `/api/cron/expire-bookings` endpoint (CWE-306).
- **Original Behavior:** Any unauthenticated caller could invoke the endpoint to sweep booking holds.
- **Changed Behavior:** Enforced `isCronAuthorized()` requiring `Bearer ${CRON_SECRET}` or `x-cron-secret` header, with fallback to active Super Admin session verification. Rejects unauthenticated callers with HTTP 401.
- **Files Modified:**
  - `app/api/cron/expire-bookings/route.ts`
- **Security Impact:** Prevents DoS and unauthorized manipulation of devotee booking hold lifecycles.
- **Tests Added:** `TEST-CRON-001`, `TEST-CRON-002`, and `TEST-CRON-003` in `scripts/test-fitcheck-redteam.ts`.
- **Verification Result:** PASS (HTTP 401 for unauthenticated/bad token; HTTP 200 for valid token).

---

### SEC-FIX-003
- **Date:** 2026-09-18
- **Change ID:** SEC-FIX-003
- **Issue:** Webhook handler dropped donation events and lacked unified idempotency.
- **Original Behavior:** Webhook queried only `prisma.payment`. When Razorpay sent payment confirmations for donations, it returned `"Order not recognized"`.
- **Changed Behavior:** Webhook inspects both `payment` and `donation` models. Successfully captures donation payments, generates donation receipts, updates cause collected amounts atomically, and idempotently skips duplicate events.
- **Files Modified:**
  - `app/api/payments/webhook/route.ts`
- **Security Impact:** Guarantees financial data consistency between Razorpay and the database, preventing orphaned payments and double-crediting.
- **Tests Added:** `TEST-WEB-001`, `TEST-WEB-002`, and `TEST-WEB-003` in `scripts/test-fitcheck-redteam.ts`.
- **Verification Result:** PASS (Donation confirmed, status marked `PAID`, receipt created, replay skipped safely).

---

### SEC-FIX-004
- **Date:** 2026-09-18
- **Change ID:** SEC-FIX-004
- **Issue:** Inappropriate 80G tax exemption claim on Darshan / Pooja seva booking receipts.
- **Original Behavior:** Seva receipts hardcoded `taxExemption80G: "CIT(E)/JAIPUR/80G/2022-23/A/10492"`.
- **Changed Behavior:** Seva booking receipts return `taxExemption80G: null` and `receiptType: "SEVA_FEE"`. Pure donations under `/api/donations` retain 80G certification.
- **Files Modified:**
  - `app/api/bookings/[id]/receipt/route.ts`
- **Security Impact:** Eliminates Indian Income Tax compliance liabilities and prevents devotees from filing erroneous tax deduction claims.
- **Tests Added:** `TEST-REC-001` in `scripts/test-fitcheck-redteam.ts`.
- **Verification Result:** PASS.

---

### SEC-FIX-005
- **Date:** 2026-09-18
- **Change ID:** SEC-FIX-005
- **Issue:** Unencrypted database backup archives at rest (CWE-311).
- **Original Behavior:** Backups used `pg_dump ... | gzip`, compressing without encrypting sensitive devotee PII and donor PAN records.
- **Changed Behavior:** Created OpenSSL AES-256-CBC PBKDF2 (100,000 iterations) salted encryption pipeline script (`scripts/backup-encrypted.sh`) and updated disaster recovery runbooks.
- **Files Modified:**
  - `scripts/backup-encrypted.sh` (New)
  - `docs/backup-recovery.md`
- **Security Impact:** Protects devotee personal data and financial records against data exfiltration in backup storage.
- **Tests Added:** Header validation in backup script preventing unencrypted gzip magic bytes `1f8b`.
- **Verification Result:** PASS.

---

### SEC-FIX-006
- **Date:** 2026-09-18
- **Change ID:** SEC-FIX-006
- **Issue:** Missing strict role-based access control on gate check-in API (CWE-285).
- **Original Behavior:** Permitted any authenticated admin account (including `CONTENT_ADMIN` and `EVENT_ADMIN`) to check in devotee tickets.
- **Changed Behavior:** Enforced least privilege: restricted check-in to `SUPER_ADMIN`, `BOOKING_ADMIN`, and `STAFF`. Returns HTTP 403 Forbidden for unauthorized roles.
- **Files Modified:**
  - `app/api/admin/bookings/check-in/route.ts`
- **Security Impact:** Prevents privilege escalation and unauthorized entry approval by staff without ticketing duties.
- **Tests Added:** `TEST-RBAC-001` through `TEST-RBAC-006` in `scripts/test-fitcheck-redteam.ts`.
- **Verification Result:** PASS.
