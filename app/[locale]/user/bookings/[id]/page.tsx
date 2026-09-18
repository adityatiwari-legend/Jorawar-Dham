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
  ShieldCheck,
  User,
  Phone,
  Info,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

export default function BookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const isHi = locale === "hi";
  const router = useRouter();

  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadBookingDetails() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (res.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/user/bookings/${id}`);
          return;
        }
        if (res.status === 403) {
          setError(isHi ? "अनधिकृत पहुंच: यह बुकिंग आपके खाते से संबद्ध नहीं है।" : "Unauthorized access.");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "बुकिंग विवरण लोड करने में असमर्थ");
          return;
        }
        setBooking(data.booking);
      } catch {
        setError("नेटवर्क त्रुटि उत्पन्न हुई");
      } finally {
        setLoading(false);
      }
    }

    loadBookingDetails();
  }, [id, locale, router]);

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 space-y-3">
        <img
          src="/branding/jorawar-dham-icon.png"
          alt="सिद्ध श्री जोरावर धाम"
          className="w-16 h-16 rounded-full object-contain mx-auto animate-pulse border-2 border-gold-royal/40 shadow-sm p-1 bg-maroon-deep"
        />
        <p className="text-xs font-serif font-bold text-maroon-deep">
          {isHi ? "बुकिंग विवरण लोड हो रहा है..." : "Loading booking details..."}
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-serif font-bold text-stone-900">
          {isHi ? "बुकिंग विवरण उपलब्ध नहीं है" : "Booking Not Found"}
        </h2>
        <p className="text-xs text-stone-600">{error}</p>
        <Link
          href={`/${locale}/user/bookings`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-deep text-cream-ivory text-xs font-bold font-serif shadow"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "मेरी बुकिंग्स पर वापस जाएं" : "Back to My Bookings"}</span>
        </Link>
      </div>
    );
  }

  const isConfirmed = booking.status === "CONFIRMED";
  const isCheckedIn = booking.status === "CHECKED_IN";
  const isCancelled = booking.status === "CANCELLED" || booking.status === "REFUNDED";

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Top Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href={`/${locale}/user/bookings`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-maroon-deep transition-colors font-serif"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "वापस मेरी बुकिंग्स पर जाएं" : "Back to My Bookings"}</span>
        </Link>

        <span className="font-mono font-bold text-xs text-gold-royal bg-cream-warm px-3 py-1 rounded-full border border-gold-royal/30">
          {booking.bookingReference}
        </span>
      </div>

      {/* Main Booking Card */}
      <div className="bg-cream-ivory rounded-3xl border border-sandstone-300 shadow-sacred-md overflow-hidden space-y-6">
        {/* Banner Header */}
        <div className="bg-gradient-to-r from-maroon-deep via-maroon-primary to-maroon-wine text-cream-ivory p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-serif font-bold tracking-widest text-gold-soft uppercase">
              {isHi ? "सिद्ध श्री जोरावर धाम दर्शन पास" : "Siddh Shri Jorawar Dham Pass"}
            </span>
            <h1 className="text-2xl font-serif font-bold text-cream-ivory">
              {isHi ? booking.serviceTitleHi : booking.serviceTitleEn}
            </h1>
            <p className="text-xs text-sandstone-300 font-mono">
              आरक्षण संदर्भ: {booking.bookingReference}
            </p>
          </div>

          <span
            className={`self-start sm:self-auto text-xs font-bold px-3.5 py-1.5 rounded-full ${
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

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-8">
          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-200 space-y-1">
              <span className="text-stone-500 block text-xs">{isHi ? "दर्शन तिथि:" : "Visit Date:"}</span>
              <strong className="font-mono font-bold text-stone-900 text-sm block">{booking.bookingDate}</strong>
            </div>

            <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-200 space-y-1">
              <span className="text-stone-500 block text-xs">{isHi ? "समय स्लॉट:" : "Slot Timing:"}</span>
              <strong className="font-mono font-bold text-stone-900 text-sm block">{booking.slotTime}</strong>
            </div>

            <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-200 space-y-1">
              <span className="text-stone-500 block text-xs">{isHi ? "कुल श्रद्धालु:" : "Total Devotees:"}</span>
              <strong className="font-bold text-stone-900 text-sm block">{booking.numberOfDevotees} व्यक्ति</strong>
            </div>
          </div>

          {/* Devotee Info & Payment Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Devotee */}
            <div className="bg-cream-warm p-5 rounded-2xl border border-sandstone-200 space-y-3">
              <h3 className="font-serif font-bold text-xs text-maroon-deep uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-gold-royal" />
                <span>{isHi ? "मुख्य श्रद्धालु विवरण" : "Primary Devotee"}</span>
              </h3>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">{isHi ? "नाम:" : "Name:"}</span>
                  <strong className="text-stone-900">{booking.primaryDevoteeName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{isHi ? "मोबाइल:" : "Phone:"}</span>
                  <strong className="font-mono text-stone-900">+91 {booking.primaryDevoteePhone}</strong>
                </div>
              </div>
            </div>

            {/* Financial / Payment */}
            <div className="bg-cream-warm p-5 rounded-2xl border border-sandstone-200 space-y-3">
              <h3 className="font-serif font-bold text-xs text-maroon-deep uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-gold-royal" />
                <span>{isHi ? "भुगतान एवं लेखा विवरण" : "Payment Information"}</span>
              </h3>
              <div className="text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-stone-500">{isHi ? "कुल राशि:" : "Total Amount:"}</span>
                  <strong className="font-mono text-stone-900">
                    {booking.totalAmountInPaise > 0 ? `₹${booking.totalAmountInPaise / 100}` : isHi ? "निःशुल्क" : "Free"}
                  </strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">{isHi ? "स्थिति:" : "Payment Status:"}</span>
                  <strong className="text-emerald-700 font-semibold">{booking.paymentStatus || "PAID"}</strong>
                </div>
                {booking.receiptNumber && (
                  <div className="flex justify-between">
                    <span className="text-stone-500">{isHi ? "रसीद संख्या:" : "Receipt No:"}</span>
                    <strong className="font-mono text-maroon-deep">{booking.receiptNumber}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* QR Verification Preview */}
          {booking.qrDataUri && (isConfirmed || isCheckedIn) && (
            <div className="bg-cream-warm p-6 rounded-2xl border border-gold-royal/30 text-center space-y-3">
              <span className="text-xs font-serif font-bold text-maroon-deep block">
                {isHi ? "प्रवेश द्वार सत्यापन क्यूआर कोड (Entry QR Code)" : "Entrance QR Verification Code"}
              </span>
              <div className="inline-block p-3 bg-white rounded-2xl border border-sandstone-300 shadow-sm">
                <img
                  src={booking.qrDataUri}
                  alt="Booking QR Code"
                  className="w-44 h-44 mx-auto object-contain rounded-lg"
                />
              </div>
              <p className="text-[11px] text-stone-500 max-w-sm mx-auto">
                {isHi
                  ? "कृपया मंदिर प्रवेश द्वार पर यह क्यूआर कोड प्रस्तुत करें। स्क्रीनशॉट अथवा डिजिटल पास मान्य है।"
                  : "Please present this QR code at the temple entrance for quick verification."}
              </p>
            </div>
          )}

          {/* Temple Visiting Guidelines */}
          <div className="bg-cream-warm/80 p-5 rounded-2xl border border-sandstone-200 space-y-2 text-xs text-stone-600">
            <h4 className="font-serif font-bold text-stone-900 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-maroon-primary" />
              <span>{isHi ? "तीर्थयात्री महत्वपूर्ण दिशा-निर्देश" : "Pilgrim Guidelines"}</span>
            </h4>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-stone-600">
              <li>{isHi ? "कृपया अपने निर्धारित स्लॉट समय से 15 मिनट पूर्व पधारें।" : "Please arrive 15 minutes before your scheduled slot."}</li>
              <li>{isHi ? "मंदिर प्रांगण में मर्यादा एवं पारंपरिक परिधान का पालन करें।" : "Follow traditional temple dress code and maintain sanctity."}</li>
              <li>{isHi ? "गर्भ गृह में फोटोग्राफी एवं वीडियोग्राफी पूर्णतः निषेध है।" : "Photography inside the sanctum sanctorum is prohibited."}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-sandstone-200">
            <div className="flex flex-wrap items-center gap-3">
              {(isConfirmed || isCheckedIn) && (
                <Link
                  href={`/${locale}/user/bookings/${booking.id}/ticket`}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep font-serif font-bold text-xs px-5 py-2.5 rounded-xl shadow-sacred-sm hover:shadow-gold-glow transition-all border border-gold-royal/40"
                >
                  <QrCode className="w-4 h-4 text-maroon-deep" />
                  <span>{isHi ? "डिजिटल पास देखें" : "View Digital Pass"}</span>
                </Link>
              )}

              {booking.hasReceipt && (
                <Link
                  href={`/${locale}/user/bookings/${booking.id}/invoice`}
                  className="inline-flex items-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-semibold text-xs px-5 py-2.5 rounded-xl shadow-sm transition-colors border border-gold-royal/30"
                >
                  <FileText className="w-4 h-4 text-gold-soft" />
                  <span>{isHi ? "रसीद व चालान डाउनलोड करें" : "Download Invoice"}</span>
                </Link>
              )}
            </div>

            <Link
              href={`/${locale}/user/bookings`}
              className="inline-flex items-center gap-1.5 text-stone-600 hover:text-maroon-deep font-serif font-medium text-xs px-3 py-2"
            >
              <span>{isHi ? "मेरी सभी बुकिंग्स" : "All Bookings"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
