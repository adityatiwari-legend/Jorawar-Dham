# DONATION SYSTEM (दान एवं सहयोग प्रणाली) — ARCHITECTURE & FINANCIAL SPECIFICATION

## 1. Overview & Charitable Purpose
The **Donation System** provides a sacred, transparent platform for devotees to support the religious, charitable, and social initiatives of Siddh Shri Joravar Dham. It encompasses donor onboarding, PAN validation, Razorpay gateway integration, authoritative receipt generation, and administrative reconciliation.

---

## 2. Architecture & Data Flow

```text
  [ Devotee / Donor ]
           │
           ├── 1. Select Cause (Annakshetra, Goushala, Temple Renovation, etc.)
           ├── 2. Choose Amount (Preset: ₹251, ₹501, ₹1100, ₹2100, ₹5100 or Custom)
           ├── 3. Enter Donor Information (Full Name, Phone, Email, PAN, Address)
           ├── 4. Optional Anonymous Flag
           │
           ▼
  [ Backend Order Generation ]
  POST /api/donations/create-order
           │
           ├── Validate minimum amount (min ₹10)
           ├── Validate PAN format (if provided): ^[A-Z]{5}[0-9]{4}[A-Z]{1}$
           ├── Generate unique donationReference (DON-YYYYMM-XXXXXX)
           ├── Create Razorpay order with authoritative server amount
           │
           ▼
  [ Razorpay Standard Checkout ]
           │
           ▼
  [ Payment Verification & Receipt Issuance ]
  POST /api/donations/verify
           │
           ├── Verify HMAC-SHA256 signature against RAZORPAY_KEY_SECRET
           ├── Update Donation status to PAID, record paidAt timestamp
           ├── Generate unique official receiptNumber (REC-DON-YYYYMM-XXXXXX)
           │
           ▼
  [ Dedicated Formatted Charitable Receipt ]
  Devotee can View, Print, or Save as PDF (/user/donations/[id]/receipt)
```

---

## 3. Devotee Donation Portal (`/[locale]/user/donations`)

### 3.1 Make a Donation (दान करें)
- Devotee selects a charitable initiative:
  - **अन्नक्षेत्र सेवा (Annakshetra - Free Kitchen)**: Daily prasad & meals for visiting pilgrims.
  - **गौशाला सेवा (Goushala - Cow Welfare)**: Nutrition and medical care for temple cows.
  - **मंदिर निर्माण एवं विकास (Mandir Nirman & Renovation)**: Heritage preservation and infrastructure.
  - **दैनिक पूजा एवं आरती (Daily Pooja & Aarti)**: Flowers, incense, and sacred offerings.
  - **सामान्य दान कोष (General Trust Fund)**: Unrestricted charitable activities.
- One-click suggested donation chips or custom amount input.
- Secure checkout modal powered by Razorpay.

### 3.2 Donation History & Receipts (दान इतिहास)
- Tabular record of all contributions made by the devotee.
- Displays: Donation ID, Date, Cause, Amount, Gateway Reference, and Status Badge.
- Direct link to **[रसीद देखें / View Receipt]**.
- Empty state: *"अभी कोई दान इतिहास उपलब्ध नहीं है।"* with a prominent **[दान करें]** CTA.

---

## 4. Dedicated Charitable Receipt (`/[locale]/user/donations/[id]/receipt`)

Eliminating raw API JSON, this page renders a formatted charitable receipt:
- **Trust Header & Crest**: सिद्ध श्री जोरावर धाम सेवा समिति (ट्रस्ट)
- **Legal Registration**: COOP/2023/DHOLPUR/201054
- **Receipt Details**:
  - Receipt Number: `REC-DON-202609-AB12CD`
  - Donation Date: Formatted date and time
  - Donor Name: Provided donor or "Anonymous Devotee (गुमनाम श्रद्धालु)"
  - Donor PAN: Masked/formatted PAN for tax documentation
  - Amount: Large formatted currency (`₹1,100.00`) and amount in words
  - Allocated Cause: Specific cause title in Hindi and English
  - Gateway Reference & Payment ID
- **Official Seal & Note**: Includes authorized signatory stamp and clear legal declaration without false exemption promises.
- **Print & PDF Support**: Fully formatted with `@media print` CSS for direct one-click browser printing.

---

## 5. Admin Donation Management (`/admin/donations`)
- **Real-Time Financial Oversight**:
  - Total funds collected per cause and aggregate lifetime collections.
  - Search donations by receipt number, donor name, or phone number.
  - Filter by date range, cause, and payment status (`PAID`, `PENDING`, `REFUNDED`).
- **Devotee Reconciliation**:
  - Direct links to donor profile in the Devotee Directory.
- **Export & Reporting**:
  - Secure CSV/XLS export with sanitization against formula injection (`=`, `@`, `+`, `-`).
  - Access strictly governed by `FINANCE_ADMIN` and `SUPER_ADMIN` permissions.
