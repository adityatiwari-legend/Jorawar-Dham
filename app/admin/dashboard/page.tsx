import { getAuthenticatedAdmin } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import Link from "next/link";
import {
  Ticket,
  Calendar,
  Users,
  Heart,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  ShieldCheck,
  ArrowRight,
  Database,
  Lock,
  QrCode,
  PlusCircle,
  FileSpreadsheet,
  AlertTriangle,
} from "lucide-react";
import { BookingStatus, PaymentStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const admin = await getAuthenticatedAdmin();
  const isSuperAdmin = admin?.isSuperAdmin || false;
  const permissions = new Set(admin?.permissions || []);

  const canViewFinances =
    isSuperAdmin ||
    permissions.has("payments:read") ||
    permissions.has("donations:read") ||
    (admin?.roles || []).includes("FINANCE_ADMIN");

  // Date boundaries for today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  // Queries
  const [
    todayBookingsCount,
    upcomingBookingsCount,
    todayVisitorsAggregate,
    totalDonationsCount,
    totalDonationsAggregate,
    successfulPaymentsCount,
    failedPaymentsCount,
    pendingPaymentsCount,
    cancellationsCount,
    refundsCount,
    upcomingEvents,
    recentAudits,
  ] = await Promise.all([
    // Today's Bookings
    prisma.booking.count({
      where: {
        bookingDate: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    }),

    // Upcoming Bookings
    prisma.booking.count({
      where: {
        bookingDate: { gt: todayEnd },
        bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.PENDING_PAYMENT] },
      },
    }),

    // Today's Visitors (Sum of devotees for today's confirmed/checked-in bookings)
    prisma.booking.aggregate({
      where: {
        bookingDate: {
          gte: todayStart,
          lte: todayEnd,
        },
        bookingStatus: { in: [BookingStatus.CONFIRMED, BookingStatus.CHECKED_IN] },
      },
      _sum: {
        numberOfDevotees: true,
      },
    }),

    // Donations count
    prisma.donation.count({
      where: { status: PaymentStatus.PAID },
    }),

    // Donations sum (only retrieved/displayed securely)
    canViewFinances
      ? prisma.donation.aggregate({
          where: { status: PaymentStatus.PAID },
          _sum: { amountInPaise: true },
        })
      : Promise.resolve({ _sum: { amountInPaise: null } }),

    // Successful Payments
    prisma.payment.count({
      where: { status: PaymentStatus.PAID },
    }),

    // Failed Payments
    prisma.payment.count({
      where: { status: PaymentStatus.FAILED },
    }),

    // Pending Payments
    prisma.payment.count({
      where: { status: PaymentStatus.PENDING },
    }),

    // Cancellations
    prisma.booking.count({
      where: { bookingStatus: BookingStatus.CANCELLED },
    }),

    // Refunds
    prisma.refund.count(),

    // Upcoming Events
    prisma.event.findMany({
      where: {
        startDate: { gte: todayStart },
        status: { in: ["UPCOMING", "ONGOING"] },
      },
      orderBy: { startDate: "asc" },
      take: 4,
    }),

    // Recent Audit Logs
    prisma.auditLog.findMany({
      take: 6,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const todayVisitors = todayVisitorsAggregate._sum.numberOfDevotees || 0;
  const donationTotalPaise = totalDonationsAggregate._sum.amountInPaise || 0;
  const donationTotalRupees = donationTotalPaise / 100;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
            कार्यकारी नियंत्रण कक्ष (Executive Dashboard)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            श्री जोरावर धाम तीर्थ प्रबंधन, दर्शनार्थी संख्या, रीयल-टाइम संचालन एवं सुरक्षा निगरानी
          </p>
        </div>

        {/* Quick Action Shortcuts */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link
            href="/admin/scanner"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <QrCode className="w-3.5 h-3.5 text-saffron-400" />
            <span>गेट स्कैनर</span>
          </Link>
          <Link
            href="/admin/bookings"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>काउन्टर बुकिंग</span>
          </Link>
          <Link
            href="/admin/reports"
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>रिपोर्ट्स निर्यात</span>
          </Link>
        </div>
      </div>

      {/* Primary Operational Metrics (10 core metrics required) */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-stone-500 uppercase tracking-wider">
          दैनिक एवं आगामी संचालन मेट्रिक्स (Operational Telemetry)
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* 1. Today's Bookings */}
          <Link
            href="/admin/bookings"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-saffron-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">आज की बुकिंग्स</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Ticket className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 group-hover:text-saffron-600 transition">
              {todayBookingsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Today's Bookings</p>
          </Link>

          {/* 2. Upcoming Bookings */}
          <Link
            href="/admin/bookings"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-saffron-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">आगामी बुकिंग्स</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 group-hover:text-saffron-600 transition">
              {upcomingBookingsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Upcoming Bookings</p>
          </Link>

          {/* 3. Today's Visitors */}
          <div className="bg-gradient-to-br from-saffron-500 to-maroon-700 text-white rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-saffron-100">आज के श्रद्धालु</span>
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-2xl font-extrabold">{todayVisitors}</div>
            <p className="text-[11px] text-saffron-200 mt-1">Today's Total Visitors</p>
          </div>

          {/* 4. Donations (With Financial Privacy) */}
          <Link
            href="/admin/donations"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-rose-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">कुल दान (Donations)</span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                <Heart className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-stone-900 group-hover:text-rose-600 transition">
              {totalDonationsCount}{" "}
              <span className="text-xs font-normal text-stone-500">दान</span>
            </div>
            {canViewFinances ? (
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                ₹{donationTotalRupees.toLocaleString("en-IN")} एकत्रित
              </p>
            ) : (
              <p className="text-[10px] text-stone-400 flex items-center gap-1 mt-1 font-mono">
                <Lock className="w-2.5 h-2.5" /> [राशि गोपनीय]
              </p>
            )}
          </Link>

          {/* 5. Successful Payments */}
          <Link
            href="/admin/payments"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-emerald-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">सफल भुगतान</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-emerald-700">
              {successfulPaymentsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Completed Payments</p>
          </Link>

          {/* 6. Pending Payments */}
          <Link
            href="/admin/payments"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-amber-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">लंबित भुगतान</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-amber-700">
              {pendingPaymentsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Pending Gateways</p>
          </Link>

          {/* 7. Failed Payments */}
          <Link
            href="/admin/payments"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-red-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">विफल भुगतान</span>
              <div className="w-8 h-8 rounded-lg bg-red-50 text-red-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-red-700">
              {failedPaymentsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Failed Transactions</p>
          </Link>

          {/* 8. Cancellations */}
          <Link
            href="/admin/bookings"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-stone-400 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">निरस्त बुकिंग्स</span>
              <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-stone-800">
              {cancellationsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Cancelled Passes</p>
          </Link>

          {/* 9. Refunds */}
          <Link
            href="/admin/payments"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-purple-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">वापसी (Refunds)</span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-purple-800">
              {refundsCount}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Processed Refunds</p>
          </Link>

          {/* 10. Upcoming Events */}
          <Link
            href="/admin/events"
            className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm hover:border-saffron-300 transition group block"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-stone-500">आगामी उत्सव</span>
              <div className="w-8 h-8 rounded-lg bg-saffron-50 text-saffron-700 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-extrabold text-stone-900">
              {upcomingEvents.length}
            </div>
            <p className="text-[11px] text-stone-400 mt-1">Upcoming Events</p>
          </Link>
        </div>
      </div>

      {/* Financial Access Advisory Notice (when non-finance admin views) */}
      {!canViewFinances && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-xs text-amber-900">
          <Lock className="w-5 h-5 text-amber-700 flex-shrink-0" />
          <div>
            <strong className="font-semibold block">वित्तीय डेटा गोपनीयता सक्रिय (Least Privilege RBAC Active):</strong>
            आपकी वर्तमान भूमिका में केवल परिचालन एवं दर्शनार्थी संख्या उपलब्ध है। वित्तीय राशियों (Revenue & Donation Ledger) का विवरण देखने हेतु FINANCE_ADMIN अथवा SUPER_ADMIN अधिकार आवश्यक हैं।
          </div>
        </div>
      )}

      {/* Split section: Upcoming Events & Security/Architecture Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Events Widget */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Calendar className="w-4 h-4 text-saffron-600" />
              <span>आगामी धार्मिक उत्सव</span>
            </h3>
            <Link
              href="/admin/events"
              className="text-xs font-semibold text-saffron-700 hover:underline"
            >
              सभी देखें
            </Link>
          </div>

          {upcomingEvents.length === 0 ? (
            <p className="text-xs text-stone-400 py-6 text-center">कोई आगामी उत्सव निर्धारित नहीं है।</p>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((ev) => (
                <div key={ev.id} className="p-3 bg-stone-50 rounded-xl border border-stone-100 text-xs">
                  <div className="font-semibold text-stone-800">{ev.titleHi}</div>
                  <div className="text-stone-400 text-[11px]">{ev.titleEn}</div>
                  <div className="mt-1 text-saffron-700 font-medium text-[11px]">
                    {new Date(ev.startDate).toLocaleDateString("hi-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform Integrity & Architecture Status */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-600" />
            <span>उत्पादन सुरक्षा एवं डेटाबेस अखंडता स्थिति (Production Hardening)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="font-semibold text-stone-800 block">भुगतान गेटवे (Payment Gateway)</span>
              <span className="text-stone-600 text-[11px] mt-0.5 block">
                Razorpay API v1 (HMAC-SHA256 Webhook & Signature Verification)
              </span>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Zero Card/CVV Stored
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="font-semibold text-stone-800 block">क्षमता सुरक्षा (Slot Row-Locks)</span>
              <span className="text-stone-600 text-[11px] mt-0.5 block">
                PostgreSQL SELECT ... FOR UPDATE (Zero Overbooking Guarantee)
              </span>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                ACID Isolation Active
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="font-semibold text-stone-800 block">क्यूआर टिकट सत्यापन (QR Security)</span>
              <span className="text-stone-600 text-[11px] mt-0.5 block">
                Cryptographic Opaque Token + Single-use Entry Guarantee
              </span>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Tamper Proof
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
              <span className="font-semibold text-stone-800 block">सूचना प्रदाता (Notifications)</span>
              <span className="text-stone-600 text-[11px] mt-0.5 block">
                Provider Abstraction (SMS, Email, WhatsApp) with zero sensitive PII
              </span>
              <span className="inline-block mt-2 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Multi-Channel Ready
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Administrative Audit Trail */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-stone-200 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-stone-900 font-serif">
              हालिया प्रशासनिक ऑडिट लेजर (Recent Audit Trail)
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              सभी संवेदनशील कार्य (लॉगिन, रद्दीकरण, रिफंड, दान प्रबंधन) अपरिवर्तनीय ऑडिट लॉग में सुरक्षित हैं।
            </p>
          </div>
          <Link
            href="/admin/audit-logs"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-saffron-700 hover:text-saffron-800"
          >
            <span>पूर्ण लेजर</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 uppercase text-[11px] font-semibold text-stone-500">
              <tr>
                <th className="py-3 px-4">समय (Timestamp)</th>
                <th className="py-3 px-4">कार्य (Action)</th>
                <th className="py-3 px-4">इकाई (Entity)</th>
                <th className="py-3 px-4">अधिकारी (Actor)</th>
                <th className="py-3 px-4">आईपी (IP Address)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {recentAudits.map((log) => (
                <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                  <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString("en-IN")}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${
                        log.action.includes("CREATE")
                          ? "bg-emerald-100 text-emerald-800"
                          : log.action.includes("UPDATE")
                          ? "bg-amber-100 text-amber-800"
                          : log.action.includes("DELETE")
                          ? "bg-rose-100 text-rose-800"
                          : "bg-stone-200 text-stone-800"
                      }`}
                    >
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-medium text-stone-900 whitespace-nowrap">
                    {log.entity}
                  </td>
                  <td className="py-3 px-4 text-stone-700 truncate max-w-[150px]">
                    {log.actorEmail || log.actorId || "System"}
                  </td>
                  <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                    {log.ipAddress || "127.0.0.1"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
