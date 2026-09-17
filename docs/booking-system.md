# Darshan & Pooja Booking System Specification

## 1. System Objective
The Shri Jorawar Dham booking system handles high-volume pilgrimage traffic for temple services, special darshan, daily aarti, and religious poojas. The architecture is engineered to guarantee:
1. **Absolute Capacity Integrity**: Zero overbooking through database row-level locking.
2. **Fair Access**: 10-minute temporary holds for uncompleted bookings with automated reclaim.
3. **Bilingual Accessibility**: Devotees can browse, book, and download passes seamlessly in Hindi or English.
4. **On-Premise Operations**: Staff can issue counter passes directly for walk-in devotees.

---

## 2. Booking Lifecycle States

```
[Devotee Requests Slot]
          |
          v
+------------------+       10-minute timeout
| PENDING_PAYMENT  | ----------------------------> [EXPIRED]
+------------------+                               (Capacity released)
          |
          | Payment verified via HMAC / Free service
          v
+------------------+       Devotee or Admin Cancel
|    CONFIRMED     | ----------------------------> [CANCELLED] / [REFUND_PENDING]
+------------------+                               (Capacity released)
          |
          | QR code scanned at temple entrance
          v
+------------------+
|   CHECKED_IN     | (Entry approved, re-scan blocked)
+------------------+
```

---

## 3. Concurrency Protection & Anti-Overbooking

During high-demand festivals (e.g. Navratri, Janmashtami, Annakoot), hundreds of devotees simultaneously attempt to book popular slots. Standard application-level checking is susceptible to race conditions. 

### The `SELECT ... FOR UPDATE` Solution
When a booking is initiated, the backend opens an interactive Prisma transaction:

1. **Acquire Lock**:
   ```sql
   SELECT "id", "capacity", "bookedCount"
   FROM "service_slots"
   WHERE "id" = $1
   FOR UPDATE;
   ```
2. **Evaluate Availability**:
   The database engine locks the row until transaction commit. The system inspects:
   `available = slot.capacity - slot.bookedCount`.
3. **Branch Decision**:
   - If `requestedDevotees <= available`: The system increments `bookedCount` and writes the `Booking` record in `PENDING_PAYMENT` status with `expiresAt = now() + 10 minutes`.
   - If `requestedDevotees > available`: A `CapacityExceededError` is thrown, aborting the transaction immediately without modifying database state.

### Automated Sweeper for Expired Holds
If a devotee abandons the payment screen, the 10-minute hold must not block other pilgrims. A background cron endpoint (`/api/cron/expire-bookings`) runs periodically:
* Finds bookings where `bookingStatus = PENDING_PAYMENT` and `expiresAt < now()`.
* Updates status to `EXPIRED`.
* Decrements `service_slots.bookedCount` by `numberOfDevotees`, making the seats instantly available again.

---

## 4. Manual Spot Counter Passes
For elderly pilgrims or rural visitors arriving without smartphones, authorized temple administrators (`BOOKING_ADMIN` or `SUPER_ADMIN`) can issue instant counter passes via `/admin/bookings`:
* **Input**: Devotee name, phone number, service selection, date, slot, and number of companions.
* **Execution**: Executed using the same concurrency-safe transaction logic. Counter bookings are automatically marked `CONFIRMED` and given an instant printable receipt and QR pass.
* **Audit Logging**: An audit entry is registered recording the issuing administrator's identity and timestamp.

---

## 5. Rescheduling Policy & Architecture
Devotees or administrators may reschedule confirmed bookings subject to availability:
1. **Target Slot Lock**: The new requested slot is locked via `SELECT ... FOR UPDATE`.
2. **Atomic Swap**:
   - The new slot's `bookedCount` is incremented.
   - The original slot's `bookedCount` is decremented.
   - The booking's `slotId` and `bookingDate` are updated.
   - A new QR ticket security token is generated to invalidate the prior pass.
3. **Audit & Notification**: An audit log is recorded, and an updated confirmation SMS/notification is dispatched.

---

## 6. Digital QR Ticket Verification at Temple Gates
* **Generation**: Upon confirmation, an opaque cryptographic token is embedded into a high-density QR code alongside the booking reference.
* **Scanner Portal**: Temple staff use `/admin/scanner` with mobile camera or handheld barcode scanners.
* **Validation**:
  1. The scanner posts `{ bookingReference, qrSecurityToken }` to `/api/admin/bookings/check-in`.
  2. If the ticket is authentic and currently `CONFIRMED`, the record is atomically marked `CHECKED_IN`, recording `checkedInAt` and `checkedInByAdminId`.
  3. If already checked in, the gate terminal sounds a distinct warning chime with `ALREADY_CHECKED_IN`, preventing ticket sharing or gate re-entry.
