# SLOT MANAGEMENT (समय स्लॉट एवं क्षमता प्रबंधन) — ARCHITECTURE & OPERATIONS

## 1. Overview & Slot Modeling

Slot management controls physical visitor flow through Siddh Shri Joravar Dham. The system tracks slot capacity on a per-service, per-date, and per-time-window basis, ensuring temple sanctum limits are strictly respected.

### Database Schema Structure
```prisma
model ServiceSlot {
  id            String    @id @default(uuid())
  serviceId     String
  date          DateTime? @db.Date  // Specific date or null for daily recurring template
  startTime     String    @db.VarChar(20) // e.g. "06:00 AM"
  endTime       String    @db.VarChar(20) // e.g. "07:30 AM"
  capacity      Int       @default(50)    // Physical capacity limit
  bookedCount   Int       @default(0)     // Fast transactional cache
  priceInPaise  Int       @default(0)     // Price in paise (e.g. 25000 = ₹250)
  isActive      Boolean   @default(true)  // Instant disable flag
  sortOrder     Int       @default(0)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  service       Service   @relation(fields: [serviceId], references: [id], onDelete: Cascade)
  bookings      Booking[]

  @@index([serviceId, date, isActive])
  @@index([serviceId, isActive, sortOrder])
  @@map("service_slots")
}

model BlockedDate {
  id          String   @id @default(uuid())
  serviceId   String?  // null applies to all services
  date        DateTime @db.Date
  reasonHi    String   @db.VarChar(255)
  reasonEn    String   @db.VarChar(255)
  ...
}
```

---

## 2. Slot States & Availability Rules

Every time slot evaluates dynamically on the server into one of five functional states:

| State | Condition | Devotee Portal UI | Booking Action |
| :--- | :--- | :--- | :--- |
| **OPEN / AVAILABLE** | `isActive === true && remaining > 5` | Green badge (`उपलब्ध / Available`) with seat count | Allowed |
| **LIMITED** | `isActive === true && remaining > 0 && remaining <= 5` | Amber badge (`सीमित / Limited`) | Allowed |
| **FULL** | `isActive === true && remaining <= 0` | Red badge (`पूर्ण / Full`) | **Disabled / Prohibited** |
| **DISABLED / CLOSED**| `isActive === false` or Date is blocked | Gray badge (`बंद / Closed`) | **Disabled / Prohibited** |
| **PAST** | Slot time is in the past for today's date | Gray badge (`बीत चुका / Past`) | **Disabled / Prohibited** |

---

## 3. Server-Side Availability Calculation

Availability calculation is **authoritative and server-side**. Client-provided counts are never trusted.

### 30-Day Availability Endpoint (`/api/services/[slug]/availability`)
1. Fetches all slots and active bookings for the specified service across the next 30 days.
2. Checks for `BlockedDate` entries.
3. For each date:
   - Sums capacities of all active slots on that date.
   - Sums confirmed bookings (`CONFIRMED`, `CHECKED_IN`) + active hold bookings (`PENDING_PAYMENT` where `expiresAt > now()`).
   - Calculates `remainingCapacity = totalCapacity - totalBooked`.
   - Returns date status: `AVAILABLE`, `LIMITED`, `FULL`, `CLOSED`, or `PAST`.

---

## 4. Admin Slot Management & Calendar UI (`/admin/slots`)

### 4.1 Dual Mode Interface
1. **List View**: Rapid tabular audit view showing all slots, service filter, date filter, capacity, and inline toggles.
2. **Interactive Calendar Grid**:
   - Visual month layout displaying status dots on every calendar date.
   - Clicking a date opens a dedicated slide-out day panel showing every scheduled slot, booked count, remaining seats, and quick actions.

### 4.2 Creating a New Slot
Admin specifies:
- Service selection
- Specific date or recurring daily schedule
- Start time (e.g. `06:00 AM`) and End time (e.g. `08:00 AM`)
- Capacity limit (e.g. `100 devotees`)
- Slot price (in Rupees)

### 4.3 Instant Disabling of Slots
- Clicking **"Disable"** sets `isActive = false` in the database.
- **Immediate Effect**: The slot vanishes from public availability immediately. Any in-flight booking attempts against this slot are rejected with `SlotNotFoundError` or `Slot not open for booking`.
- Disabling is persistent in PostgreSQL; refreshing the page or restarting the server preserves the disabled state.

### 4.4 Bulk Slot Duplication
To streamline management:
1. Admin configures a master day schedule (e.g. 5 Aarti and Darshan slots on a Monday).
2. Admin selects **"Duplicate Slots"**, picks target future dates (e.g. all days next week), and submits.
3. The system replicates the slot configurations across the selected dates within a single atomic transaction.
