# Security Regression Tests — Shri Jorawar Dham Platform

**Date:** September 18, 2026  
**Status:** Automated & Integrated into Quality Assurance Pipeline  

---

## 1. Overview of Added Security Regression Tests

To guarantee that fixed vulnerabilities remain permanently closed and new regressions are impossible to deploy undetected, an adversarial test suite was authored in `scripts/test-fitcheck-redteam.ts`, augmenting existing suites in `scripts/test-phase4-security.ts`, `scripts/test-phase3-flows.ts`, and `scripts/test-phase3-concurrency.ts`.

---

## 2. Regression Test Specifications

### Regression Suite: `scripts/test-fitcheck-redteam.ts`

```bash
# Command to execute full red-team regression suite:
npx tsx scripts/test-fitcheck-redteam.ts
```

#### Test 1: CSV Formula Injection Sanitization
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 33-70)
- **Security Property:** Dynamic Formula Neutralization (CWE-1236)
- **Attack Prevented:** Attacker inserts `=cmd|' /C calc'!A0`, `@SUM()`, `+`, `-`, `\t`, `\r`, or `%0A` into devotee names or booking notes to trigger code execution upon admin export.
- **Expected Secure Behavior:** Every formula prefix trigger must be automatically escaped by prepending `'` and wrapping in RFC 4180 quotes.
- **Result:** **PASS (9 payloads tested and neutralized)**

#### Test 2: Cron Endpoint Authentication & Token Gating
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 72-105)
- **Security Property:** Missing Authentication for Critical Function (CWE-306)
- **Attack Prevented:** Unauthenticated attackers triggering database sweeper jobs to cause denial of service or premature expiration of devotee booking holds.
- **Expected Secure Behavior:** Unauthenticated or improperly authenticated requests must be rejected with HTTP 401; requests with valid `CRON_SECRET` must return HTTP 200.
- **Result:** **PASS (Unauth 401, Bad Bearer 401, Valid Secret 200)**

#### Test 3: Webhook Donation Confirmation & Idempotency
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 107-195)
- **Security Property:** Replay Protection & Asynchronous State Synchronization
- **Attack Prevented:** Attacker spoofing webhook events or replaying webhook confirmations to cause duplicate receipts or double-counting donated funds.
- **Expected Secure Behavior:** Webhook processes both booking payments and philanthropic donations, marks state transactionally as `PAID`, and safely detects replayed events returning `"Already processed"`.
- **Result:** **PASS (HMAC verification, state transition, and replay rejection verified)**

#### Test 4: Seva Booking 80G Tax Exemption Clarification
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 197-215)
- **Security Property:** Regulatory & Tax Compliance
- **Attack Prevented:** Illegal claim of Section 80G tax deductions on religious darshan / pooja seva fees.
- **Expected Secure Behavior:** Seva receipts explicitly return `taxExemption80G: null` and `receiptType: "SEVA_FEE"`.
- **Result:** **PASS**

#### Test 5: Role-Based Least Privilege on Gate Check-in
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 217-245)
- **Security Property:** Role-Based Access Control (CWE-285)
- **Attack Prevented:** Admins with non-gate roles (`CONTENT_ADMIN`, `EVENT_ADMIN`, `FINANCE_ADMIN`) verifying ticket entry or altering attendance.
- **Expected Secure Behavior:** Only `SUPER_ADMIN`, `BOOKING_ADMIN`, and `STAFF` are authorized; unauthorized roles receive HTTP 403 Forbidden.
- **Result:** **PASS (6 roles verified)**

#### Test 6: Payment Amount Anti-Tampering
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 247-270)
- **Security Property:** Financial Data Integrity
- **Attack Prevented:** Malicious devotee modifies client-side request body to set ticket price to ₹1.00.
- **Expected Secure Behavior:** Server ignores client-supplied amounts and strictly recalculates total from database `ServiceSlot.priceInPaise * seats`.
- **Result:** **PASS**

#### Test 7: File Upload MIME & Extension Enforcement
- **File:** `scripts/test-fitcheck-redteam.ts` (lines 272-300)
- **Security Property:** Unrestricted File Upload Defense (CWE-434)
- **Attack Prevented:** Uploading web shells (`.php`, `.phtml`), executables (`.exe`, `.sh`), or vectors for Stored XSS (`.svg`, `.html`).
- **Expected Secure Behavior:** File extensions and magic-byte binary signatures are strictly inspected; disallowed extensions are rejected immediately.
- **Result:** **PASS**

---

## 3. High-Concurrency Regression Suite (`scripts/test-phase3-concurrency.ts`)

```bash
# Command to execute concurrency suite:
npx tsx scripts/test-phase3-concurrency.ts
```

#### Test: Simultaneous Race Condition for Available Slot
- **Security Property:** Atomic Concurrency Control & Row Locking
- **Attack Prevented:** 15 simultaneous requests competing for a single remaining slot seat resulting in overbooking or negative capacity.
- **Expected Secure Behavior:** Exactly 1 request succeeds; exactly 14 requests fail with `CapacityExceededError`. Database maintains strict capacity limit of 1.
- **Result:** **PASS (100% atomic resolution in 148ms)**

---

## 4. CI/CD Pipeline Verification Script

To run the complete suite of regression tests in continuous integration:

```bash
# Automated verification pipeline
npx tsc --noEmit
npx tsx scripts/test-fitcheck-redteam.ts
npx tsx scripts/test-phase4-security.ts
npx tsx scripts/test-phase3-concurrency.ts
npm run build
```
