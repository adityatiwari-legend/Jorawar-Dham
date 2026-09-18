# ADMIN PORTAL (प्रशासन पोर्टल) — OPERATIONAL ARCHITECTURE & MANAGEMENT GUIDE

## 1. Overview & Operational Role
The **Admin Portal** is the command center for temple trustees, priests, finance administrators, and operational staff. Designed with a clean, high-density professional aesthetic, it provides real-time oversight of darshan schedules, slot capacities, attendee verification, financial ledgers, devotee profiles, and audit transparency.

---

## 2. Navigation & Module Hierarchy

| Section | Route | Target Roles | Core Capabilities |
| :--- | :--- | :--- | :--- |
| **Operational Dashboard** | `/admin` | All Authorized Roles | Real-time counts (today's bookings, visitors, capacity, revenue), quick actions, activity stream |
| **Services Management** | `/admin/services` | `SUPER_ADMIN`, `BOOKING_ADMIN` | Create, edit, toggle active status, set pricing, update pooja guidelines, manage capacities |
| **Slot & Calendar Management** | `/admin/slots` | `SUPER_ADMIN`, `BOOKING_ADMIN` | List view & interactive month calendar, slot creation, capacity adjustment, date duplication |
| **Booking Operations** | `/admin/bookings` | `SUPER_ADMIN`, `BOOKING_ADMIN`, `STAFF` | Search, date/status filtering, QR check-in, cancellations, devotee list export |
| **Invoices & Receipts** | `/admin/invoices` | `SUPER_ADMIN`, `FINANCE_ADMIN` | Official tax invoice ledger, search by reference, instant printable invoice modal |
| **Devotee Directory** | `/admin/devotees` | `SUPER_ADMIN`, `BOOKING_ADMIN`, `FINANCE_ADMIN` | Directory with PII masking, verified status badges, comprehensive visit and donation history |
| **Donations & Causes** | `/admin/donations` | `SUPER_ADMIN`, `FINANCE_ADMIN` | Fund management, donor PAN tracking, cause allocation, 80G receipt issuance |
| **Payment Ledger** | `/admin/payments` | `SUPER_ADMIN`, `FINANCE_ADMIN` | Gateway reconciliation, order tracking, webhook logs, refund processing |
| **Reports & Analytics** | `/admin/reports` | `SUPER_ADMIN`, `FINANCE_ADMIN` | Daily/monthly attendance trends, slot utilization rates, revenue distribution charts |
| **Audit Logs** | `/admin/audit-logs` | `SUPER_ADMIN`, `FINANCE_ADMIN` | Immutable forensic log of all administrative actions, logins, updates, and exports |

---

## 3. Operational Dashboard (`/admin`)
- **Authoritative Database Metrics**: Queries PostgreSQL directly; no placeholder or synthetic numbers.
- **Key Performance Indicators (KPIs)**:
  - *Today's Bookings & Devotees Count*
  - *Slot Utilization / Available Capacity Percentage*
  - *Daily & Lifetime Payment Revenue*
  - *Charitable Donation Collections*
- **Live Activity Stream**: Real-time audit log entries recording recent check-ins, confirmations, and administrative modifications.

---

## 4. Service Management (`/admin/services`)
- **Bilingual Content**: Manage Hindi (`titleHi`, `descriptionHi`, `timingHi`, `guidelinesHi`) and English fields.
- **Dynamic Pricing & Rules**:
  - Toggle Free (निःशुल्क) vs Paid services.
  - Set default slot duration and capacity limits.
- **Instant Activation Toggle**: Enable or disable services with immediate, transactional reflection on the public booking portal.

---

## 5. Slot & Calendar Management (`/admin/slots`)
- **Dual View Modes**:
  1. **List View**: Rapid table showing date, time window, capacity, booked count, remaining seats, and status badges.
  2. **Interactive Calendar Grid**: Full month view with visual density indicators (`● Available`, `● Limited`, `● Full`, `● Off`). Clicking any date opens a day panel displaying all active slots and their real-time remaining capacities.
- **Single-Slot Creation & Editing**: Modify start/end times, adjust total capacity, or change status to `DISABLED`.
- **Immediate Invalidation**: Disabling a slot locks it server-side instantly; public users attempting to book will receive an immediate error and cannot proceed.
- **Bulk Date Duplication**: Duplicate an entire day's slot configuration across multiple future dates (e.g., repeating daily Aarti and Darshan schedules for the upcoming month).

---

## 6. Invoices & Receipts Management (`/admin/invoices`)
- Complete audit ledger of all issued booking receipts and tax invoices.
- Filter by date range, payment status, or search by receipt number (`REC-JD-...`) and booking reference.
- **Printable Modal**: Click **"View & Print"** to open the fully formatted tax invoice preview with print stylesheets ready for high-resolution printing or PDF export.

---

## 7. Devotee Directory & Privacy Controls (`/admin/devotees`)
- Dedicated devotee relationship management view.
- **Data Minimization & PII Protection**:
  - Devotee mobile numbers are masked (`98****3210`) in general views to protect personal data.
  - Detailed profiles are accessible only by privileged roles (`SUPER_ADMIN`, `BOOKING_ADMIN`, `FINANCE_ADMIN`).
- **Devotee Profile Drawer**:
  - Total visits / bookings count.
  - Verified phone / email status.
  - Full history of darshan bookings with direct links to booking details.
  - Complete record of charitable contributions and receipts.

---

## 8. Role-Based Access Control (RBAC) Matrix

| Permission Code | SUPER_ADMIN | FINANCE_ADMIN | BOOKING_ADMIN | CONTENT_ADMIN | EVENT_ADMIN | STAFF |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| `services:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `services:write` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `bookings:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |
| `bookings:manage` | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `payments:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `payments:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `donations:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `donations:manage` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `reports:read` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| `reports:export` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| `users:manage` | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `audit:read` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 9. Export Security & Forensic Logging
1. **CSV Formula Injection Prevention**:
   All text fields exported in reports are sanitized against leading `=`, `+`, `-`, or `@` characters to prevent formula execution in Microsoft Excel.
2. **Mandatory Action Auditing**:
   Every slot modification, booking cancellation, manual override, and data export generates an immutable `AuditLog` entry recording `actorId`, `ipAddress`, `timestamp`, and state diffs.
