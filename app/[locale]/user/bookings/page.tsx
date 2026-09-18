"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  QrCode,
  FileText,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Search,
  Eye,
  X,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

interface BookingItem {
  id: string;
  bookingReference: string;
  serviceTitleHi: string;
  serviceTitleEn: string;
  slotTime: string;
  bookingDate: string;
  numberOfDevotees: number;
  totalAmountInPaise: number;
  status: string;
  qrSecurityToken: string;
  hasReceipt: boolean;
  receiptNumber?: string;
  createdAt: string;
}

export default function MyBookingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isHi = locale === "hi";
  const router = useRouter();

  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"UPCOMING" | "COMPLETED" | "CANCELLED" | "ALL">("UPCOMING");
  const [search, setSearch] = useState("");

  // Cancellation modal state
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookings");
      if (res.status === 401) {
        router.push(`/${locale}/auth/login?redirect=/${locale}/user/bookings`);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [locale, router]);

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancellingBooking) return;

    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Devotee cancellation request" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setActionError(data.error || "बुकिंग रद्द करने में असमर्थ");
        return;
      }

      setCancellingBooking(null);
      setCancelReason("");
      await fetchBookings();
    } catch {
      setActionError("सर्वर से संपर्क नहीं हो सका");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((b) => {
    // Search match
    if (search.trim()) {
      const q = search.toLowerCase();
      const match =
        b.bookingReference.toLowerCase().includes(q) ||
        b.serviceTitleHi.toLowerCase().includes(q) ||
        b.serviceTitleEn.toLowerCase().includes(q) ||
        b.bookingDate.includes(q);
      if (!match) return false;
    }

    if (activeTab === "UPCOMING") {
      return ["CONFIRMED", "PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(b.status);
    }
    if (activeTab === "COMPLETED") {
      return ["CHECKED_IN", "COMPLETED"].includes(b.status);
    }
    if (activeTab === "CANCELLED") {
      return ["CANCELLED", "EXPIRED", "REFUNDED", "REFUND_PENDING"].includes(b.status);
    }
    return true; // ALL
  });

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* 1. Header & Navigation breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <Link
            href={`/${locale}/user`}
            className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-maroon-deep transition-colors font-serif"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{isHi ? "वापस डैशबोर्ड पर जाएं" : "Back to Dashboard"}</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
            {isHi ? "मेरी दर्शन एवं सेवा बुकिंग्स" : "My Bookings & Passes"}
          </h1>
          <p className="text-xs text-stone-500">
            {isHi
              ? "आपके द्वारा आरक्षित समस्त दर्शन पासेज, रसीदें एवं सत्यापन क्यूआर कोड"
              : "Manage your reserved darshan passes, receipts, and digital verification QR codes"}
          </p>
        </div>

        <Link
          href={`/${locale}/booking`}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep font-serif font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-sacred-sm hover:shadow-gold-glow transition-all border border-gold-royal/40 shrink-0 self-start sm:self-auto"
        >
          <Calendar className="w-4 h-4 text-maroon-deep" />
          <span>{isHi ? "नया दर्शन बुक करें" : "Book New Darshan"}</span>
        </Link>
      </div>

      {/* 2. Tabs & Search Controls */}
      <div className="bg-cream-ivory p-3 rounded-2xl border border-sandstone-300 shadow-sacred-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Tab Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {[
            { id: "UPCOMING", label: isHi ? "आगामी (Upcoming)" : "Upcoming" },
            { id: "COMPLETED", label: isHi ? "सम्पन्न (Completed)" : "Completed" },
            { id: "CANCELLED", label: isHi ? "निरस्त (Cancelled)" : "Cancelled" },
            { id: "ALL", label: isHi ? "समस्त (All)" : "All" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-maroon-deep text-cream-ivory shadow-sm"
                  : "bg-cream-warm text-stone-700 hover:bg-sandstone-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isHi ? "संदर्भ सं. / सेवा खोजें..." : "Search reference or seva..."}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-cream-warm border border-sandstone-300 text-xs focus:ring-2 focus:ring-gold-royal focus:outline-none"
          />
        </div>
      </div>

      {/* 3. Bookings List or Empty State */}
      {loading ? (
        <div className="py-20 text-center text-stone-500 space-y-3">
          <img
            src="/branding/jorawar-dham-icon.png"
            alt="सिद्ध श्री जोरावर धाम"
            className="w-14 h-14 rounded-full object-contain mx-auto animate-pulse border border-gold-royal/40 shadow-sm p-1 bg-maroon-deep"
          />
          <p className="text-xs font-serif font-bold text-maroon-deep">
            {isHi ? "बुकिंग्स लोड हो रही हैं..." : "Loading bookings..."}
          </p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-cream-ivory rounded-3xl border-2 border-dashed border-sandstone-300 p-12 text-center space-y-4 shadow-sacred-sm">
          <Calendar className="w-12 h-12 mx-auto text-sandstone-400" />
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="font-serif font-bold text-base text-maroon-deep">
              {activeTab === "UPCOMING"
                ? isHi
                  ? "अभी कोई आगामी दर्शन बुकिंग नहीं है।"
                  : "No upcoming bookings found."
                : isHi
                ? "इस श्रेणी में कोई बुकिंग उपलब्ध नहीं है।"
                : "No bookings found in this category."}
            </h3>
            <p className="text-xs text-stone-500">
              {isHi
                ? "सिद्ध श्री जोरावर धाम में दर्शन अथवा अनुष्ठान हेतु अपना स्थान अभी सुरक्षित करें।"
                : "Plan your divine pilgrimage and reserve your pass at Siddh Shri Jorawar Dham."}
            </p>
          </div>

          <Link
            href={`/${locale}/booking`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep px-6 py-2.5 rounded-xl font-serif font-bold text-xs shadow-sacred-sm hover:shadow-gold-glow transition-all border border-gold-royal/40"
          >
            <Calendar className="w-4 h-4 text-maroon-deep" />
            <span>{isHi ? "दर्शन बुक करें (Book Darshan)" : "Book Darshan"}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBookings.map((booking) => {
            const isConfirmed = booking.status === "CONFIRMED";
            const isCheckedIn = booking.status === "CHECKED_IN";
            const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";
            const canCancel = isConfirmed;

            return (
              <div
                key={booking.id}
                className="bg-cream-ivory border border-sandstone-300 hover:border-gold-royal/60 rounded-3xl p-6 shadow-sacred-sm hover:shadow-sacred-md transition-all flex flex-col justify-between space-y-5"
              >
                {/* Card Header */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="font-mono font-bold text-xs text-gold-royal tracking-widest block">
                        {booking.bookingReference}
                      </span>
                      <h3 className="font-serif font-bold text-lg text-maroon-deep">
                        {isHi ? booking.serviceTitleHi : booking.serviceTitleEn}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-3 py-1 rounded-full shrink-0 ${
                        isConfirmed
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isCheckedIn
                          ? "bg-blue-100 text-blue-800 border border-blue-300"
                          : isCancelled
                          ? "bg-red-100 text-red-800 border border-red-300"
                          : "bg-amber-100 text-amber-800 border border-amber-300"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-700 bg-cream-warm p-3 rounded-2xl border border-sandstone-200">
                    <div>
                      <span className="text-stone-500 block text-[11px]">{isHi ? "दर्शन तिथि:" : "Date:"}</span>
                      <strong className="font-mono font-bold text-stone-900">{booking.bookingDate}</strong>
                    </div>

                    <div>
                      <span className="text-stone-500 block text-[11px]">{isHi ? "समय स्लॉट:" : "Slot:"}</span>
                      <strong className="font-mono font-bold text-stone-900">{booking.slotTime}</strong>
                    </div>

                    <div className="pt-1">
                      <span className="text-stone-500 block text-[11px]">{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
                      <strong className="text-stone-900">{booking.numberOfDevotees}</strong>
                    </div>

                    <div className="pt-1">
                      <span className="text-stone-500 block text-[11px]">{isHi ? "राशि:" : "Amount:"}</span>
                      <strong className="font-mono text-maroon-deep">
                        {booking.totalAmountInPaise > 0 ? `₹${booking.totalAmountInPaise / 100}` : isHi ? "निःशुल्क" : "Free"}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Card Action Buttons according to booking state */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sandstone-200">
                  <Link
                    href={`/${locale}/user/bookings/${booking.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-serif font-semibold transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{isHi ? "विवरण" : "View"}</span>
                  </Link>

                  {(isConfirmed || isCheckedIn) && (
                    <Link
                      href={`/${locale}/user/bookings/${booking.id}/ticket`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep text-xs font-serif font-bold shadow-sm transition-all border border-gold-royal/30"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isHi ? "डिजिटल पास" : "Ticket"}</span>
                    </Link>
                  )}

                  {booking.hasReceipt && (
                    <Link
                      href={`/${locale}/user/bookings/${booking.id}/invoice`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-maroon-deep hover:bg-maroon-primary text-cream-ivory text-xs font-serif font-semibold transition-colors border border-gold-royal/30"
                    >
                      <FileText className="w-3.5 h-3.5 text-gold-soft" />
                      <span>{isHi ? "रसीद" : "Invoice"}</span>
                    </Link>
                  )}

                  {canCancel && (
                    <button
                      type="button"
                      onClick={() => setCancellingBooking(booking)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-red-700 hover:bg-red-50 text-xs font-serif font-medium transition-colors ml-auto border border-red-200"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{isHi ? "रद्द करें" : "Cancel"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. Devotee Cancellation Confirmation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-cream-ivory rounded-3xl border-2 border-red-300 max-w-md w-full p-6 sm:p-8 space-y-5 shadow-sacred-lg animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 text-red-700">
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    {isHi ? "दर्शन बुकिंग रद्द करें" : "Cancel Darshan Booking"}
                  </h3>
                  <span className="text-xs font-mono text-stone-500">
                    {cancellingBooking.bookingReference}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCancellingBooking(null)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? "क्या आप निश्चित रूप से इस दर्शन पास को रद्द करना चाहते हैं? रद्दीकरण के पश्चात स्लॉट अन्य श्रद्धालुओं के लिए मुक्त कर दिया जाएगा।"
                : "Are you sure you want to cancel this booking? The slot capacity will immediately be released for other pilgrims."}
            </p>

            {actionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {actionError}
              </div>
            )}

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-stone-700 mb-1">
                  {isHi ? "रद्द करने का कारण (वैकल्पिक):" : "Reason for cancellation:"}
                </label>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder={isHi ? "यात्रा में परिवर्तन अथवा अन्य कारण..." : "Change of plans..."}
                  className="w-full p-2.5 rounded-xl bg-cream-warm border border-sandstone-300 text-xs focus:ring-2 focus:ring-red-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCancellingBooking(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-700 hover:bg-sandstone-200"
                >
                  {isHi ? "वापस" : "Keep Booking"}
                </button>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow transition-colors"
                >
                  {actionLoading ? (isHi ? "रद्द हो रहा है..." : "Cancelling...") : isHi ? "हाँ, रद्द करें" : "Confirm Cancel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
