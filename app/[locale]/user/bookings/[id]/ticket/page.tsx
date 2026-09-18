"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowLeft,
  ShieldCheck,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Sparkles,
  MapPin,
  AlertCircle,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

export default function DigitalTicketPage({
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
    async function loadTicket() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/${id}`);
        if (res.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/user/bookings/${id}/ticket`);
          return;
        }
        if (res.status === 403) {
          setError(isHi ? "अनधिकृत पहुंच: यह टिकट आपके खाते से संबद्ध नहीं है।" : "Unauthorized access.");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "टिकट प्राप्त करने में असमर्थ");
          return;
        }
        setBooking(data.booking);
      } catch {
        setError("नेटवर्क त्रुटि उत्पन्न हुई");
      } finally {
        setLoading(false);
      }
    }

    loadTicket();
  }, [id, locale, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="py-24 text-center text-stone-500 space-y-3">
        <img
          src="/branding/jorawar-dham-icon.png"
          alt="सिद्ध श्री जोरावर धाम"
          className="w-16 h-16 rounded-full object-contain mx-auto animate-pulse border-2 border-gold-royal/40 shadow-sm p-1 bg-maroon-deep"
        />
        <p className="text-xs font-serif font-bold text-maroon-deep">
          {isHi ? "डिजिटल पास तैयार हो रहा है..." : "Generating digital darshan pass..."}
        </p>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-serif font-bold text-stone-900">
          {isHi ? "टिकट उपलब्ध नहीं है" : "Ticket Not Found"}
        </h2>
        <p className="text-xs text-stone-600">{error}</p>
        <Link
          href={`/${locale}/user/bookings`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-deep text-cream-ivory text-xs font-bold font-serif"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "मेरी बुकिंग्स" : "My Bookings"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-4 max-w-2xl mx-auto space-y-6">
      {/* Print Controls (Hidden when printing) */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <Link
          href={`/${locale}/user/bookings/${id}`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-maroon-deep transition-colors font-serif"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "वापस बुकिंग विवरण" : "Back to Booking"}</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-maroon-deep hover:bg-maroon-primary text-cream-ivory text-xs font-serif font-bold shadow-sacred-sm transition-all border border-gold-royal/30"
          >
            <Printer className="w-4 h-4 text-gold-soft" />
            <span>{isHi ? "पास प्रिंट करें" : "Print Pass"}</span>
          </button>
        </div>
      </div>

      {/* Official Digital Ticket Card */}
      <div className="bg-cream-ivory rounded-3xl border-2 border-gold-royal/50 shadow-sacred-lg overflow-hidden relative print:border-2 print:shadow-none print:m-0">
        {/* Sacred Decorative Header */}
        <div className="bg-gradient-to-r from-maroon-deep via-maroon-primary to-maroon-deep text-cream-ivory p-6 sm:p-8 text-center space-y-3 border-b-2 border-gold-royal/40">
          <div className="flex justify-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-gold-royal via-gold-soft to-amber-300 shadow-gold-glow flex items-center justify-center">
              <img
                src="/branding/jorawar-dham-icon.png"
                alt="सिद्ध श्री जोरावर धाम"
                className="w-full h-full rounded-full object-contain bg-maroon-deep p-1.5"
              />
            </div>
          </div>

          <div className="space-y-0.5">
            <span className="text-[10px] sm:text-xs font-serif tracking-widest text-gold-soft uppercase block">
              श्री १००८ भगवान जोरावर जी महाराज
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-cream-ivory">
              सिद्ध श्री जोरावर धाम
            </h1>
            <p className="text-[11px] text-sandstone-300 font-serif">
              सिद्ध श्री जोरावर धाम सेवा समिति • चितौरा, सैंपऊ, धौलपुर (राजस्थान)
            </p>
          </div>

          {/* Pass Badge */}
          <div className="inline-block bg-gold-royal/20 border border-gold-royal/50 px-5 py-1.5 rounded-full mt-2">
            <span className="text-xs sm:text-sm font-serif font-bold tracking-widest text-gold-soft uppercase">
              {isHi ? "आधिकारिक दर्शन पास (DARSHAN PASS)" : "OFFICIAL DARSHAN PASS"}
            </span>
          </div>
        </div>

        {/* Ticket Details & QR Core */}
        <div className="p-6 sm:p-8 space-y-6 text-center">
          {/* Booking Identifier */}
          <div className="bg-cream-warm p-4 rounded-2xl border border-sandstone-300 inline-block w-full max-w-md mx-auto space-y-1">
            <span className="text-[10px] font-serif uppercase tracking-widest text-stone-500 block">
              {isHi ? "आरक्षण संदर्भ संख्या (Booking ID)" : "Booking Reference"}
            </span>
            <span className="text-xl sm:text-2xl font-mono font-bold text-maroon-deep tracking-widest block">
              {booking.bookingReference}
            </span>
            <span className="text-[10px] font-serif font-bold text-emerald-700 block">
              ● {booking.status === "CONFIRMED" ? (isHi ? "पुष्ट एवं सक्रिय" : "CONFIRMED & VALID") : booking.status}
            </span>
          </div>

          {/* Large Scannable QR Code */}
          {booking.qrDataUri && (
            <div className="space-y-2">
              <div className="inline-block p-4 bg-white rounded-3xl border-2 border-gold-royal/40 shadow-sacred-sm">
                <img
                  src={booking.qrDataUri}
                  alt={`Pass QR ${booking.bookingReference}`}
                  className="w-52 h-52 sm:w-60 sm:h-60 mx-auto object-contain rounded-xl"
                />
              </div>
              <p className="text-[11px] font-mono text-stone-500">
                सुरक्षा सत्यापन टोकन: {booking.bookingReference}
              </p>
            </div>
          )}

          {/* Detailed Pilgrim Metadata Grid */}
          <div className="max-w-md mx-auto bg-cream-warm rounded-2xl p-5 border border-sandstone-200 text-left text-xs space-y-3 divide-y divide-sandstone-200/80">
            <div className="flex justify-between items-center pb-2">
              <span className="text-stone-500">{isHi ? "सेवा / दर्शन:" : "Seva / Darshan:"}</span>
              <strong className="text-maroon-deep font-serif font-bold text-sm">
                {isHi ? booking.serviceTitleHi : booking.serviceTitleEn}
              </strong>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-stone-500">{isHi ? "दर्शन तिथि:" : "Visit Date:"}</span>
              <strong className="font-mono font-bold text-stone-900">{booking.bookingDate}</strong>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-stone-500">{isHi ? "समय स्लॉट:" : "Slot Timing:"}</span>
              <strong className="font-mono font-bold text-stone-900">{booking.slotTime}</strong>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-stone-500">{isHi ? "मुख्य श्रद्धालु:" : "Devotee Name:"}</span>
              <strong className="text-stone-900">{booking.primaryDevoteeName}</strong>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-stone-500">{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
              <strong className="text-stone-900">{booking.numberOfDevotees} व्यक्ति</strong>
            </div>

            {booking.totalAmountInPaise !== undefined && (
              <div className="flex justify-between items-center pt-2">
                <span className="text-stone-500">{isHi ? "शुल्क स्थिति:" : "Fee Status:"}</span>
                <strong className="text-emerald-800 font-semibold">
                  {booking.totalAmountInPaise === 0
                    ? isHi ? "निःशुल्क सेवा (100% Free)" : "Free Darshan"
                    : `₹${booking.totalAmountInPaise / 100} (सफल भुगतान)`}
                </strong>
              </div>
            )}
          </div>

          <SacredDivider variant="gold" className="my-2" />

          {/* Instructions Box */}
          <div className="max-w-md mx-auto text-left bg-cream-warm/70 p-4 rounded-xl border border-sandstone-200/80 space-y-1 text-[11px] text-stone-600">
            <span className="font-serif font-bold text-maroon-deep block">
              {isHi ? "कृपया यह डिजिटल पास साथ रखें:" : "Please carry this digital pass:"}
            </span>
            <ul className="list-disc list-inside space-y-0.5 text-stone-500 text-[10px]">
              <li>{isHi ? "प्रवेश द्वार पर यह क्यूआर कोड स्कैन कराएं।" : "Scan this QR code at temple entrance."}</li>
              <li>{isHi ? "स्लॉट समय से 15 मिनट पूर्व पधारें।" : "Please arrive 15 minutes before the slot time."}</li>
              <li>{isHi ? "पवित्र धाम मर्यादा व पारंपरिक वेशभूषा का पालन करें।" : "Maintain sanctity and temple decorum."}</li>
            </ul>
          </div>
        </div>

        {/* Official Trust Footer */}
        <div className="bg-cream-warm p-4 text-center border-t border-sandstone-200 text-[10px] text-stone-500 font-mono space-y-0.5">
          <span>सिद्ध श्री जोरावर धाम सेवा समिति • पंजीकरण सं: COOP/2023/DHOLPUR/201054</span>
          <span className="block text-gold-royal font-serif">॥ ॐ श्री जोरा Bernardाय नमः ॥</span>
        </div>
      </div>
    </div>
  );
}
