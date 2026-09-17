# Payment Gateway Integration & Security Architecture

## 1. Overview
The Shri Jorawar Dham digital platform integrates with **Razorpay**, India's leading PCI-DSS Level 1 certified payment gateway, alongside an automated mock provider for offline development and testing. The platform enforces strict financial security, immutable transaction logging, server-side price calculation, cryptographic signature verification, and idempotent webhook handling.

---

## 2. Dedicated Payment Security Checklist

| Checkpoint | Requirement | Implementation Details | Verification Status |
| :--- | :--- | :--- | :--- |
| **No Card Data Stored** | No raw primary account numbers (PAN) or debit/credit card numbers stored in application databases. | Razorpay standard checkout iframe handles all card data directly. The application database schema contains zero card fields. | **VERIFIED** |
| **No CVV Stored** | No Card Verification Values (CVV/CVC) recorded or logged. | No CVV input exists on temple web forms; CVV is collected exclusively by Razorpay PCI-compliant modal. | **VERIFIED** |
| **Payment Secrets Server-Only** | API secrets, webhook secrets, and signing keys must never leak to client browsers. | `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are strictly server-side environment variables. Only `NEXT_PUBLIC_RAZORPAY_KEY_ID` is exposed to frontend. | **VERIFIED** |
| **Server-Side Price Calculation** | Monetary amounts must be computed strictly on backend. | Price calculation relies exclusively on `service_slots.priceInPaise * numberOfDevotees`. Client-supplied amounts are ignored for bookings. For donations, positive integer paise are strictly validated. | **VERIFIED** |
| **Integer Smallest Unit (Paise)** | Eliminate floating point calculation drift. | All money stored and passed as integer paise ($₹500.00 = 50,000\text{ paise}$). Never stored as float or double. | **VERIFIED** |
| **Payment Signatures Verified** | All frontend gateway callbacks must be verified cryptographically. | Callbacks execute HMAC-SHA256 signature verification: `HMAC_SHA256(orderId + "|" + paymentId, secret) === signature`. | **VERIFIED** |
| **Webhooks Verified** | Out-of-band webhook notifications must be authenticated. | Incoming webhook payload bytes are verified against `x-razorpay-signature` header using `RAZORPAY_WEBHOOK_SECRET`. | **VERIFIED** |
| **Webhooks Idempotent** | Duplicate webhook deliveries must not cause duplicate payments or bookings. | Payments and donations record unique `gatewayPaymentId`. Duplicate webhook deliveries for already `PAID` records are acknowledged with 200 OK without re-processing. | **VERIFIED** |
| **Duplicate Prevention** | Prevent multiple simultaneous charges for a single booking hold. | Bookings enforce a 1:N relation with payments, and each booking hold accepts only one completed payment transaction. | **VERIFIED** |
| **Refunds Tracked** | All refunds must be audited with reference, amount, and reason. | Admin-initiated refunds transition payment to `REFUNDED` and create an immutable record in the `refunds` table linking to the processing admin. | **VERIFIED** |
| **Controlled State Transitions** | Prevent invalid status skips (e.g. FAILED -> PAID). | State transitions are managed via ACID transactions and validated strictly in code before committing to database. | **VERIFIED** |
| **Failed Payments Handled** | Clean handling of declined cards or gateway timeouts. | Failed payment attempts are marked `FAILED` with gateway error codes; devotee booking remains in hold until timeout or retry. | **VERIFIED** |
| **Expired Payments Purged** | Automatic release of unpaid slot capacity. | Scheduled sweeper (`/api/cron/expire-bookings`) frees capacity and marks expired uncompleted holds as `EXPIRED`. | **VERIFIED** |
| **Reconciliation Enabled** | Admin ledgers must enable end-of-day bank matching. | Every record stores `gatewayOrderId`, `gatewayPaymentId`, timestamp, and reference for direct export to accounting CSV. | **VERIFIED** |

---

## 3. Payment Flow Sequence

```
Devotee                  Next.js Backend                 Razorpay Gateway
   |                            |                                |
   | 1. Select Service & Slot   |                                |
   |--------------------------->|                                |
   |                            | 2. SELECT FOR UPDATE (Lock)    |
   |                            |    Calculate price in paise    |
   |                            |    Create Booking (PENDING)    |
   |                            | 3. Create Gateway Order        |
   |                            |------------------------------->|
   |                            |<-------------------------------|
   |                            |    Return Order ID + Key       |
   | 4. Return Order Details    |                                |
   |<---------------------------|                                |
   |                                                             |
   | 5. Open Razorpay Checkout Modal                             |
   |------------------------------------------------------------>|
   | 6. Complete Payment (UPI / NetBanking / Cards)              |
   |<------------------------------------------------------------|
   |    Returns (orderId, paymentId, signature)                  |
   |                                                             |
   | 7. Submit Verification Payload                              |
   |--------------------------->|                                |
   |                            | 8. Verify HMAC-SHA256          |
   |                            | 9. If authentic:               |
   |                            |    - Update Booking (CONFIRMED)|
   |                            |    - Update Payment (PAID)     |
   |                            |    - Generate Receipt          |
   |                            |    - Issue QR Digital Ticket   |
   |                            |    - Send Notification (SMS)   |
   |<---------------------------|                                |
   | 10. Render Confirmed Pass  |                                |
```

---

## 4. Refund State Machine

```
   +------------------+
   |    COMPLETED     |
   +------------------+
            |
            | Admin initiates refund or booking cancelled
            v
   +------------------+
   |  REFUND_PENDING  | ----> Gateway API refund call
   +------------------+
            |
      +-----+-----+
      |           |
      v           v
+-----------+ +--------+
| REFUNDED  | | FAILED |
+-----------+ +--------+
```

1. **Initiation**: When an admin or devotee requests cancellation of a paid booking, the payment status transitions to `REFUND_PENDING`.
2. **Gateway Processing**: The system communicates with Razorpay Refund API (`POST /v1/payments/{id}/refund`).
3. **Completion**: Upon successful return from the gateway, the refund status is updated to `PROCESSED`, the payment status to `REFUNDED`, and the slot booked tally is decremented to release capacity.
4. **Devotee Notification**: A notification is dispatched informing the devotee of the refund reference and expected credit timeline (5–7 banking days).
