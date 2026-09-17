# API Security Matrix — Shri Jorawar Dham Platform

**Date:** September 18, 2026  
**Auditor:** Senior Full-Stack, Security, QA & DevOps Engineering Auditor  
**Scope:** Complete REST API Surface (Authentication, Bookings, Payments, Donations, Admin, Media, Cron)  

---

## Complete Endpoint Security Evaluation

| Method | Endpoint | Auth | RBAC Role | Input Validation | Rate Limit | CSRF Defense | Sensitive Data | Tested | Result |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `POST` | `/api/auth/otp/send` | Public | None | Zod Schema | 5 req/10m | SameSite Lax | Phone (Masked) | YES | **PASS** |
| `POST` | `/api/auth/otp/verify` | Public | None | Zod Schema | 5 req/10m | SameSite Lax | Session Token | YES | **PASS** |
| `POST` | `/api/auth/devotee/logout` | Session | Devotee | None | Standard | Cookie clear | Session Cookie | YES | **PASS** |
| `GET` | `/api/auth/devotee/me` | Session | Devotee | None | Standard | SameSite Lax | Devotee Profile | YES | **PASS** |
| `POST` | `/api/bookings` | Session | Devotee | Zod Schema | 10 req/min | SameSite Lax | Devotee Name/Phone | YES | **PASS** |
| `GET` | `/api/bookings` | Session | Devotee | Query params | Standard | SameSite Lax | Devotee Bookings | YES | **PASS** |
| `GET` | `/api/bookings/[id]` | Session | Devotee (Owner) | Path UUID | Standard | SameSite Lax | Booking Details | YES | **PASS** |
| `POST` | `/api/bookings/[id]/cancel` | Session | Devotee (Owner) | Path UUID | 5 req/min | SameSite Lax | Refund Trigger | YES | **PASS** |
| `GET` | `/api/bookings/[id]/receipt` | Session | Devotee (Owner) | Path UUID | Standard | SameSite Lax | Financial Receipt | YES | **PASS** |
| `POST` | `/api/payments/create-order` | Session | Devotee | Zod Schema | 10 req/min | SameSite Lax | Gateway Order ID | YES | **PASS** |
| `POST` | `/api/payments/verify` | Session | Devotee | Zod Schema | 10 req/min | SameSite Lax | HMAC Signature | YES | **PASS** |
| `POST` | `/api/payments/webhook` | Webhook Sig | Razorpay Signature | HMAC-SHA256 | Gateway IP | HMAC Header | Payment Payload | YES | **PASS** |
| `POST` | `/api/donations/create-order` | Public | None | Zod Schema | 10 req/min | SameSite Lax | Donor PAN/Phone | YES | **PASS** |
| `POST` | `/api/donations/verify` | Public | None | Zod Schema | 10 req/min | SameSite Lax | HMAC Signature | YES | **PASS** |
| `GET` | `/api/donations/[id]/receipt` | Public Token | Reference check | Path UUID | Standard | SameSite Lax | Donation Receipt | YES | **PASS** |
| `GET` | `/api/devotee/donations` | Session | Devotee (Owner) | None | Standard | SameSite Lax | Donor History | YES | **PASS** |
| `POST` | `/api/admin/auth/login` | Public | None | Zod Schema | 5 req/15m | SameSite Lax | Password Hash | YES | **PASS** |
| `POST` | `/api/admin/auth/logout` | Session | Admin | None | Standard | Cookie clear | Session Cookie | YES | **PASS** |
| `GET` | `/api/admin/auth/me` | Session | Admin | None | Standard | SameSite Lax | Admin Roles | YES | **PASS** |
| `GET` | `/api/admin/bookings` | Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Query filters | Standard | SameSite Lax | Devotee PII (Masked) | YES | **PASS** |
| `POST` | `/api/admin/bookings/check-in` | Session | `STAFF`, `BOOKING_ADMIN`, `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | Ticket Verification | YES | **PASS** |
| `POST` | `/api/admin/bookings/manual` | Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | Devotee PII | YES | **PASS** |
| `POST` | `/api/admin/bookings/[id]/cancel`| Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Path UUID | Standard | SameSite Lax | Financial Refund | YES | **PASS** |
| `POST` | `/api/admin/bookings/[id]/reschedule` | Session | `BOOKING_ADMIN`, `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | Schedule State | YES | **PASS** |
| `GET` | `/api/admin/payments` | Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Query filters | Standard | SameSite Lax | Payment Ledger | YES | **PASS** |
| `POST` | `/api/admin/payments/[id]/refund` | Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Path UUID | Standard | SameSite Lax | Gateway Refund | YES | **PASS** |
| `GET` | `/api/admin/donations` | Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Query filters | Standard | SameSite Lax | Donor PAN / PII | YES | **PASS** |
| `POST` | `/api/admin/donations/causes` | Session | `CONTENT_ADMIN`, `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | Cause Metadata | YES | **PASS** |
| `GET` | `/api/admin/reports` | Session | `FINANCE_ADMIN`, `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | Sanitized CSV | YES | **PASS** |
| `GET` | `/api/admin/users` | Session | `SUPER_ADMIN` | None | Standard | SameSite Lax | Staff Accounts | YES | **PASS** |
| `POST` | `/api/admin/users` | Session | `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | Admin Credentials | YES | **PASS** |
| `GET` | `/api/admin/audit-logs` | Session | `SUPER_ADMIN` | Pagination | Standard | SameSite Lax | Audit Trail | YES | **PASS** |
| `GET` | `/api/admin/settings` | Session | `SUPER_ADMIN` | None | Standard | SameSite Lax | System Config | YES | **PASS** |
| `POST` | `/api/admin/settings` | Session | `SUPER_ADMIN` | Zod Schema | Standard | SameSite Lax | System Config | YES | **PASS** |
| `POST` | `/api/cron/expire-bookings` | Token / Admin | `Bearer ${CRON_SECRET}` / Super Admin | None | Gateway / Cron | Secret Header | Background Sweeper | YES | **PASS** |
| `POST` | `/api/media/upload` | Session | `CONTENT_ADMIN`, `SUPER_ADMIN` | Magic Bytes | Standard | SameSite Lax | Media File | YES | **PASS** |
| `GET` | `/api/media/[filename]` | Public | None | Safe Path RegEx | Standard | None | Uploaded Static File | YES | **PASS** |
| `GET` | `/api/ticket/verify` | Public Token | Reference + Token | Query params | Standard | None | Ticket Verification | YES | **PASS** |
| `GET` | `/api/public/services` | Public | None | None | Standard | None | Public Seva Catalog | YES | **PASS** |
| `GET` | `/api/public/events` | Public | None | None | Standard | None | Public Events | YES | **PASS** |
| `GET` | `/api/public/notices` | Public | None | None | Standard | None | Public Notices | YES | **PASS** |
| `GET` | `/api/public/settings` | Public | None | None | Standard | None | Public Settings | YES | **PASS** |
| `GET` | `/api/services/[slug]/slots` | Public | None | Path slug | Standard | None | Slot Availability | YES | **PASS** |

---

## 2. Key Observations

1. **Strict Ownership Enforcement:** Devotee endpoints (`/api/bookings/[id]`, `/api/bookings/[id]/receipt`, etc.) verify `booking.userId === authenticatedDevotee.id`. IDOR attacks are completely rejected with HTTP 403 Forbidden.
2. **Authoritative Financial Calculations:** Endpoints handling money (`/api/bookings`, `/api/payments/create-order`) reject or ignore any client-supplied price and calculate authoritative totals directly from database records.
3. **No Unauthenticated Administrative Mutation:** Every admin modification endpoint strictly inspects the active session and asserts specific role permissions prior to executing any state changes.
