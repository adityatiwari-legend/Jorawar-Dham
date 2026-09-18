# INVOICE & RECEIPT SYSTEM (कर रसीद एवं बीजक प्रणाली) — ARCHITECTURE & COMPLIANCE

## 1. Overview & Core Requirement Fix
In earlier iterations, viewing or requesting an invoice could return raw API JSON payloads. This system completely replaces raw API JSON with **authoritative, human-readable, beautifully styled, print-ready Tax Invoices and Payment Receipts** for both devotees and administrators.

---

## 2. Invoice Architecture & Entity Schema

```prisma
model Receipt {
  id                  String   @id @default(uuid())
  receiptNumber       String   @unique @db.VarChar(50) // e.g. REC-JD-202609-AB12CD
  bookingId           String   @unique
  paymentId           String
  amountInPaise       Int      // Integer smallest currency unit
  devoteeName         String   @db.VarChar(150)
  maskedPhone         String   @db.VarChar(20)         // e.g. 98****3210
  serviceTitleHi      String   @db.VarChar(255)
  serviceTitleEn      String   @db.VarChar(255)
  issuedAt            DateTime @default(now())
  createdAt           DateTime @default(now())

  booking             Booking  @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  payment             Payment  @relation(fields: [paymentId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@index([paymentId])
  @@map("receipts")
}
```

---

## 3. Invoice Document Standards & Content

Every generated invoice strictly contains:

### Header & Trust Credentials
- **Official Organization**: सिद्ध श्री जोरावर धाम सेवा समिति (ट्रस्ट)
- **Legal Trust Registration**: COOP/2023/DHOLPUR/201054
- **Address**: श्री जोरावर धाम, राजाखेड़ा रोड, धौलपुर, राजस्थान - 328001
- **Official Contact**: contact@jorawardham.org | +91 94140 12345

### Document Identifiers
- **Document Title**: INVOICE / PAYMENT RECEIPT (कर चालान एवं भुगतान रसीद)
- **Invoice Number**: `REC-JD-YYYYMM-XXXXXX`
- **Booking Reference**: `JD-YYYYMM-XXXXXX`
- **Issue Timestamp**: Formatted Date & Time

### Devotee / Billed Party
- **Devotee Name**: Primary attendee name
- **Mobile Number**: Masked for privacy (`98****3210`)

### Itemized Service Breakdown
| Item / Service Description | Slot & Date | Devotees | Rate (₹) | Amount (₹) |
| :--- | :--- | :---: | :---: | :---: |
| [Service Title Hi / En] | [Time Window], [Date] | [N] | [Unit Price] | [Total] |
| **Subtotal** | | | | [Subtotal] |
| **CGST / SGST (0% - Religious Trust)**| | | | ₹0.00 |
| **Net Total Paid** | | | | **[Total Amount]** |

### Payment & Gateway Metadata
- **Payment Status**: `PAID / CAPTURED`
- **Payment Method**: `UPI / Net Banking / Card (Razorpay)`
- **Gateway Order ID**: `order_...`
- **Gateway Payment ID**: `pay_...`
- **Paid Timestamp**: Exact recorded gateway timestamp

### Footer & Authorized Signatory
- Devotional gratitude message (*"दर्शन हेतु आपकी यात्रा मंगलमय हो। जय श्री जोरावर जी महाराज!"*)
- Digital Authorized Signatory Seal & Trust Verification Note.

---

## 4. User Portal Invoice Experience (`/[locale]/user/bookings/[id]/invoice`)

- Accessible directly from the **Booking Confirmation Card**, the **My Bookings Ledger**, and the **Booking Details** screen.
- Never displays JSON.
- Displays actions:
  - **[Print Invoice / प्रिंट करें]**: Triggers native browser print dialog configured with custom print CSS.
  - **[Download PDF / पीडीएफ सहेजें]**: Leverages standard browser print-to-PDF pipeline with styled typography, clean white margins, and high-contrast tables.
  - **[Back to Bookings / वापस जाएं]**: Safe return to booking ledger.

---

## 5. Admin Invoice Ledger & Search (`/admin/invoices`)

- Centralized ledger for temple accounting and auditors.
- Search by invoice number (`REC-...`) or booking reference (`JD-...`).
- Filter by date range and payment status.
- **Instant Preview Modal**: Allows finance administrators to view, inspect, and reprint any issued tax invoice without leaving the dashboard.

---

## 6. Security & IDOR Protections

1. **Strict Ownership Verification**:
   When a user requests `/[locale]/user/bookings/[id]/invoice`, the server verifies:
   ```typescript
   const isAuthorized = session.userId === booking.userId || session.phone === booking.primaryDevoteePhone;
   if (!isAuthorized) {
     return notFound(); // Or HTTP 403 Forbidden
   }
   ```
   Devotee A altering the URL to view Devotee B's invoice is immediately blocked.
2. **Authoritative Data Binding**:
   Amounts, descriptions, and gateway IDs are retrieved exclusively from the PostgreSQL `Receipt`, `Booking`, and `Payment` tables. Client-submitted prices or statuses are ignored.
3. **Admin RBAC Isolation**:
   Only administrators with the `payments:read` permission (`FINANCE_ADMIN` and `SUPER_ADMIN`) can access the administrative invoice repository.
