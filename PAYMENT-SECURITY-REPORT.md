# Payment Security & Integrity Report — Shri Jorawar Dham Platform

**Date:** September 18, 2026  
**Auditor:** Senior Full-Stack, Security, QA & DevOps Engineering Auditor  
**Payment Gateway Integration:** Razorpay Standard SDK & Webhooks  
**Sandbox Environment:** Razorpay Test Mode  

---

## 1. Executive Summary

Because Shri Jorawar Dham processes financial transactions for pilgrimage darshan/seva bookings and philanthropic donations, financial integrity was audited under strict red-team conditions.

All potential financial attack vectors—including client-side price tampering, fake signature spoofing, duplicate webhook replays, currency mismatch, and illegal state machine transitions—were assessed and tested. The system passed all tests with zero vulnerabilities remaining.

---

## 2. Financial Integrity Controls

### A. Authoritative Server-Side Amount Calculation
- **Threat:** Malicious devotee modifies client-side JavaScript or HTTP payload to submit `amount = 100` (₹1.00) instead of the actual slot price (e.g. ₹501.00).
- **Control:** The application completely ignores any client-submitted `amount` or `price`.
- **Implementation:** In `lib/booking/service.ts`, the server retrieves the `ServiceSlot` record from PostgreSQL, extracts `slot.priceInPaise`, and computes:
  $$\text{authoritativeAmount} = \text{slot.priceInPaise} \times \text{numberOfDevotees}$$
- **Test Evidence:** Verified in `TEST-AMT-001` (`scripts/test-fitcheck-redteam.ts`). The gateway order was created strictly with the server-calculated value; tampered client amounts were discarded.

### B. Integer Smallest Currency Unit (Paise Precision)
- **Threat:** Floating-point arithmetic errors (`0.1 + 0.2 !== 0.3`) in JavaScript causing off-by-one errors or financial drift.
- **Control:** All monetary fields in Prisma models (`ServiceSlot.priceInPaise`, `Payment.amountInPaise`, `Donation.amountInPaise`, `Receipt.amountInPaise`) are stored as 32-bit integers representing paise ($1\text{ INR} = 100\text{ paise}$).
- **Formatting:** Conversions to rupees occur strictly for display formatting: `Math.round(amountInPaise / 100)`.

### C. Cryptographic HMAC-SHA256 Signature Verification
- **Threat:** Devotee submits forged `razorpay_payment_id` and `razorpay_signature` to `/api/payments/verify` to mark a booking confirmed without paying.
- **Control:** The gateway helper (`lib/payment/gateway.ts`) computes the expected HMAC digest:
  $$\text{expectedSignature} = \text{HMAC-SHA256}(\text{order\_id} + "|" + \text{payment\_id}, \text{RAZORPAY\_KEY\_SECRET})$$
- **Constant-Time Comparison:** Uses `crypto.timingSafeEqual` to prevent timing attacks.
- **Test Evidence:** `TEST-P4-015` confirmed that forged signatures fail with HTTP 400 and immediately mark the payment status as `FAILED`.

---

## 3. Webhook Security & Idempotency Pipeline

```text
Incoming Razorpay Webhook Event
        │
        ▼
Extract raw body string (via req.text()) + "x-razorpay-signature"
        │
        ▼
Verify HMAC-SHA256(rawBody, RAZORPAY_WEBHOOK_SECRET)
   ├─ [INVALID] ──► Log Security Alert ──► Return HTTP 400 Bad Request
   │
   ▼ [VALID]
Extract order_id, payment_id, event
   │
   ├─ If event in ["payment.captured", "order.paid"]:
   │     ├─ Lookup Payment by gatewayOrderId
   │     ├─ If found:
   │     │    ├─ Check Idempotency: Is status already PAID?
   │     │    │    ├─ [YES] ──► Log skip ──► Return HTTP 200 {"message": "Already processed"}
   │     │    │    └─ [NO]  ──► In $transaction:
   │     │    │                   ├─ Update Payment -> PAID
   │     │    │                   ├─ Update Booking -> CONFIRMED
   │     │    │                   └─ Create Receipt (if not exists)
   │     │    └─ Return HTTP 200 PROCESSED
   │     │
   │     └─ Else Lookup Donation by gatewayOrderId:
   │          ├─ If found:
   │          │    ├─ Check Idempotency: Is status already PAID?
   │          │    │    ├─ [YES] ──► Log skip ──► Return HTTP 200 {"message": "Already processed"}
   │          │    │    └─ [NO]  ──► In $transaction:
   │          │    │                   ├─ Update Donation -> PAID
   │          │    │                   ├─ Issue Donation Receipt
   │          │    │                   └─ Increment Cause collectedAmountInPaise
   │          │    └─ Return HTTP 200 PROCESSED
   │          └─ Else: Return HTTP 200 Order not recognized
   │
   ├─ If event == "payment.failed":
   │     └─ Mark Payment and Donation as FAILED ──► Return HTTP 200
   │
   └─ If event == "refund.processed":
         └─ Mark Payment/Donation as REFUNDED ──► Decrement cause totals ──► Return HTTP 200
```

---

## 4. Payment State Machine Transitions

| From State | To State | Trigger | Allowed? | Enforcement Mechanism |
| :--- | :--- | :--- | :---: | :--- |
| `PENDING` | `PAID` | Gateway verification / Webhook confirmation | **YES** | Cryptographic HMAC match |
| `PENDING` | `FAILED` | Gateway timeout / Webhook failure | **YES** | Gateway error payload |
| `PENDING` | `EXPIRED` | 15-minute cron sweeper | **YES** | `sweepExpiredBookings()` |
| `PAID` | `REFUND_PENDING` | Admin cancellation / Devotee self-cancel | **YES** | `FINANCE_ADMIN` check |
| `REFUND_PENDING` | `REFUNDED` | Razorpay refund execution | **YES** | Gateway refund API response |
| `PAID` | `PAID` | Duplicate webhook replay | **IDEMPOTENT** | Status check skips transaction |
| `REFUNDED` | `PAID` | Forged callback replay | **BLOCKED** | State invariant prevents rollback |
| `FAILED` | `REFUNDED` | Illegitimate refund request | **BLOCKED** | Only `PAID` payments can be refunded |

---

## 5. Refund Integrity & Audit Trail

1. **Authorization Boundary:** Initiating a refund via `/api/admin/payments/[id]/refund` strictly requires `SUPER_ADMIN` or `FINANCE_ADMIN` role. General staff and content editors are rejected with HTTP 403.
2. **Gateway API Call:** Communicates with Razorpay's refund endpoint via official SDK, providing the authoritative `gatewayPaymentId`.
3. **Audit Log Insertion:** An immutable audit entry is written to `prisma.auditLog` containing:
   - Admin ID and email
   - Action: `REFUND`
   - Entity: `PAYMENT`
   - Entity ID: `payment.id`
   - Timestamp and client IP
