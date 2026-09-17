# Shri Jorawar Dham Platform – Administrative Operations Manual

## 1. Introduction & Portal Access
The Shri Jorawar Dham Administrative Command Portal is accessible at `/admin/login`. The system enforces strict role-based access control (RBAC), multi-layer session security, tamper-resistant audit trails, and automatic financial privacy redaction for non-finance personnel.

```
+-------------------------------------------------------------------------------+
|                             ADMINISTRATIVE MODULES                            |
+-------------------------------------------------------------------------------+
|  1. Dashboard        : Operational metrics, visitor telemetry, platform health|
|  2. Bookings         : Pass search, filter, counter bookings, rescheduling    |
|  3. Slots & Capacity : Service capacity management, time windows, blocks     |
|  4. Payments Ledger  : Razorpay transaction reconciliation, refund processing |
|  5. Donations        : Donor records, cause configuration, receipts           |
|  6. Entrance Scanner : Live QR validation at temple gates                     |
|  7. Reports          : Analytics, service popularity, permissioned CSV exports|
|  8. User Management  : Admin accounts, RBAC role assignment (Super Admin only)|
|  9. CMS Pages        : Dynamic multilingual content for public website pages  |
| 10. Events & Melas   : Religious festivals, melas, and ceremonies             |
| 11. Sacred Gallery   : High-resolution media management                       |
| 12. Site Settings    : Global temple contact info, timings, social channels   |
| 13. Audit Ledger     : Immutable chronological log of all privileged actions  |
+-------------------------------------------------------------------------------+
```

---

## 2. Role-Based Capabilities (Least Privilege)

| Administrative Role | Operational Scope & Permitted Actions | Financial Data Access |
| :--- | :--- | :---: |
| **SUPER_ADMIN** | Full control over all modules, staff user creation, system settings, database management. | Full |
| **FINANCE_ADMIN** | Access to Payments Ledger, Donation Records, Refund execution, and Financial CSV exports. | Full |
| **BOOKING_ADMIN** | Counter booking pass issuance, slot rescheduling, devotee cancellation processing. | Counts only (amounts masked) |
| **CONTENT_ADMIN** | Dynamic CMS pages, history, sacred narrative, gallery photo updates, announcements. | Restricted (hidden) |
| **EVENT_ADMIN** | Creation, updating, and publication of temple events, melas, and festival schedules. | Restricted (hidden) |
| **STAFF** | Entry gate ticket QR scanner operation and pass verification. | Restricted (hidden) |

---

## 3. Operational Module Guides

### 3.1 Executive Dashboard (`/admin/dashboard`)
The dashboard displays 10 real-time operational telemetry metrics:
1. **Today's Bookings**: Passes scheduled for the current date.
2. **Upcoming Bookings**: Confirmed passes for future dates.
3. **Today's Visitors**: Cumulative pilgrim count scheduled to visit today.
4. **Donations**: Total count of charitable donations received.
5. **Successful Payments**: Completed gateway transactions.
6. **Pending Payments**: Unsettled gateway orders.
7. **Failed Payments**: Declined or timed-out transactions.
8. **Cancellations**: Cancelled passes.
9. **Refunds**: Return payments processed.
10. **Upcoming Events**: Next active temple festivals and melas.

> **Financial Privacy Rule**: If logged in without `FINANCE_ADMIN` or `SUPER_ADMIN` privileges, revenue amounts and donation rupee sums are redacted (`₹ •••••• [राशि गोपनीय]`), ensuring strict least-privilege compliance.

### 3.2 Bookings & Passes (`/admin/bookings`)
* **Search & Filter**: Search by booking reference (`JD-...`), devotee name, or 10-digit phone number. Filter by `CONFIRMED`, `CHECKED_IN`, `PENDING_PAYMENT`, or `CANCELLED`.
* **Counter Pass Issuance (Manual Booking)**: Click *"काउन्टर पास जारी करें"* to open the modal. Select service, date, slot, devotee name, phone, and group size (1–10). Submits atomically to database with ACID row locking.
* **Rescheduling**: On confirmed bookings, click the calendar icon to select a new date and slot. Re-allocates capacity atomically and generates an updated QR pass.
* **Cancellation**: In details view, click *"बुकिंग निरस्त करें"* with a mandatory reason. Releases slot capacity and queues refund if paid.
* **Export**: Click *"CSV निर्यात"* to download the filtered booking ledger with masked phone numbers.

### 3.3 Payments Ledger & Refunds (`/admin/payments`)
* **Transaction Lookup**: Search by payment reference (`PAY-...`), Razorpay Order ID (`order_...`), or Razorpay Payment ID (`pay_...`).
* **Processing Refunds**: On any completed transaction, click *"रिफंड जारी करें"*. Enter reason. The system dispatches a refund request to Razorpay, transitions status to `REFUNDED`, creates an audit record, and alerts the devotee.

### 3.4 Donations & Causes (`/admin/donations`)
* **Donation Records Tab**: Full history of donor names, cities, pan numbers (if supplied), causes, amounts, and receipt download links (`/api/donations/[id]/receipt`).
* **Configured Causes Tab**: Add or edit charitable causes (e.g. Gaushala, Annakshetra). Configure target amounts, suggested contribution presets, and toggle live visibility on the public donation portal.

### 3.5 Gate Scanner Portal (`/admin/scanner`)
* **Hardware Support**: Compatible with mobile smartphone cameras, tablet webcams, and standard 2D USB/Bluetooth barcode scanners.
* **Validation Sound & Status**:
  - Green chime: Valid pass. Displays devotee name, service, and guest count. Record is marked `CHECKED_IN`.
  - Red chime: Already checked-in or invalid pass. Entrance denied.

### 3.6 Reports & Analytics (`/admin/reports`)
* **Timeframe Filters**: View statistics for *Today*, *Last 7 Days*, *Last 30 Days*, or *All Time*.
* **Service Popularity**: Graphical bar charts displaying bookings per ritual/service.
* **PII-Minimized CSV Exports**: Dedicated buttons to download Bookings CSV, Payments CSV, and Donations CSV. Devotee phone numbers are partially masked (`98****10`) to safeguard pilgrim personal information.

### 3.7 User & Role Management (`/admin/users`)
* **Restricted to Super Admin**: Non-super admins are blocked server-side with HTTP 403.
* **Create Account**: Enter username, email, full name, secure password (hashed via Argon2id), and assign one or more specific roles.
* **Account Status**: Instantly suspend or activate staff accounts with one click.
