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
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles,
  Phone,
  ShieldCheck,
  ArrowRight,
  Heart,
  Bell,
  Eye,
  PlusCircle,
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
  const [donations, setDonations] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [meRes, bookingsRes] = await Promise.all([
          fetch("/api/auth/devotee/me"),
          fetch("/api/bookings"),
        ]);

        if (meRes.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/user`);
          return;
        }

        const meData = await meRes.json();
        const bookingsData = await bookingsRes.json();

        if (meData.success) {
          setDevotee(meData.user);
          // Fetch user donations if available
          try {
            const donRes = await fetch("/api/donations/my-donations");
            if (donRes.ok) {
              const donData = await donRes.json();
              if (donData.success) setDonations(donData.donations || []);
            }
          } catch {}
        }
        if (bookingsData.success) setBookings(bookingsData.bookings || []);
      } catch (err) {
        console.error("Dashboard data load error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [locale, router]);

  const handleLogout = async () => {
    await fetch("/api/auth/devotee/logout", { method: "POST" });
    router.push(`/${locale}`);
    router.refresh();
  };

  // Find upcoming booking (CONFIRMED or PENDING_PAYMENT with future date)
  const activeBookings = bookings.filter((b) =>
    ["CONFIRMED", "PENDING_PAYMENT", "PAYMENT_PROCESSING"].includes(b.status)
  );
  const nextUpcoming = activeBookings.length > 0 ? activeBookings[0] : null;

  const pastBookings = bookings.filter((b) =>
    ["CHECKED_IN", "COMPLETED", "CANCELLED", "EXPIRED", "REFUNDED"].includes(b.status)
  );

  const totalDonationAmountRupees = donations.reduce(
    (sum, d) => (d.status === "PAID" ? sum + d.amountInPaise / 100 : sum),
    0
  );

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 space-y-3">
        <img
          src="/branding/jorawar-dham-icon.png"
          alt="सिद्ध श्री जोरावर धाम"
          className="w-16 h-16 rounded-full object-contain mx-auto animate-pulse border-2 border-gold-royal/40 shadow-sm p-1 bg-maroon-deep"
        />
        <p className="text-sm font-serif font-bold text-maroon-deep">
          {isHi ? "श्रद्धालु डैशबोर्ड लोड हो रहा है..." : "Loading Devotee Portal..."}
        </p>
      </div>
    );
  }

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
      {/* 1. Devotee Hero Greeting Banner */}
      <div className="bg-gradient-to-r from-maroon-deep via-maroon-primary to-maroon-wine text-cream-ivory rounded-3xl p-6 sm:p-10 shadow-sacred-md border border-gold-royal/30 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-gold-royal via-gold-soft to-amber-300 shadow-gold-glow shrink-0 flex items-center justify-center">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="w-full h-full rounded-full object-contain bg-maroon-deep p-1.5"
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-gold-royal text-xs font-serif font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-gold-soft" />
              <span>{isHi ? "सिद्ध श्री जोरावर धाम सेवा समिति" : "Siddh Shri Jorawar Dham"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cream-ivory">
              {isHi ? `सादर जय श्री जोरावर जी, ${devotee?.fullName || "भक्तजन"}` : `Welcome, ${devotee?.fullName || "Devotee"}`}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-xs text-sandstone-300 font-mono">
              <span>📞 +91 {devotee?.phone}</span>
              {devotee?.city && <span>📍 {devotee.city}</span>}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/${locale}/booking`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep px-5 py-2.5 rounded-xl font-serif font-bold text-xs shadow-sacred-sm transition-all subtle-lift border border-gold-royal/40"
          >
            <Calendar className="w-4 h-4 text-maroon-deep" />
            <span>{isHi ? "दर्शन बुक करें" : "Book Darshan"}</span>
          </Link>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-cream-ivory px-4 py-2.5 rounded-xl border border-white/20 text-xs font-semibold transition-colors"
          >
            <LogOut className="w-4 h-4 text-sandstone-300" />
            <span>{isHi ? "लॉगआउट" : "Sign Out"}</span>
          </button>
        </div>
      </div>

      {/* 2. Quick Navigation Sub-Bar */}
      <div className="flex items-center gap-2 border-b border-sandstone-200 pb-3 overflow-x-auto text-xs sm:text-sm font-serif font-semibold">
        <Link
          href={`/${locale}/user`}
          className="px-4 py-2 rounded-xl bg-maroon-deep text-cream-ivory shadow-sm whitespace-nowrap"
        >
          {isHi ? "डैशबोर्ड (Overview)" : "Dashboard"}
        </Link>
        <Link
          href={`/${locale}/user/bookings`}
          className="px-4 py-2 rounded-xl text-stone-700 hover:bg-sandstone-200/80 transition-colors whitespace-nowrap"
        >
          {isHi ? `मेरी बुकिंग्स (${bookings.length})` : `My Bookings (${bookings.length})`}
        </Link>
        <Link
          href={`/${locale}/user/donations`}
          className="px-4 py-2 rounded-xl text-stone-700 hover:bg-sandstone-200/80 transition-colors whitespace-nowrap"
        >
          {isHi ? `दान सेवा (${donations.length})` : `Donations (${donations.length})`}
        </Link>
      </div>

      {/* 3. Section: Upcoming Booking Highlight ("आपकी अगली यात्रा") */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-serif font-bold text-maroon-deep flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold-royal" />
            <span>{isHi ? "आपकी आगामी यात्रा (Upcoming Pilgrimage)" : "Your Upcoming Visit"}</span>
          </h2>

          <Link
            href={`/${locale}/user/bookings`}
            className="text-xs font-serif font-semibold text-maroon-primary hover:text-maroon-deep flex items-center gap-1"
          >
            <span>{isHi ? "सभी बुकिंग्स देखें" : "View All Bookings"}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {nextUpcoming ? (
          <div className="bg-cream-ivory border-2 border-gold-royal/40 rounded-3xl p-6 sm:p-8 shadow-sacred-sm hover:shadow-sacred-md transition-all space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-sandstone-200/80 pb-5">
              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold tracking-widest text-gold-royal uppercase bg-cream-warm px-2.5 py-0.5 rounded-full border border-gold-royal/20">
                  {nextUpcoming.bookingReference}
                </span>
                <h3 className="text-2xl font-serif font-bold text-maroon-deep">
                  {isHi ? nextUpcoming.serviceTitleHi : nextUpcoming.serviceTitleEn}
                </h3>
                <p className="text-xs text-stone-500 font-serif">
                  {isHi ? "सिद्ध श्री जोरावर धाम, चितौरा (धौलपुर)" : "Siddh Shri Jorawar Dham, Chitaura (Dholpur)"}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isHi ? "पुष्ट पास (Confirmed)" : "Confirmed"}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
              <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-200 space-y-1">
                <span className="text-stone-500 block text-xs">{isHi ? "दर्शन तिथि:" : "Visit Date:"}</span>
                <strong className="font-mono font-bold text-maroon-deep text-base block">{nextUpcoming.bookingDate}</strong>
              </div>

              <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-200 space-y-1">
                <span className="text-stone-500 block text-xs">{isHi ? "समय स्लॉट:" : "Slot Timing:"}</span>
                <strong className="font-mono font-bold text-maroon-deep text-base block">{nextUpcoming.slotTime}</strong>
              </div>

              <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-200 space-y-1">
                <span className="text-stone-500 block text-xs">{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
                <strong className="font-bold text-stone-900 text-base block">{nextUpcoming.numberOfDevotees} व्यक्ति</strong>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href={`/${locale}/user/bookings/${nextUpcoming.id}/ticket`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep font-serif font-bold text-xs px-5 py-2.5 rounded-xl shadow-sacred-sm hover:shadow-gold-glow transition-all border border-gold-royal/40"
              >
                <QrCode className="w-4 h-4 text-maroon-deep" />
                <span>{isHi ? "डिजिटल पास देखें / QR" : "View Digital Pass"}</span>
              </Link>

              <Link
                href={`/${locale}/user/bookings/${nextUpcoming.id}/invoice`}
                className="inline-flex items-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-semibold text-xs px-4 py-2.5 rounded-xl shadow-sm transition-colors border border-gold-royal/30"
              >
                <Download className="w-4 h-4 text-gold-soft" />
                <span>{isHi ? "रसीद व चालान" : "View Receipt / Invoice"}</span>
              </Link>

              <Link
                href={`/${locale}/user/bookings/${nextUpcoming.id}`}
                className="inline-flex items-center gap-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 font-serif font-medium text-xs px-4 py-2.5 rounded-xl transition-colors border border-stone-200"
              >
                <span>{isHi ? "पूरा विवरण" : "Full Details"}</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-cream-ivory rounded-3xl border-2 border-dashed border-sandstone-300 p-10 text-center space-y-4 shadow-sacred-sm">
            <Calendar className="w-12 h-12 mx-auto text-sandstone-400" />
            <div className="space-y-1 max-w-md mx-auto">
              <h3 className="font-serif font-bold text-base text-maroon-deep">
                {isHi ? "अभी कोई आगामी दर्शन बुकिंग नहीं है।" : "No upcoming darshan booking found."}
              </h3>
              <p className="text-xs text-stone-500">
                {isHi
                  ? "श्री जोरावर धाम में दर्शन, आरती अथवा विशेष अनुष्ठान हेतु अपना स्थान सुरक्षित करें।"
                  : "Plan your sacred pilgrimage and reserve your darshan pass in advance."}
              </p>
            </div>

            <Link
              href={`/${locale}/booking`}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep px-6 py-2.5 rounded-xl font-serif font-bold text-xs shadow-sacred-sm hover:shadow-gold-glow transition-all border border-gold-royal/40"
            >
              <Calendar className="w-4 h-4 text-maroon-deep" />
              <span>{isHi ? "दर्शन बुक करें (Book Darshan)" : "Book Darshan Now"}</span>
            </Link>
          </div>
        )}
      </section>

      {/* 4. Three-Column Summary Cards: Quick Stats, Donations, Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stat 1: Bookings Snapshot */}
        <div className="bg-cream-ivory p-6 rounded-3xl border border-sandstone-300 shadow-sacred-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-maroon-deep">{isHi ? "दर्शन इतिहास" : "Darshan Visits"}</span>
            <div className="w-8 h-8 rounded-full bg-cream-warm flex items-center justify-center text-gold-royal border border-gold-royal/30">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-mono font-bold text-maroon-deep">{bookings.length}</span>
            <span className="text-xs text-stone-500 block mt-1">
              {isHi ? `${activeBookings.length} सक्रिय • ${pastBookings.length} पूर्ण/अन्य` : `${activeBookings.length} active • ${pastBookings.length} completed`}
            </span>
          </div>
          <Link
            href={`/${locale}/user/bookings`}
            className="block text-xs font-serif font-semibold text-maroon-primary hover:underline pt-2 border-t border-sandstone-200"
          >
            {isHi ? "मेरी सभी बुकिंग्स देखें →" : "View booking history →"}
          </Link>
        </div>

        {/* Stat 2: Donations Snapshot */}
        <div className="bg-cream-ivory p-6 rounded-3xl border border-sandstone-300 shadow-sacred-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-serif font-bold text-maroon-deep">{isHi ? "पुण्य सेवा / दान" : "Charitable Seva"}</span>
            <div className="w-8 h-8 rounded-full bg-cream-warm flex items-center justify-center text-gold-royal border border-gold-royal/30">
              <Heart className="w-4 h-4" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-mono font-bold text-maroon-deep">₹{totalDonationAmountRupees}</span>
            <span className="text-xs text-stone-500 block mt-1">
              {isHi ? `${donations.length} दान प्रविष्टियां` : `${donations.length} contributions`}
            </span>
          </div>
          <Link
            href={`/${locale}/user/donations`}
            className="block text-xs font-serif font-semibold text-maroon-primary hover:underline pt-2 border-t border-sandstone-200"
          >
            {isHi ? "दान विवरण व रसीदें →" : "View donation receipts →"}
          </Link>
        </div>

        {/* Stat 3: Quick Pilgrim Actions */}
        <div className="bg-cream-ivory p-6 rounded-3xl border border-sandstone-300 shadow-sacred-sm space-y-3">
          <span className="text-xs font-serif font-bold text-maroon-deep block">{isHi ? "त्वरित सुविधाएं" : "Quick Actions"}</span>
          <div className="space-y-2">
            <Link
              href={`/${locale}/booking`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-cream-warm hover:bg-sandstone-200/80 border border-sandstone-200 text-xs font-semibold text-stone-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-gold-royal" />
                <span>{isHi ? "नया दर्शन पास बुक करें" : "Book New Darshan Pass"}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            <Link
              href={`/${locale}/user/donations`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-cream-warm hover:bg-sandstone-200/80 border border-sandstone-200 text-xs font-semibold text-stone-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Heart className="w-4 h-4 text-gold-royal" />
                <span>{isHi ? "धर्मार्थ सहयोग / दान करें" : "Make Charitable Offering"}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </Link>

            <Link
              href={`/${locale}/contact`}
              className="flex items-center justify-between p-2.5 rounded-xl bg-cream-warm hover:bg-sandstone-200/80 border border-sandstone-200 text-xs font-semibold text-stone-800 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold-royal" />
                <span>{isHi ? "तीर्थ सहायता केंद्र" : "Temple Helpdesk"}</span>
              </span>
              <ArrowRight className="w-3.5 h-3.5 text-stone-400" />
            </Link>
          </div>
        </div>
      </div>

      {/* 5. Recent Bookings List */}
      {bookings.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-maroon-deep flex items-center gap-2">
            <Clock className="w-4 h-4 text-gold-royal" />
            <span>{isHi ? "हालिया बुकिंग विवरण" : "Recent Bookings"}</span>
          </h2>

          <div className="bg-cream-ivory rounded-3xl border border-sandstone-300 overflow-hidden shadow-sacred-sm divide-y divide-sandstone-200">
            {bookings.slice(0, 5).map((booking) => (
              <div
                key={booking.id}
                className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-cream-warm/60 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-maroon-deep">
                      {booking.bookingReference}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        booking.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : booking.status === "CHECKED_IN"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "CANCELLED"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-stone-900 text-sm sm:text-base">
                    {isHi ? booking.serviceTitleHi : booking.serviceTitleEn}
                  </h4>
                  <p className="text-xs text-stone-500 font-mono">
                    {booking.bookingDate} • {booking.slotTime} • {booking.numberOfDevotees} {isHi ? "श्रद्धालु" : "Devotees"}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Link
                    href={`/${locale}/user/bookings/${booking.id}/ticket`}
                    className="inline-flex items-center gap-1.5 bg-cream-warm hover:bg-sandstone-200 text-maroon-deep font-serif font-semibold text-xs px-3.5 py-2 rounded-xl border border-sandstone-300 transition-colors"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>{isHi ? "पास" : "Pass"}</span>
                  </Link>

                  <Link
                    href={`/${locale}/user/bookings/${booking.id}/invoice`}
                    className="inline-flex items-center gap-1.5 bg-cream-warm hover:bg-sandstone-200 text-stone-700 font-serif font-semibold text-xs px-3.5 py-2 rounded-xl border border-sandstone-300 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>{isHi ? "रसीद" : "Invoice"}</span>
                  </Link>

                  <Link
                    href={`/${locale}/user/bookings/${booking.id}`}
                    className="inline-flex items-center gap-1 text-maroon-primary hover:text-maroon-deep font-serif font-semibold text-xs px-2 py-2"
                  >
                    <span>{isHi ? "विवरण" : "View"}</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
