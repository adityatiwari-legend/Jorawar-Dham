import { prisma } from "../lib/db/client";
import { createConcurrencySafeBooking, CapacityExceededError } from "../lib/booking/service";

async function runConcurrencyTests() {
  console.log("==================================================");
  console.log("🔥 RUNNING CRITICAL BOOKING CONCURRENCY TESTS");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`✅ PASS: ${msg}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${msg}`);
      failed++;
    }
  }

  // Find or create test service
  let testService = await prisma.service.findFirst({
    where: { slug: "concurrency-test-service" },
  });

  if (!testService) {
    testService = await prisma.service.create({
      data: {
        slug: "concurrency-test-service",
        titleHi: "परीक्षण समवर्ती दर्शन",
        titleEn: "Concurrency Test Darshan",
        descriptionHi: "समवर्ती परीक्षण हेतु सेवा",
        descriptionEn: "Service for concurrency testing",
        price: 101, // ₹101
        capacity: 100,
        isActive: true,
      },
    });
  }

  // Create dedicated test slot with capacity = 1
  const testSlot = await prisma.serviceSlot.create({
    data: {
      serviceId: testService.id,
      startTime: "12:00",
      endTime: "12:30",
      capacity: 1, // EXACTLY 1 SEAT!
      priceInPaise: 10100,
      isActive: true,
    },
  });

  // Find or create test user
  let testDevotee = await prisma.user.findUnique({
    where: { phone: "+919999900001" },
  });
  if (!testDevotee) {
    testDevotee = await prisma.user.create({
      data: {
        phone: "+919999900001",
        fullName: "Concurrency Tester",
        isPhoneVerified: true,
      },
    });
  }

  const targetDate = new Date("2026-11-15T00:00:00.000Z");

  try {
    console.log("\n🧪 Test 1: 15 Concurrent Simultaneous Requests Competing for 1 Available Seat");
    console.log(`   Slot ID: ${testSlot.id} | Capacity: 1 | Contenders: 15`);

    // Prepare 15 concurrent booking attempts
    const contenders = Array.from({ length: 15 }, (_, i) => ({
      serviceId: testService.id,
      slotId: testSlot.id,
      userId: testDevotee.id,
      bookingDate: targetDate,
      primaryDevoteeName: `Contender #${i + 1}`,
      primaryDevoteePhone: `+91999990000${i % 10}`,
      numberOfDevotees: 1,
    }));

    // Fire all 15 promises simultaneously
    const startTime = Date.now();
    const results = await Promise.allSettled(
      contenders.map((c) => createConcurrencySafeBooking(c))
    );
    const elapsed = Date.now() - startTime;
    console.log(`   ⚡ All 15 concurrent operations resolved in ${elapsed}ms`);

    const fulfilled = results.filter((r) => r.status === "fulfilled");
    const rejected = results.filter((r) => r.status === "rejected");

    assert(
      fulfilled.length === 1,
      `Exactly 1 request succeeded (Expected: 1, Actual: ${fulfilled.length})`
    );
    assert(
      rejected.length === 14,
      `Exactly 14 requests were rejected (Expected: 14, Actual: ${rejected.length})`
    );

    // Verify error types on rejected promises
    const capacityErrors = rejected.filter(
      (r: any) =>
        r.reason instanceof CapacityExceededError ||
        (r.reason?.message && r.reason.message.includes("क्षमता उपलब्ध नहीं है"))
    );
    assert(
      capacityErrors.length === 14,
      `All 14 rejections were strictly due to CapacityExceededError (Count: ${capacityErrors.length})`
    );

    // Verify database row count
    const dbBookingsCount = await prisma.booking.count({
      where: {
        slotId: testSlot.id,
        bookingDate: targetDate,
      },
    });
    assert(
      dbBookingsCount === 1,
      `Database strictly enforces capacity limit: exactly 1 booking in database (Count: ${dbBookingsCount})`
    );

    // Test 2: Partial Capacity Allocation
    console.log("\n🧪 Test 2: Partial Multi-seat Capacity Exhaustion");
    const multiSeatSlot = await prisma.serviceSlot.create({
      data: {
        serviceId: testService.id,
        startTime: "13:00",
        endTime: "13:30",
        capacity: 5, // 5 total seats
        priceInPaise: 5000,
        isActive: true,
      },
    });

    // User A books 3 seats -> Success
    const bookingA = await createConcurrencySafeBooking({
      serviceId: testService.id,
      slotId: multiSeatSlot.id,
      userId: testDevotee.id,
      bookingDate: targetDate,
      primaryDevoteeName: "Devotee Group A",
      primaryDevoteePhone: "+919999900010",
      numberOfDevotees: 3,
    });
    assert(Boolean(bookingA.bookingReference), "Devotee Group A successfully books 3 of 5 seats");

    // User B attempts to book 3 seats (3 + 3 = 6 > 5) -> Must fail
    let userBFailedWithCapacity = false;
    try {
      await createConcurrencySafeBooking({
        serviceId: testService.id,
        slotId: multiSeatSlot.id,
        userId: testDevotee.id,
        bookingDate: targetDate,
        primaryDevoteeName: "Devotee Group B",
        primaryDevoteePhone: "+919999900020",
        numberOfDevotees: 3,
      });
    } catch (err: any) {
      if (err instanceof CapacityExceededError || err.message?.includes("क्षमता")) {
        userBFailedWithCapacity = true;
      }
    }
    assert(
      userBFailedWithCapacity,
      "Devotee Group B rejected because 3 seats requested exceeds remaining capacity of 2"
    );

    // User C books remaining 2 seats -> Success (Exact match)
    const bookingC = await createConcurrencySafeBooking({
      serviceId: testService.id,
      slotId: multiSeatSlot.id,
      userId: testDevotee.id,
      bookingDate: targetDate,
      primaryDevoteeName: "Devotee Group C",
      primaryDevoteePhone: "+919999900030",
      numberOfDevotees: 2,
    });
    assert(Boolean(bookingC.bookingReference), "Devotee Group C successfully books exactly remaining 2 seats");

    // Cleanup multiSeatSlot bookings
    await prisma.booking.deleteMany({
      where: { slotId: multiSeatSlot.id },
    });
    await prisma.serviceSlot.delete({ where: { id: multiSeatSlot.id } });
  } finally {
    // Cleanup test records
    await prisma.booking.deleteMany({
      where: { slotId: testSlot.id },
    });
    await prisma.serviceSlot.delete({ where: { id: testSlot.id } });
    await prisma.service.delete({ where: { id: testService.id } });
    await prisma.user.delete({ where: { id: testDevotee.id } });
  }

  console.log("\n==================================================");
  console.log(`CONCURRENCY TEST SUMMARY: ${passed} PASSED | ${failed} FAILED`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runConcurrencyTests().catch((e) => {
  console.error("Fatal test runner error:", e);
  process.exit(1);
});
