# USER PORTAL (श्रद्धालु सेवा पोर्टल) — ARCHITECTURE & USER GUIDE

## 1. Overview & Purpose
The **User Portal** provides a spiritual, dignified, and secure self-service portal for devotees of Siddh Shri Joravar Dham. It seamlessly bridges public darshan bookings, devotee profile management, digital passes, tax invoices, and charitable donations into a unified, authenticated experience.

---

## 2. Devotee Authentication & Navigation Flow

### Mobile OTP Authentication Flow
The devotee login system avoids complex passwords, utilizing Indian mobile number verification:
```text
Devotee clicks "दर्शन बुक करें" (Book Darshan) or "श्रद्धालु पोर्टल" (Devotee Portal)
       │
       ▼
Is devotee authenticated? (Session Cookie checked)
   ├── YES ───────────────► Directly navigate to target page (e.g., /booking or /user)
   │
   └── NO
        │
        ▼
   Redirect to /login?redirect=/booking/[serviceSlug]?date=YYYY-MM-DD
        │
        ├── 1. Enter 10-digit mobile number (+91)
        ├── 2. Rate-limited cryptographic OTP dispatched (SHA-256 hashed in DB)
        ├── 3. Enter 6-digit OTP
        │
        ▼
   Authentication Success
        │
        ▼
   Redirected back to original destination without loss of booking context!
```

---

## 3. Route Hierarchy

| Route | Purpose | Key Features |
| :--- | :--- | :--- |
| `/[locale]/user` | Devotee Dashboard | Welcome banner, Upcoming Visit hero card, live countdown, quick stats, announcements |
| `/[locale]/user/bookings` | My Bookings Ledger | Tabs: *Upcoming*, *Completed*, *Cancelled*, *All*; search, status badges, cancel modal |
| `/[locale]/user/bookings/[id]` | Booking Details | Complete companion list, service guidelines, pricing breakdown, entry gate instructions |
| `/[locale]/user/bookings/[id]/ticket` | Digital Darshan Pass | Official trust crest, scannable high-contrast QR code, security ref, print-ready |
| `/[locale]/user/bookings/[id]/invoice` | Tax Invoice & Receipt | Formatted legal invoice (COOP/2023/DHOLPUR/201054), itemized charges, print layout |
| `/[locale]/user/donations` | Donations Hub | Interactive donation form (causes, custom amount), Razorpay checkout, donation history |
| `/[locale]/user/donations/[id]/receipt`| Charitable Receipt | Official trust receipt, PAN details, transaction ref, authorized signatory stamp |

---

## 4. Key Components & Implementation

### 4.1 Devotee Dashboard (`/[locale]/user/page.tsx`)
- **Devotee Greeting**: Dynamic `"नमस्कार, [Devotee Name]"` with registered phone number.
- **Upcoming Visit Hero Card**: Highlighted sacred maroon card displaying the very next confirmed darshan, companion count, slot time, and a real-time countdown timer. Includes direct action buttons: **[प्रवेश पास / View Ticket]** and **[क्यूआर कोड / QR Code]**.
- **Quick Metric Cards**: Total darshan bookings, active upcoming passes, and lifetime charitable donations contributed.
- **Recent Bookings Table & Donation Summary**: Instant access to recent activity with status badges.
- **Empty States**: If no bookings exist, devotees are greeted with spiritual, actionable empty states (*"अभी कोई आगामी दर्शन बुकिंग नहीं है। अपने दर्शन की योजना बनाएं।"*) with a direct **[दर्शन बुक करें]** golden CTA.

### 4.2 My Bookings (`/[locale]/user/bookings/page.tsx`)
- Tabbed filtering for clean organization: **Upcoming (आगामी)**, **Completed (संपन्न)**, **Cancelled (रद्द)**, and **All (सभी)**.
- Filter search bar matching booking reference or devotee name.
- Contextual action buttons based on booking status:
  - `CONFIRMED`: View Ticket, Download Invoice, Cancel Booking.
  - `COMPLETED`: View Details, Download Invoice.
  - `CANCELLED` / `EXPIRED`: View Details.
- **Cancellation Modal**: Safe, dialog-confirmed cancellation with cancellation reason selection, immediately updating database records and releasing reserved slot capacity.

### 4.3 Digital Darshan Pass (`/[locale]/user/bookings/[id]/ticket/page.tsx`)
- Completely eliminates raw JSON output.
- Employs sacred aesthetic with temple gold accents, official trust emblem, and clear bilingual typography.
- Displays high-resolution scannable QR code generated server-side using opaque cryptographic tokens.
- Includes devotee companions breakdown and temple guidelines (arrival 15 minutes before slot, attire rules, mobile phone policy).
- Full `@media print` support enabling instant browser printing or saving as PDF.

### 4.4 Tax Invoice & Payment Receipt (`/[locale]/user/bookings/[id]/invoice/page.tsx`)
- Authoritative tax invoice generated strictly from PostgreSQL database records.
- Includes official registration details:
  - **Trust Name**: सिद्ध श्री जोरावर धाम सेवा समिति (ट्रस्ट)
  - **Registration No**: COOP/2023/DHOLPUR/201054
  - **Registered Address**: श्री जोरावर धाम, राजाखेड़ा रोड, धौलपुर, राजस्थान - 328001
- Itemized billing breakdown (Base Service Charge, GST/Statutory Fees, Net Amount).
- Authoritative payment details: Gateway Reference, Gateway Payment ID, Paid Timestamp.
- Official digital authorization seal and printable stylesheet.

### 4.5 Donation Management & Receipt (`/[locale]/user/donations/page.tsx`)
- Dedicated self-service donation interface.
- Cause selection (Annakshetra Bhandara, Goushala, Temple Renovation, etc.).
- Preset amounts (₹251, ₹501, ₹1,100, ₹2,100, ₹5,100) or custom amount input.
- Donor PAN collection strictly validated for Indian income tax compliance.
- Direct link to generate printable charitable receipts at `/[locale]/user/donations/[id]/receipt`.

---

## 5. Security & IDOR Enforcement
1. **Pessimistic Ownership Validation**:
   Every portal endpoint checks `session.userId === booking.userId || devoteePhone === booking.primaryDevoteePhone`.
2. **Zero PII Exposure in URLs**:
   All public verification URLs rely on opaque tokens (`qrSecurityToken`) rather than database primary keys.
3. **Prevention of JSON UI Leakage**:
   All pages return rich UI with responsive layouts; raw API JSON is strictly confined to internal `/api/*` routes.
