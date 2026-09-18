# BOOKING SYSTEM (दर्शन एवं पूजा बुकिंग प्रणाली) — TECHNICAL SPECIFICATION

## 1. System Architecture & Lifecycle Overview

The Jorawar Dham booking system provides an end-to-end transactional pipeline for darshan and pooja reservations. It guarantees that physical temple capacity is strictly respected, preventing overbooking under high-concurrency festival conditions.

```text
  [ Devotee Browser ]
           │
           ├── 1. Service Selection (Fetch from /api/public/services)
           ├── 2. Date Selection (Check 30-day live availability /api/services/[slug]/availability)
           ├── 3. Time Slot Discovery (Query server-calculated remaining seats)
           ├── 4. Devotee & Companion Details
           ├── 5. Review & Pricing (Authoritative server pricing)
           │
           ▼
  [ Concurrency-Safe Booking Hold ]
  (Prisma Interactive Transaction with PostgreSQL Row Lock)
  `SELECT * FROM service_slots WHERE id = $slotId FOR UPDATE`
           │
           ├── Allocated? YES ──► Reject with CapacityExceededError
           └── Remaining? ──────► Create Booking (Status: PENDING_PAYMENT, Hold: 10 mins)
                                   Deduct available seat hold
           │
           ▼
  [ Secure Payment Gateway (Razorpay) ]
           │
           ├── Fail / Abandon / Expire ──► Sweep job marks EXPIRED, releases capacity
           └── Successful Payment ───────► Verify HMAC-SHA256 signature
                                           Mark CONFIRMED
                                           Generate Receipt & Cryptographic QR Pass
           │
           ▼
  [ Confirmation, Digital Pass & Tax Invoice ]
```

---

## 2. Multi-Step Booking Wizard (`/[locale]/booking/[serviceSlug]`)

The booking flow follows a 7-step progressive wizard:

1. **01 सेवा (Service Details)**: Service description, timing, guidelines, and pricing.
2. **02 तारीख (Date Selection)**: Interactive date picker displaying real-time status badges (`AVAILABLE`, `LIMITED`, `FULL`, `CLOSED`, `PAST`).
3. **03 समय (Time Slot)**: Available slots with real-time capacity counts (e.g. `12 / 20 available`). Disabled slots are filtered out.
4. **04 विवरण (Devotee Details)**: Primary devotee name, phone number, and dynamic companion list (names and ages).
5. **05 समीक्षा (Summary & Review)**: Itemized review showing service name, slot window, attendee count, and server-side computed total.
6. **06 भुगतान (Payment)**: Razorpay checkout integration with server-created order and HMAC validation.
7. **07 पुष्टि (Confirmation & Ticket)**: Confirmation card with unique booking reference (`JD-YYYYMM-XXXXXX`), scannable QR pass, and direct links to **[प्रवेश पास / View Ticket]** and **[कर रसीद / Download Invoice]**.

---

## 3. Concurrency Protection & Transaction Isolation

### The Problem
During auspicious festivals (e.g., Hanuman Jayanti, Navratri), hundreds of devotees attempt to book the final available seat in the morning Mangala Darshan slot simultaneously. If checked naively via `slot.bookedCount < slot.capacity`, race conditions occur and multiple bookings succeed, exceeding physical temple capacity.

### The Solution: Pessimistic Row-Level Locking
In `lib/booking/service.ts`, booking creation executes inside a Prisma interactive transaction that acquires a PostgreSQL exclusive lock:

```typescript
return await prisma.$transaction(async (tx) => {
  // 1. Acquire PostgreSQL exclusive row lock
  const lockedSlots = await tx.$queryRaw<ServiceSlot[]>`
    SELECT * FROM "service_slots"
    WHERE "id" = ${slotId} AND "serviceId" = ${serviceId} AND "isActive" = true
    FOR UPDATE
  `;

  if (!lockedSlots || lockedSlots.length === 0) {
    throw new SlotNotFoundError();
  }

  const slot = lockedSlots[0];

  // 2. Count active confirmed bookings and unexpired pending holds
  const activeBookings = await tx.booking.aggregate({
    _sum: { numberOfDevotees: true },
    where: {
      slotId,
      bookingDate: normalizedDate,
      bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
    },
  });

  const activeHolds = await tx.booking.aggregate({
    _sum: { numberOfDevotees: true },
    where: {
      slotId,
      bookingDate: normalizedDate,
      bookingStatus: BookingStatus.PENDING_PAYMENT,
      expiresAt: { gt: new Date() },
    },
  });

  const totalAllocated = (activeBookings._sum.numberOfDevotees || 0) + (activeHolds._sum.numberOfDevotees || 0);
  const remaining = slot.capacity - totalAllocated;

  if (remaining < numberOfDevotees) {
    throw new CapacityExceededError(`उपलब्ध सीटें अपर्याप्त हैं। शेष उपलब्ध सीटें: ${remaining}`);
  }

  // 3. Create booking with 10-minute hold window
  ...
});
```

---

## 4. Temporary Booking Hold & Auto-Expiry Sweep

To prevent abandoned checkouts from locking capacity indefinitely:
1. **Hold Duration**: Every pending booking is created with `expiresAt = now() + 10 minutes`.
2. **Periodic Cleanup Worker**: The endpoint `/api/cron/expire-bookings` executes `sweepExpiredBookings()`:
   ```typescript
   await prisma.booking.updateMany({
     where: {
       bookingStatus: BookingStatus.PENDING_PAYMENT,
       expiresAt: { lt: new Date() },
     },
     data: { bookingStatus: BookingStatus.EXPIRED },
   });
   ```
3. Once marked `EXPIRED`, the locked seats immediately return to the slot's pool of remaining capacity for other devotees.

---

## 5. QR Code Generation & Verification Architecture

- **Opaque Token**: Generated via `crypto.randomBytes(32).toString("hex")` and stored in `qrSecurityToken`.
- Devotee passes embed **no plaintext PII** in the QR code. Instead, the QR encodes an opaque validation URI:
  `https://jorawardham.org/ticket/verify?ref=JD-202609-AB12CD&token=f9a8b7c6...`
- **Gatekeeper Verification**:
  Temple volunteers scan the pass at the temple entry gate. The verification endpoint `/api/ticket/verify`:
  1. Validates the signature token against the database record.
  2. Confirms date and slot window.
  3. Checks if already `CHECKED_IN` to **prevent pass replay or duplicate entry**.
  4. Records `checkedInAt` and `checkedInByAdminId`.

---

## 6. Server-Side Price Calculation & Anti-Tampering

The client browser is **never trusted** for price or fees:
```typescript
// Server queries the service definition from DB
const service = await prisma.service.findUnique({ where: { id: serviceId } });
const pricePerPerson = (service.price || 0) * 100; // in paise
const authoritativeTotalPaise = pricePerPerson * numberOfDevotees;
```
If a malicious client alters the payment payload to `₹1`, server order creation uses `authoritativeTotalPaise`, ensuring zero financial loss.
