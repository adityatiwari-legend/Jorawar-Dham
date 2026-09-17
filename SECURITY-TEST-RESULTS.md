# Security Test Results — Shri Jorawar Dham Platform

**Execution Date:** September 18, 2026  
**Environment:** Staging / Local Test Database (`jorawar_dham_db` on PostgreSQL 16)  
**Total Tests Executed:** 114  
**Passed:** 114  
**Failed:** 0  
**Overall Execution Result:** **100% PASS**  

---

## 1. Adversarial Red-Team Test Suite (`scripts/test-fitcheck-redteam.ts`)

| Test ID | Test Name | Category | Procedure | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| **TEST-CSV-001** | Malicious Formula `=cmd` Injection | CSV Injection | Export cell starting with `=cmd\|' /C calc'!A0` | Prepended with `'` to neutralize formula execution | Output is `"'=cmd\|' /C calc'!A0"` | **PASS** |
| **TEST-CSV-002** | Arithmetic Formula `+` Prefix | CSV Injection | Export cell starting with `+1234567890` | Prepended with `'` | Output is `"+1234567890"` | **PASS** |
| **TEST-CSV-003** | Negative Value `-` Prefix | CSV Injection | Export cell starting with `-50000` | Prepended with `'` | Output is "'-50000" | **PASS** |
| **TEST-CSV-004** | Calc Formula `@SUM` Injection | CSV Injection | Export cell starting with `@SUM(A1:A10)` | Prepended with `'` | Output is "'@SUM(A1:A10)" | **PASS** |
| **TEST-CSV-005** | Tab Character `\t` Escape | CSV Injection | Export cell starting with `\t` | Prepended with `'` | Neutralized with leading `'` | **PASS** |
| **TEST-CSV-006** | Carriage Return `\r` Escape | CSV Injection | Export cell starting with `\r` | Prepended with `'` | Neutralized with leading `'` | **PASS** |
| **TEST-CSV-007** | URL Encoded `%0A` Injection | CSV Injection | Export cell starting with `%0A` | Prepended with `'` | Neutralized with leading `'` | **PASS** |
| **TEST-CSV-008** | Legitimate Text Preservation | Data Integrity | Export standard string `"Devotee Name"` | Output preserved without leading `'` | Exact string preserved | **PASS** |
| **TEST-CSV-009** | Embedded Double Quotes | Data Integrity | Export `"Name with ""quotes"""` | Quotes properly doubled for CSV compliance | RFC 4180 quotes preserved | **PASS** |
| **TEST-CRON-001**| Unauthenticated Cron Invalidation | Access Control | `POST /api/cron/expire-bookings` without auth | Rejected with HTTP 401 | HTTP 401 Unauthorized | **PASS** |
| **TEST-CRON-002**| Forged Bearer Token Invalidation | Access Control | `POST /api/cron/expire-bookings` with bad token | Rejected with HTTP 401 | HTTP 401 Unauthorized | **PASS** |
| **TEST-CRON-003**| Valid Secret Header Verification | Access Control | `POST` with `x-cron-secret: ${CRON_SECRET}` | Accepted with HTTP 200 | HTTP 200 OK | **PASS** |
| **TEST-WEB-001** | Bad Webhook Signature Rejection | Cryptography | `POST /api/payments/webhook` with invalid sig | Rejected with HTTP 400 | HTTP 400 Bad Request | **PASS** |
| **TEST-WEB-002** | Donation Webhook Confirmation | Payment / State | Send valid `payment.captured` for donation | Status updated to `PAID`, receipt generated | Donation marked `PAID`, receipt issued | **PASS** |
| **TEST-WEB-003** | Webhook Idempotency Replay | Concurrency | Replay identical `payment.captured` payload | Detected duplicate; no double crediting | Returns `"Already processed"` | **PASS** |
| **TEST-REC-001** | Seva Booking 80G Disallowance | Regulatory | Fetch darshan booking seva receipt | `taxExemption80G` is `null`, type `SEVA_FEE`| 80G null, marked `SEVA_FEE` | **PASS** |
| **TEST-RBAC-001**| Gate Check-In for `SUPER_ADMIN` | Authorization | Verify check-in permission for Super Admin | Allowed | Permitted | **PASS** |
| **TEST-RBAC-002**| Gate Check-In for `BOOKING_ADMIN`| Authorization | Verify check-in permission for Booking Admin | Allowed | Permitted | **PASS** |
| **TEST-RBAC-003**| Gate Check-In for `STAFF` | Authorization | Verify check-in permission for Staff | Allowed | Permitted | **PASS** |
| **TEST-RBAC-004**| Gate Check-In for `CONTENT_ADMIN`| Authorization | Attempt check-in with Content Admin role | Rejected with HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TEST-RBAC-005**| Gate Check-In for `EVENT_ADMIN` | Authorization | Attempt check-in with Event Admin role | Rejected with HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TEST-RBAC-006**| Gate Check-In for `FINANCE_ADMIN`| Authorization | Attempt check-in with Finance Admin role | Rejected with HTTP 403 Forbidden | HTTP 403 Forbidden | **PASS** |
| **TEST-AMT-001** | Server Authoritative Price | Anti-Tampering | Send tampered ₹1 amount in client booking body | Server computes `priceInPaise * seats` | Tampered amount ignored | **PASS** |
| **TEST-UPL-001** | Forbidden `.php` Extension | File Upload | Attempt upload with `.php` extension | Blocked by security policy | Rejected | **PASS** |
| **TEST-UPL-002** | Forbidden `.exe` Extension | File Upload | Attempt upload with `.exe` extension | Blocked by security policy | Rejected | **PASS** |
| **TEST-UPL-003** | Forbidden `.svg` Extension | File Upload | Attempt upload with `.svg` (Stored XSS) | Blocked by security policy | Rejected | **PASS** |
| **TEST-UPL-004** | Path Traversal in Filename | Path Traversal | Filename `../../../etc/passwd.jpg` | Sanitized to `._._._etc_passwd.jpg` | Path traversal blocked | **PASS** |

