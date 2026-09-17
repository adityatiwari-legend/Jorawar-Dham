"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User as UserIcon,
  Calendar,
  Clock,
  QrCode,
  FileText,
  LogOut,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Phone,
  ShieldCheck,
  X,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";

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

export default function DevoteeDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isHi = locale === "hi";
  const router = useRouter();

  const [devotee, setDevotee] = useState<any>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "HISTORY" | "RECEIPTS">("ACTIVE");

  // Modal states
  const [viewingQrBooking, setViewingQrBooking] = useState<any | null>(null);
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<any | null>(null);
  const [cancellingBookingId, setCancellingBookingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function loadDevoteeData() {
      setLoading(true);
      try {
        const [meRes, bookingsRes] = await Promise.all([
          fetch("/api/auth/devotee/me"),
          fetch("/api/bookings"),
        ]);

        if (meRes.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/devotee/dashboard`);
          return;
        }

        const meData = await meRes.json();
        const bookingsData = await bookingsRes.json();

        if (meData.success) setDevotee(meData.user);
        if (bookingsData.success) setBookings(bookingsData.bookings);
      } catch {
      } finally {
        setLoading(false);
      }
    }

    loadDevoteeData();
  }, [locale, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/devotee/logout", { method: "POST" });
    router.push(`/${locale}`);
    router.refresh();
  };

  const handleOpenQr = async (booking: BookingItem) => {
    setViewingQrBooking(booking);
    setQrDataUri(null);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`);
      const data = await res.json();
      if (data.success && data.booking.qrDataUri) {
        setQrDataUri(data.booking.qrDataUri);
      }
    } catch {}
  };

  const handleOpenReceipt = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/receipt`);
      const data = await res.json();
      if (data.success) {
        setViewingReceipt(data.receipt);
      }
    } catch {}
  };

  const handleCancelBooking = async () => {
    if (!cancellingBookingId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/bookings/${cancellingBookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReason || "Devotee cancellation" }),
      });
      const data = await res.json();
      if (data.success) {
        setCancellingBookingId(null);
        setCancelReason("");
        // Reload bookings
        const bRes = await fetch("/api/bookings");
        const bData = await bRes.json();
        if (bData.success) setBookings(bData.bookings);
      }
    } catch {} finally {
      setActionLoading(false);
    }
  };

  const activeBookings = bookings.filter((b) =>
    ["CONFIRMED", "PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(b.status)
  );

  const pastBookings = bookings.filter((b) =>
    ["CHECKED_IN", "COMPLETED", "CANCELLED", "EXPIRED", "REFUNDED", "REFUND_PENDING"].includes(b.status)
  );

  const receiptBookings = bookings.filter((b) => b.hasReceipt);

  if (loading) {
    return (
      <div className="py-20 text-center text-stone-500">
        <div className="w-8 h-8 border-2 border-saffron-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm">{isHi ? "लोड हो रहा है..." : "Loading Devotee Portal..."}</p>
      </div>
    );
  }

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      {/* Devotee Greeting Banner */}
      <div className="bg-gradient-to-r from-maroon-950 via-maroon-900 to-saffron-950 text-white rounded-3xl p-6 sm:p-10 shadow-devotional flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gold-300 text-xs font-semibold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-gold-400" />
            <span>{isHi ? "श्रद्धालु सेवा संदर्शिका" : "Devotee Pilgrimage Account"}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-white">
            {devotee?.fullName ? (isHi ? `सादर जय श्री जोरावर जी, ${devotee.fullName}` : `Welcome, ${devotee.fullName}`) : isHi ? "सादर जय श्री जोरावर जी" : "Welcome, Devotee"}
          </h1>
          <div className="flex items-center gap-4 text-xs text-sandstone-300 font-mono">
            <span>📞 +91 {devotee?.phone}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl border border-white/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{isHi ? "लॉगआउट" : "Sign Out"}</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-3 border-b border-sandstone-200 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("ACTIVE")}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "ACTIVE"
              ? "bg-maroon-900 text-white shadow-sm"
              : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
          }`}
        >
          {isHi ? `सक्रिय टिकट्स (${activeBookings.length})` : `Active Passes (${activeBookings.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("HISTORY")}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "HISTORY"
              ? "bg-maroon-900 text-white shadow-sm"
              : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
          }`}
        >
          {isHi ? `इतिहास (${pastBookings.length})` : `History (${pastBookings.length})`}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("RECEIPTS")}
          className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "RECEIPTS"
              ? "bg-maroon-900 text-white shadow-sm"
              : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
          }`}
        >
          {isHi ? `रसीदें (${receiptBookings.length})` : `Receipts (${receiptBookings.length})`}
        </button>
      </div>

      {/* TAB 1: ACTIVE BOOKINGS */}
      {activeTab === "ACTIVE" && (
        <div className="space-y-4">
          {activeBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-dashed border-sandstone-300 p-12 text-center text-stone-500 space-y-4">
              <Calendar className="w-10 h-10 mx-auto text-sandstone-400" />
              <p className="text-base font-medium">
                {isHi ? "वर्तमान में आपकी कोई सक्रिय बुकिंग नहीं है।" : "You have no active bookings at this time."}
              </p>
              <Link
                href={`/${locale}/seva`}
                className="inline-flex items-center gap-2 bg-maroon-900 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow"
              >
                <span>{isHi ? "दर्शन व सेवा स्लॉट बुक करें" : "Book Darshan or Seva"}</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeBookings.map((b) => (
                <div
                  key={b.id}
                  className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-sm flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-4 border-b border-sandstone-100 pb-3">
                    <div>
                      <span className="text-[11px] font-mono font-bold text-saffron-700">
                        {b.bookingReference}
                      </span>
                      <h3 className="text-lg font-bold text-maroon-950 font-serif">
                        {isHi ? b.serviceTitleHi : b.serviceTitleEn}
                      </h3>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        b.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {b.status === "CONFIRMED" ? (isHi ? "पुष्ट" : "Confirmed") : isHi ? "प्रक्रिया में" : "Pending"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-stone-600 font-mono">
                    <div>
                      <span className="text-stone-400 block font-sans">{isHi ? "दिनांक:" : "Date:"}</span>
                      <strong className="text-stone-900">{b.bookingDate}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-sans">{isHi ? "समय:" : "Time:"}</span>
                      <strong className="text-stone-900">{b.slotTime}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-sans">{isHi ? "श्रद्धालु:" : "Devotees:"}</span>
                      <strong className="text-stone-900">{b.numberOfDevotees}</strong>
                    </div>
                    <div>
                      <span className="text-stone-400 block font-sans">{isHi ? "राशि:" : "Amount:"}</span>
                      <strong className="text-stone-900">₹{b.totalAmountInPaise / 100}</strong>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-sandstone-100">
                    <button
                      type="button"
                      onClick={() => handleOpenQr(b)}
                      className="inline-flex items-center gap-1.5 bg-maroon-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-maroon-800 transition-colors shadow-sm"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>{isHi ? "डिजिटल पास / QR" : "View QR Pass"}</span>
                    </button>

                    {b.hasReceipt && (
                      <button
                        type="button"
                        onClick={() => handleOpenReceipt(b.id)}
                        className="inline-flex items-center gap-1 bg-sandstone-100 hover:bg-sandstone-200 text-stone-800 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{isHi ? "रसीद" : "Receipt"}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setCancellingBookingId(b.id)}
                      className="ml-auto text-xs text-red-600 hover:text-red-800 font-semibold"
                    >
                      {isHi ? "रद्द करें" : "Cancel"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          {pastBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sandstone-200 p-12 text-center text-stone-500 text-sm">
              {isHi ? "कोई पूर्व बुकिंग उपलब्ध नहीं है।" : "No past booking history found."}
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-sandstone-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-stone-700">
                  <thead className="bg-sandstone-100 border-b border-sandstone-200 font-serif font-bold text-maroon-950">
                    <tr>
                      <th className="p-4">{isHi ? "संदर्भ" : "Reference"}</th>
                      <th className="p-4">{isHi ? "सेवा" : "Service"}</th>
                      <th className="p-4">{isHi ? "दिनांक व समय" : "Date & Time"}</th>
                      <th className="p-4">{isHi ? "श्रद्धालु" : "Devotees"}</th>
                      <th className="p-4">{isHi ? "राशि" : "Amount"}</th>
                      <th className="p-4">{isHi ? "स्थिति" : "Status"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sandstone-100">
                    {pastBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-sandstone-50">
                        <td className="p-4 font-mono font-bold text-stone-900">{b.bookingReference}</td>
                        <td className="p-4 font-medium">{isHi ? b.serviceTitleHi : b.serviceTitleEn}</td>
                        <td className="p-4 font-mono">{b.bookingDate} ({b.slotTime})</td>
                        <td className="p-4">{b.numberOfDevotees}</td>
                        <td className="p-4 font-mono">₹{b.totalAmountInPaise / 100}</td>
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                              b.status === "CHECKED_IN"
                                ? "bg-emerald-100 text-emerald-800"
                                : b.status === "CANCELLED"
                                ? "bg-stone-200 text-stone-700"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: RECEIPTS */}
      {activeTab === "RECEIPTS" && (
        <div className="space-y-4">
          {receiptBookings.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sandstone-200 p-12 text-center text-stone-500 text-sm">
              {isHi ? "कोई दान/सेवा रसीद उपलब्ध नहीं है।" : "No receipts generated yet."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {receiptBookings.map((b) => (
                <div key={b.id} className="bg-white rounded-3xl border border-sandstone-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-sandstone-100 pb-3">
                    <span className="text-[11px] font-mono text-stone-500">{b.receiptNumber}</span>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                      {isHi ? "सत्यापित" : "Verified"}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-maroon-950 font-serif">{isHi ? b.serviceTitleHi : b.serviceTitleEn}</h4>
                    <p className="text-xs text-stone-500 font-mono mt-0.5">{b.bookingDate}</p>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-sandstone-100">
                    <span className="font-bold font-mono text-base text-stone-900">₹{b.totalAmountInPaise / 100}</span>
                    <button
                      type="button"
                      onClick={() => handleOpenReceipt(b.id)}
                      className="text-xs font-semibold text-saffron-700 hover:text-saffron-800 inline-flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{isHi ? "देखें / प्रिंट" : "View Receipt"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: QR TICKET PASS */}
      {viewingQrBooking && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-5 shadow-2xl relative animate-in zoom-in-95">
            <button
              type="button"
              onClick={() => setViewingQrBooking(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-sandstone-100 text-stone-600 hover:bg-sandstone-200"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-saffron-700">
                {isHi ? "श्री जोरावर धाम डिजिटल पास" : "Digital Entrance Pass"}
              </span>
              <h3 className="text-xl font-bold font-serif text-maroon-950">
                {isHi ? viewingQrBooking.serviceTitleHi : viewingQrBooking.serviceTitleEn}
              </h3>
            </div>

            {qrDataUri ? (
              <div className="p-3 bg-sandstone-50 rounded-2xl border border-sandstone-200 inline-block shadow-inner">
                <img src={qrDataUri} alt="QR Pass" className="w-48 h-48 mx-auto rounded-lg" />
                <span className="block font-mono text-xs font-bold text-maroon-950 mt-2">
                  {viewingQrBooking.bookingReference}
                </span>
              </div>
            ) : (
              <div className="w-48 h-48 bg-sandstone-100 rounded-2xl flex items-center justify-center mx-auto text-xs text-stone-400 animate-pulse">
                Loading QR...
              </div>
            )}

            <div className="bg-sandstone-50 p-3 rounded-xl text-xs text-stone-600 space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="font-sans">{isHi ? "दिनांक:" : "Date:"}</span>
                <span className="font-bold text-stone-900">{viewingQrBooking.bookingDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans">{isHi ? "समय:" : "Time:"}</span>
                <span className="font-bold text-stone-900">{viewingQrBooking.slotTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-sans">{isHi ? "श्रद्धालु:" : "Devotees:"}</span>
                <span className="font-bold text-stone-900">{viewingQrBooking.numberOfDevotees}</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-500">
              {isHi ? "मंदिर प्रवेश द्वार पर सुरक्षा गार्ड को यह कोड स्कैन करवाएं।" : "Present this QR to entrance security staff."}
            </p>
          </div>
        </div>
      )}

      {/* MODAL: OFFICIAL RECEIPT */}
      {viewingReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 shadow-2xl relative animate-in zoom-in-95 border-2 border-sandstone-200">
            <button
              type="button"
              onClick={() => setViewingReceipt(null)}
              className="absolute right-4 top-4 p-1.5 rounded-full bg-sandstone-100 text-stone-600 hover:bg-sandstone-200 print:hidden"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Header */}
            <div className="text-center space-y-1 border-b border-sandstone-200 pb-4">
              <span className="text-xs font-bold text-gold-600 tracking-widest block font-serif">
                ॥ ॐ श्री जोरावर देवाय नमः ॥
              </span>
              <h3 className="text-xl font-bold font-serif text-maroon-950">
                {viewingReceipt.organization.nameHi}
              </h3>
              <p className="text-xs text-stone-500">{viewingReceipt.organization.address}</p>
              <div className="pt-1 text-[11px] text-stone-600 font-mono">
                <span>PAN: {viewingReceipt.organization.pan}</span> | <span>80G: {viewingReceipt.organization.taxExemption80G}</span>
              </div>
            </div>

            {/* Receipt Body */}
            <div className="space-y-3 text-xs text-stone-700 font-mono">
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">{isHi ? "रसीद क्रमांक:" : "Receipt No:"}</span>
                <strong className="text-stone-900">{viewingReceipt.receiptNumber}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">{isHi ? "बुकिंग संदर्भ:" : "Booking Ref:"}</span>
                <strong className="text-maroon-900">{viewingReceipt.bookingReference}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">{isHi ? "श्रद्धालु का नाम:" : "Devotee Name:"}</span>
                <span className="font-sans font-bold text-stone-900">{viewingReceipt.devoteeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">{isHi ? "मोबाइल:" : "Mobile:"}</span>
                <span>+91 {viewingReceipt.maskedPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">{isHi ? "सेवा:" : "Service:"}</span>
                <span className="font-sans font-bold text-stone-900">{isHi ? viewingReceipt.serviceTitleHi : viewingReceipt.serviceTitleEn}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500 font-sans">{isHi ? "दर्शन तिथि:" : "Visit Date:"}</span>
                <span>{viewingReceipt.bookingDate} ({viewingReceipt.slotTime})</span>
              </div>
              <div className="pt-3 border-t border-sandstone-200 flex justify-between text-base font-bold text-stone-900 font-sans">
                <span>{isHi ? "प्राप्त राशि (INR):" : "Received Amount:"}</span>
                <span className="font-mono text-lg text-emerald-800">₹{viewingReceipt.amountInPaise / 100}</span>
              </div>
            </div>

            {/* Print Button */}
            <div className="pt-2 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-maroon-900 hover:bg-maroon-800 text-white font-bold px-6 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{isHi ? "रसीद प्रिंट / डाउनलोड" : "Print Receipt"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCEL CONFIRMATION */}
      {cancellingBookingId && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 shadow-2xl relative">
            <h3 className="text-lg font-bold font-serif text-maroon-950">
              {isHi ? "बुकिंग रद्द करने की पुष्टि करें" : "Confirm Booking Cancellation"}
            </h3>
            <p className="text-xs text-stone-600">
              {isHi
                ? "क्या आप निश्चित रूप से यह बुकिंग रद्द करना चाहते हैं? यदि इस हेतु भुगतान किया गया है तो रिफंड नीति के अनुसार कार्रवाई होगी।"
                : "Are you sure you wish to cancel this booking? If paid, refund will be processed per trust guidelines."}
            </p>
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {isHi ? "रद्द करने का कारण" : "Reason for cancellation"}
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder={isHi ? "यात्रा स्थगित / अन्य कारण..." : "Trip rescheduled / other..."}
                className="w-full p-2.5 rounded-xl border border-sandstone-300 text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCancellingBookingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-sandstone-100"
              >
                {isHi ? "रहने दें" : "Keep Booking"}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleCancelBooking}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
              >
                {actionLoading ? "Processing..." : isHi ? "हाँ, रद्द करें" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