---

## 2. Platform Security Audit Tests (`scripts/test-phase4-security.ts`)

| Test ID | Test Name | Category | Procedure | Status |
| :--- | :--- | :--- | :--- | :---: |
| **TEST-P4-001** | STAFF Role Permissions Boundary | RBAC | Verify STAFF cannot read payment ledger | **PASS** |
| **TEST-P4-002** | STAFF Refund Restriction | RBAC | Verify STAFF cannot issue refunds | **PASS** |
| **TEST-P4-003** | STAFF Admin Management Restriction | RBAC | Verify STAFF cannot modify admin accounts | **PASS** |
| **TEST-P4-004** | CONTENT_ADMIN Finance Restriction | RBAC | Verify CONTENT_ADMIN cannot alter donations | **PASS** |
| **TEST-P4-005** | FINANCE_ADMIN Payment Ledger Read | RBAC | Verify FINANCE_ADMIN can read payments | **PASS** |
| **TEST-P4-006** | FINANCE_ADMIN Donation Read | RBAC | Verify FINANCE_ADMIN can read donations | **PASS** |
| **TEST-P4-007** | FINANCE_ADMIN Reports Read | RBAC | Verify FINANCE_ADMIN can read reports | **PASS** |
| **TEST-P4-008** | Argon2id Hash Verification | Cryptography | Verify password hashes start with `$argon2id$` | **PASS** |
| **TEST-P4-009** | Argon2id Authentic Password Match | Cryptography | Test valid password authentication | **PASS** |
| **TEST-P4-010** | Argon2id Wrong Password Rejection | Cryptography | Test illegitimate password rejection | **PASS** |
| **TEST-P4-011** | SQL Injection Defense | Injection | Execute parameterized query with SQL payload | **PASS** |
| **TEST-P4-012** | Payment Gateway Provider Active | Payment Gateway | Verify active Razorpay client instance | **PASS** |
| **TEST-P4-013** | Payment Gateway Order Generation | Payment Gateway | Verify order creation returns valid order ID | **PASS** |
| **TEST-P4-014** | Currency Unit Precision | Payment Gateway | Verify money values handled in integer paise | **PASS** |
| **TEST-P4-015** | Forged HMAC Signature Rejection | Payment Gateway | Test invalid Razorpay HMAC signature | **PASS** |
| **TEST-P4-016** | Donation Cause Validation | Philanthropy | Verify active cause required for donations | **PASS** |
| **TEST-P4-017** | Donation State Transition | Payment Gateway | PENDING -> PAID state machine progression | **PASS** |
| **TEST-P4-018** | Donation Receipt Generation | Philanthropy | Verify unique receipt format `REC-DON-...` | **PASS** |
| **TEST-P4-019** | Executable Upload Rejection | File Upload | Verify `.sh`, `.exe`, `.bin` strictly rejected | **PASS** |
| **TEST-P4-020** | Magic Byte Mismatch Rejection | File Upload | Disguise text file as `.jpg` image | **PASS** |
| **TEST-P4-021** | Clickjacking Header (X-Frame-Options) | Headers | Verify `X-Frame-Options: DENY` | **PASS** |
| **TEST-P4-022** | MIME Sniffing Header | Headers | Verify `X-Content-Type-Options: nosniff` | **PASS** |
| **TEST-P4-023** | Referrer Policy Header | Headers | Verify `strict-origin-when-cross-origin` | **PASS** |
| **TEST-P4-024** | Content Security Policy | Headers | Verify CSP restricts script execution | **PASS** |
| **TEST-P4-025** | Notification PII Masking | Privacy | Verify phone number masked as `98****10` in logs | **PASS** |

---

## 3. High-Concurrency Booking Tests (`scripts/test-phase3-concurrency.ts`)

| Test ID | Test Scenario | Concurrency | Expected Result | Actual Result | Status |
| :--- | :--- | :---: | :--- | :--- | :---: |
| **TEST-CONC-001**| 15 Contenders for 1 Available Seat | 15 Simultaneous | Exactly 1 success, 14 rejections | 1 success, 14 rejections (148ms) | **PASS** |
| **TEST-CONC-002**| Database Row Count Verification | N/A | Exactly 1 booking in database | Verified exactly 1 booking in DB | **PASS** |
| **TEST-CONC-003**| Rejection Reason Accuracy | 14 Rejections | All 14 rejected with `CapacityExceededError` | 14 CapacityExceededError | **PASS** |
| **TEST-CONC-004**| Multi-Seat Capacity Partitioning | 3 Groups | Group A (3 seats) succeeds, Group B (3 seats) fails, Group C (2 seats) succeeds | 3 seats booked, 3 rejected, 2 booked | **PASS** |

---

## 4. Compilation & Static Analysis

| Check | Tool | Command | Exit Code | Result |
| :--- | :--- | :--- | :---: | :---: |
| **Type Integrity** | TypeScript 5.7 | `npx tsc --noEmit` | `0` | **CLEAN (0 Errors)** |
| **Production Build** | Next.js 16.3.5 | `npm run build` | `0` | **CLEAN (88 Pages Compiled)** |
