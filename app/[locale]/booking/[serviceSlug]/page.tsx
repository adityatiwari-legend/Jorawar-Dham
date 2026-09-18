"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  Calendar,
  Clock,
  Users,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Download,
  Flame,
  User,
  Phone,
  ArrowLeft,
  QrCode,
  FileText,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

interface SlotData {
  id: string;
  startTime: string;
  endTime: string;
  capacity: number;
  availableSeats: number;
  priceInPaise: number;
  isAvailable: boolean;
}

interface ServiceData {
  id: string;
  slug: string;
  titleHi: string;
  titleEn: string;
  price: number | null;
  slots: SlotData[];
  isBlocked?: boolean;
  blockedReasonHi?: string;
}

export default function BookingWizardPage({
  params,
}: {
  params: Promise<{ locale: string; serviceSlug: string }>;
}) {
  const { locale, serviceSlug } = use(params);
  const isHi = locale === "hi";
  const router = useRouter();

  // Wizard Steps: 1. DATE & TIME -> 2. DEVOTEE DETAILS -> 3. PAYMENT -> 4. CONFIRMATION / TICKET
  const [step, setStep] = useState<number>(1);

  const [service, setService] = useState<ServiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date(Date.now() + 86400000).toISOString().split("T")[0] // default tomorrow
  );
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);
  const [numberOfDevotees, setNumberOfDevotees] = useState<number>(1);
  const [primaryName, setPrimaryName] = useState<string>("");
  const [primaryPhone, setPrimaryPhone] = useState<string>("");

  // Booking result state
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [qrDataUri, setQrDataUri] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [availabilityMap, setAvailabilityMap] = useState<Record<string, { status: string; remainingSeats: number; reason?: string }>>({});

  // 1. Fetch 30-day date availability on load
  useEffect(() => {
    async function loadAvailability() {
      try {
        const res = await fetch(`/api/services/${serviceSlug}/availability?days=30`);
        const data = await res.json();
        if (data.success && data.dates) {
          const map: Record<string, { status: string; remainingSeats: number; reason?: string }> = {};
          data.dates.forEach((d: any) => {
            map[d.date] = { status: d.status, remainingSeats: d.remainingSeats, reason: d.reason };
          });
          setAvailabilityMap(map);
        }
      } catch {}
    }
    loadAvailability();
  }, [serviceSlug]);

  // 2. Fetch slots when date or serviceSlug changes
  useEffect(() => {
    async function loadSlots() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/services/${serviceSlug}/slots?date=${selectedDate}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "सेवा विवरण लोड करने में असमर्थ");
          return;
        }
        setService(data.service);
        if (data.service.slots && data.service.slots.length > 0) {
          const firstAvailable = data.service.slots.find((s: SlotData) => s.isAvailable);
          setSelectedSlot(firstAvailable || data.service.slots[0]);
        } else {
          setSelectedSlot(null);
        }
      } catch {
        setError("नेटवर्क त्रुटि उत्पन्न हुई");
      } finally {
        setLoading(false);
      }
    }

    loadSlots();
  }, [serviceSlug, selectedDate]);

  // Handle Booking Creation
  const handleProceedToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!service || !selectedSlot) return;

    setError(null);
    setActionLoading(true);

    try {
      // 1. Create concurrency-safe booking hold
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          slotId: selectedSlot.id,
          bookingDate: selectedDate,
          numberOfDevotees,
          primaryDevoteeName: primaryName,
          primaryDevoteePhone: primaryPhone,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          // Redirect to login preserving return URL
          router.push(`/${locale}/auth/login?redirect=/${locale}/booking/${serviceSlug}`);
          return;
        }
        setError(data.error || "बुकिंग सृजन में त्रुटि");
        setActionLoading(false);
        return;
      }

      setBookingResult(data.booking);

      // If booking was free, it is already confirmed!
      if (data.booking.status === "CONFIRMED") {
        await loadConfirmedTicket(data.booking.id);
        setStep(4);
      } else {
        // Move to payment step
        setStep(3);
      }
    } catch {
      setError("बुकिंग प्रक्रिया में त्रुटि");
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Payment
  const handleExecutePayment = async () => {
    if (!bookingResult) return;
    setActionLoading(true);
    setError(null);

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId: bookingResult.id }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok || !orderData.success) {
        setError(orderData.error || "भुगतान आदेश सृजन विफल");
        setActionLoading(false);
        return;
      }

      const { order } = orderData;

      // 1. Safe Mock Gateway Handling:
      // If mock mode is active, NEVER invoke real Razorpay checkout.js (prevents 401 Basic Auth popup on api.razorpay.com)
      if (order.isMock || !order.keyId || order.keyId.startsWith("rzp_mock_") || order.keyId.includes("placeholder")) {
        const mockPaymentId = `pay_mock_${Date.now()}`;
        const verifyRes = await fetch("/api/payments/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingId: bookingResult.id,
            orderId: order.orderId,
            paymentId: mockPaymentId,
            signature: "mock_signature_verified",
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          setError(verifyData.error || "भुगतान सत्यापन विफल");
          setActionLoading(false);
          return;
        }

        await loadConfirmedTicket(bookingResult.id);
        setStep(4);
        setActionLoading(false);
        return;
      }

      // 2. Official Razorpay Checkout Flow (Live / Test Mode)
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        throw new Error(
          isHi
            ? "रेज़रपे भुगतान गेटवे लोड नहीं हो सका। कृपया पृष्ठ को पुनः लोड करें।"
            : "Razorpay Checkout failed to initialize. Please refresh the page."
        );
      }

      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: order.currency || "INR",
        name: isHi ? "सिद्ध श्री जोरावर धाम सेवा समिति" : "Siddh Shri Jorawar Dham Seva Samiti",
        description: service ? (isHi ? service.titleHi : service.titleEn) : "दर्शन / सेवा बुकिंग",
        order_id: order.orderId,
        prefill: {
          name: primaryName,
          contact: primaryPhone,
        },
        theme: {
          color: "#881337",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                bookingId: bookingResult.id,
                orderId: response.razorpay_order_id || order.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (!verifyRes.ok || !verifyData.success) {
              setError(verifyData.error || "भुगतान सत्यापन विफल");
            } else {
              await loadConfirmedTicket(bookingResult.id);
              setStep(4);
            }
          } catch {
            setError("सत्यापन सर्वर से संपर्क नहीं हो सका");
          } finally {
            setActionLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setActionLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (failResp: any) {
        setError(failResp.error?.description || "भुगतान असफल रहा");
        setActionLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err?.message || "भुगतान प्रक्रिया में त्रुटि");
      setActionLoading(false);
    }
  };

  async function loadConfirmedTicket(bookingId: string) {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`);
      const data = await res.json();
      if (data.success) {
        setBookingResult(data.booking);
        setQrDataUri(data.booking.qrDataUri);
      }
    } catch {}
  }

  const totalAmountInPaise = selectedSlot ? selectedSlot.priceInPaise * numberOfDevotees : 0;
  const totalAmountRupees = totalAmountInPaise / 100;

  // Generate 7 upcoming quick date selection pills
  const upcomingDates = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(Date.now() + (i + 1) * 86400000);
    return {
      iso: d.toISOString().split("T")[0],
      dayName: d.toLocaleDateString(isHi ? "hi-IN" : "en-US", { weekday: "short" }),
      dayNum: d.getDate(),
      monthName: d.toLocaleDateString(isHi ? "hi-IN" : "en-US", { month: "short" }),
    };
  });

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      {/* 1. Header & Stepper */}
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <Link
          href={`/${locale}/booking`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-maroon-deep transition-colors font-serif"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "← चरण 01: अन्य सेवा चुनें (Change Service)" : "← Step 01: Change Service"}</span>
        </Link>
        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
          {service ? (isHi ? service.titleHi : service.titleEn) : isHi ? "दर्शन एवं सेवा बुकिंग" : "Pilgrim Reservation"}
        </h1>
        <p className="text-xs sm:text-sm text-mutedText">
          {isHi
            ? "सिद्ध श्री जोरावर धाम में अपनी पावन यात्रा एवं सेवा हेतु अग्रिम आरक्षण"
            : "Reserve your sacred pilgrimage pass and seva offering"}
        </p>
      </div>

      {/* 2. Stepper Component */}
      <div className="max-w-3xl mx-auto">
        <div className="grid grid-cols-4 gap-2 text-center text-xs">
          {[
            { num: 1, label: isHi ? "01 दिन व समय" : "01 Date & Slot" },
            { num: 2, label: isHi ? "02 श्रद्धालु विवरण" : "02 Devotees" },
            { num: 3, label: isHi ? "03 भुगतान" : "03 Payment" },
            { num: 4, label: isHi ? "04 पुष्टि व पास" : "04 Digital Pass" },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="space-y-1.5">
                <div
                  className={`h-1.5 rounded-full transition-colors ${
                    isCurrent
                      ? "bg-gold-royal"
                      : isCompleted
                      ? "bg-maroon-deep"
                      : "bg-sandstone-200"
                  }`}
                />
                <span
                  className={`block text-[11px] font-serif font-medium truncate ${
                    isCurrent
                      ? "text-maroon-deep font-bold"
                      : isCompleted
                      ? "text-stone-700"
                      : "text-stone-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="max-w-3xl mx-auto bg-red-50 border border-red-200 rounded-2xl p-4 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* 3. Main Content: Split Grid with Sticky Summary (Steps 1 & 2) */}
      {step < 4 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left / Main Wizard Form (Col-span 8) */}
          <div className="lg:col-span-8 bg-cream-ivory rounded-3xl border border-gold-royal/30 p-6 sm:p-10 shadow-sacred-sm space-y-8">
            {/* STEP 1: DATE & TIME SLOT SELECTION */}
            {step === 1 && (
              <div className="space-y-8">
                {/* Date Selection */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-serif font-bold text-maroon-deep">
                      {isHi ? "1. दर्शन/पूजा की तिथि चुनें" : "1. Select Date of Visit"}
                    </label>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {selectedDate}
                    </span>
                  </div>

                  {/* Horizontal Quick Date Cards with Live Availability Badges */}
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {upcomingDates.map((item) => {
                      const isSelected = selectedDate === item.iso;
                      const avail = availabilityMap[item.iso];
                      const isFull = avail?.status === "FULL";
                      const isClosed = avail?.status === "CLOSED";
                      const isLimited = avail?.status === "LIMITED";
                      const isDisabled = isFull || isClosed;

                      return (
                        <button
                          key={item.iso}
                          type="button"
                          disabled={isDisabled}
                          onClick={() => setSelectedDate(item.iso)}
                          className={`p-2 rounded-2xl border text-center transition-all subtle-lift flex flex-col items-center justify-between min-h-[90px] relative ${
                            isSelected
                              ? "bg-maroon-deep text-cream-ivory border-gold-royal ring-2 ring-gold-royal/40 shadow-sacred-sm"
                              : isDisabled
                              ? "bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed opacity-60"
                              : "bg-cream-warm hover:bg-sandstone-200 border-sandstone-200 text-stone-800"
                          }`}
                        >
                          <span className="text-[10px] uppercase tracking-wider font-semibold opacity-80">
                            {item.dayName}
                          </span>
                          <span className="text-base sm:text-lg font-mono font-bold">
                            {item.dayNum}
                          </span>
                          <span className="text-[9px] opacity-75">
                            {item.monthName}
                          </span>

                          {/* Availability Badge */}
                          <div className="mt-1">
                            {isClosed ? (
                              <span className="text-[8px] bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full font-bold">
                                {isHi ? "अवरुद्ध" : "Closed"}
                              </span>
                            ) : isFull ? (
                              <span className="text-[8px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-bold">
                                {isHi ? "पूर्ण" : "Full"}
                              </span>
                            ) : isLimited ? (
                              <span className="text-[8px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full font-bold">
                                {isHi ? "सीमित" : "Limited"}
                              </span>
                            ) : (
                              <span className="text-[8px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-full font-bold">
                                {isHi ? "उपलब्ध" : "Open"}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Manual Date Input */}
                  <div className="pt-2 flex items-center gap-3 text-xs text-stone-600">
                    <Calendar className="w-4 h-4 text-gold-royal shrink-0" />
                    <span>{isHi ? "अन्य तिथि चुनें:" : "Pick custom date:"}</span>
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split("T")[0]}
                      max={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="px-3 py-1.5 rounded-lg border border-sandstone-300 bg-cream-warm font-mono text-xs focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    />
                  </div>
                </div>

                {/* Devotees Counter */}
                <div className="space-y-3 pt-6 border-t border-sandstone-200/80">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-serif font-bold text-maroon-deep">
                      {isHi ? "2. श्रद्धालुओं की संख्या" : "2. Number of Devotees"}
                    </label>
                    <span className="text-xs text-stone-500 font-serif">
                      {isHi ? "अधिकतम 20 श्रद्धालु" : "Max 20 persons"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="inline-flex items-center rounded-2xl bg-cream-warm border border-sandstone-300 p-1">
                      <button
                        type="button"
                        onClick={() => setNumberOfDevotees((p) => Math.max(1, p - 1))}
                        className="w-10 h-10 rounded-xl bg-cream-ivory hover:bg-sandstone-200 text-maroon-deep font-bold text-base shadow-sm transition-colors flex items-center justify-center"
                        aria-label="Decrease devotees"
                      >
                        -
                      </button>
                      <span className="font-mono text-lg font-bold text-maroon-deep w-14 text-center">
                        {numberOfDevotees}
                      </span>
                      <button
                        type="button"
                        onClick={() => setNumberOfDevotees((p) => Math.min(20, p + 1))}
                        className="w-10 h-10 rounded-xl bg-cream-ivory hover:bg-sandstone-200 text-maroon-deep font-bold text-base shadow-sm transition-colors flex items-center justify-center"
                        aria-label="Increase devotees"
                      >
                        +
                      </button>
                    </div>

                    <span className="text-xs text-stone-600">
                      {isHi ? "श्रद्धालु / तीर्थयात्री" : "Devotees"}
                    </span>
                  </div>
                </div>

                {/* Time Slots Selection */}
                <div className="space-y-4 pt-6 border-t border-sandstone-200/80">
                  <label className="block text-sm font-serif font-bold text-maroon-deep">
                    {isHi ? "3. उपलब्ध समय स्लॉट चुनें" : "3. Choose Available Time Slot"}
                  </label>

                  {loading ? (
                    <div className="text-center py-8 text-stone-500 text-xs font-serif">
                      {isHi ? "स्लॉट लोड हो रहे हैं..." : "Loading available slots..."}
                    </div>
                  ) : service?.isBlocked ? (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-900 space-y-1">
                      <strong className="block text-sm font-serif font-bold">
                        {isHi ? "इस तिथि पर बुकिंग अवरुद्ध है" : "Booking blocked for this date"}
                      </strong>
                      <p className="text-xs">{service.blockedReasonHi || "विशेष धार्मिक आयोजन हेतु स्लॉट बंद हैं"}</p>
                    </div>
                  ) : !service?.slots || service.slots.length === 0 ? (
                    <div className="bg-cream-warm rounded-2xl p-6 text-center text-stone-500 text-xs">
                      {isHi ? "इस तिथि पर कोई स्लॉट उपलब्ध नहीं है" : "No slots available on this date"}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {service.slots.map((slot) => {
                        const isSelected = selectedSlot?.id === slot.id;
                        return (
                          <button
                            key={slot.id}
                            type="button"
                            disabled={!slot.isAvailable}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between subtle-lift ${
                              isSelected
                                ? "border-gold-royal bg-cream-warm ring-2 ring-gold-royal shadow-sacred-sm"
                                : slot.isAvailable
                                ? "border-sandstone-200 hover:border-gold-royal/50 bg-cream-ivory"
                                : "border-stone-200 bg-stone-100 opacity-50 cursor-not-allowed"
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 font-bold text-maroon-deep font-mono text-sm">
                                <Clock className="w-4 h-4 text-gold-royal" />
                                <span>
                                  {slot.startTime} - {slot.endTime}
                                </span>
                              </div>
                              <span className="text-xs text-stone-500 block">
                                {slot.priceInPaise > 0
                                  ? `₹${slot.priceInPaise / 100} प्रति श्रद्धालु`
                                  : isHi
                                  ? "निःशुल्क"
                                  : "Free"}
                              </span>
                            </div>

                            <div className="text-right">
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${
                                  slot.availableSeats > 10
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : slot.availableSeats > 0
                                    ? "bg-amber-50 text-amber-800 border border-amber-200"
                                    : "bg-stone-200 text-stone-600"
                                }`}
                              >
                                {slot.isAvailable
                                  ? `${slot.availableSeats} ${isHi ? "शेष" : "left"}`
                                  : isHi
                                  ? "स्थान पूर्ण"
                                  : "Full"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="button"
                    disabled={!selectedSlot || !selectedSlot.isAvailable}
                    onClick={() => setStep(2)}
                    className="min-h-[46px] bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-bold px-8 py-3 rounded-xl shadow-sacred-sm transition-all disabled:opacity-40 flex items-center gap-2 text-xs sm:text-sm border border-gold-royal/40"
                  >
                    <span>{isHi ? "श्रद्धालु विवरण दर्ज करें" : "Enter Devotee Details"}</span>
                    <ArrowRight className="w-4 h-4 text-gold-soft" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: DEVOTEES CONTACT FORM */}
            {step === 2 && (
              <form onSubmit={handleProceedToPayment} className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-wider block">
                    {isHi ? "चरण 2" : "Step 2"}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-maroon-deep">
                    {isHi ? "मुख्य श्रद्धालु संपर्क विवरण" : "Primary Devotee Contact Information"}
                  </h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-serif font-bold text-maroon-deep mb-1.5">
                      {isHi ? "मुख्य श्रद्धालु का नाम" : "Primary Devotee Full Name"}
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                      <input
                        type="text"
                        required
                        value={primaryName}
                        onChange={(e) => setPrimaryName(e.target.value)}
                        placeholder={isHi ? "उदा. रमेश शर्मा" : "e.g. Ramesh Sharma"}
                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-sandstone-300 bg-cream-warm/30 text-stone-900 text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-maroon-deep mb-1.5">
                      {isHi ? "मोबाइल नंबर (SMS पुष्टि व टिकट हेतु)" : "Mobile Number (for SMS confirmation)"}
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone-500 text-sm font-semibold border-r border-sandstone-300 pr-2">
                        <span>+91</span>
                      </div>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={primaryPhone}
                        onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9876543210"
                        className="w-full pl-16 pr-4 py-3 rounded-xl border border-sandstone-300 bg-cream-warm/30 font-mono text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-stone-600 hover:text-maroon-deep text-xs sm:text-sm font-serif font-semibold"
                  >
                    {isHi ? "← वापस स्लॉट बदलें" : "← Change Slot"}
                  </button>
                  <button
                    type="submit"
                    disabled={actionLoading || !primaryName || primaryPhone.length !== 10}
                    className="min-h-[46px] bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-bold px-8 py-3 rounded-xl shadow-sacred-sm transition-all disabled:opacity-50 flex items-center gap-2 text-xs sm:text-sm border border-gold-royal/40"
                  >
                    <span>
                      {actionLoading
                        ? isHi
                          ? "प्रतीक्षा करें..."
                          : "Holding Slot..."
                        : isHi
                        ? "पुष्टि हेतु आगे बढ़ें"
                        : "Proceed to Confirm"}
                    </span>
                    <ArrowRight className="w-4 h-4 text-gold-soft" />
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: PAYMENT CHECKOUT */}
            {step === 3 && bookingResult && (
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-wider block">
                    {isHi ? "चरण 3" : "Step 3"}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-maroon-deep">
                    {isHi ? "सुरक्षित ऑनलाइन भुगतान" : "Secure Payment Gateway Checkout"}
                  </h2>
                </div>

                <div className="bg-cream-warm p-6 rounded-2xl border border-gold-royal/30 space-y-4">
                  <div className="flex justify-between items-center border-b border-sandstone-200 pb-3 text-xs sm:text-sm">
                    <span className="text-stone-500">{isHi ? "बुकिंग संदर्भ:" : "Booking Reference:"}</span>
                    <span className="font-mono font-bold text-maroon-deep">{bookingResult.bookingReference}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="text-stone-500">{isHi ? "देय राशि (INR):" : "Payable Amount:"}</span>
                    <span className="font-mono font-bold text-2xl text-maroon-deep">
                      ₹{bookingResult.totalAmountInPaise / 100}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-semibold">
                      {isHi ? "256-बिट सुरक्षित एन्क्रिप्टेड भुगतान" : "256-Bit Encrypted Gateway"}
                    </strong>
                    <span>
                      {isHi
                        ? "आपकी राशि सीधे श्री जोरावर धाम तीर्थ ट्रस्ट के अधिकृत खाते में प्रेषित होती है।"
                        : "Funds are securely processed into the registered Trust bank account."}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={handleExecutePayment}
                  className="w-full min-h-[48px] bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep font-serif font-bold py-3.5 rounded-xl shadow-sacred-md transition-all flex items-center justify-center gap-2 text-sm sm:text-base border border-gold-royal/40"
                >
                  <CreditCard className="w-5 h-5 text-maroon-deep" />
                  <span>
                    {actionLoading
                      ? isHi
                        ? "भुगतान संसाधित हो रहा है..."
                        : "Processing Payment..."
                      : isHi
                      ? `₹${bookingResult.totalAmountInPaise / 100} का भुगतान करें`
                      : `Pay ₹${bookingResult.totalAmountInPaise / 100}`}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Right / Sticky Reservation Summary Card (Col-span 4) */}
          <div className="lg:col-span-4 sticky top-28 bg-cream-ivory rounded-3xl border border-gold-royal/30 p-6 shadow-sacred-sm space-y-5">
            <div className="space-y-1">
              <span className="text-[10px] font-serif font-bold uppercase tracking-widest text-gold-royal block">
                {isHi ? "आरक्षण विवरण" : "Reservation Summary"}
              </span>
              <h3 className="font-serif font-bold text-maroon-deep text-lg">
                {service ? (isHi ? service.titleHi : service.titleEn) : "..."}
              </h3>
            </div>

            <div className="divide-y divide-sandstone-200/80 text-xs space-y-3 pt-1">
              <div className="flex justify-between pt-3">
                <span className="text-stone-500">{isHi ? "दिनांक:" : "Date:"}</span>
                <span className="font-mono font-bold text-stone-900">{selectedDate}</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-stone-500">{isHi ? "समय स्लॉट:" : "Time Slot:"}</span>
                <span className="font-mono font-bold text-stone-900">
                  {selectedSlot ? `${selectedSlot.startTime} - ${selectedSlot.endTime}` : "—"}
                </span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-stone-500">{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
                <span className="font-bold text-stone-900">{numberOfDevotees}</span>
              </div>
              <div className="flex justify-between pt-3">
                <span className="text-stone-500">{isHi ? "प्रति व्यक्ति शुल्क:" : "Per Devotee:"}</span>
                <span className="font-bold text-stone-900">
                  {selectedSlot && selectedSlot.priceInPaise > 0
                    ? `₹${selectedSlot.priceInPaise / 100}`
                    : isHi
                    ? "निःशुल्क"
                    : "Free"}
                </span>
              </div>
              <div className="flex justify-between pt-3 text-sm font-serif font-bold text-maroon-deep">
                <span>{isHi ? "कुल देय राशि:" : "Total Amount:"}</span>
                <span className="font-mono text-base">₹{totalAmountRupees}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-sandstone-200 flex items-center gap-2 text-[11px] text-stone-500">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{isHi ? "पंजीकृत धर्मार्थ ट्रस्ट" : "Official Trust Service"}</span>
            </div>
          </div>
        </div>
      ) : null}

      {/* STEP 4: CONFIRMATION & DIGITAL PASS (Full Width Showcase) */}
      {step === 4 && bookingResult && (
        <div className="max-w-2xl mx-auto temple-parchment rounded-3xl border-2 border-gold-royal/40 p-8 sm:p-12 shadow-sacred-lg text-center space-y-6">
          {/* Official Icon & Status */}
          <div className="flex justify-center">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="w-16 h-16 rounded-full object-contain border-2 border-gold-royal shadow-sacred-sm bg-maroon-deep p-1"
            />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-serif font-bold text-emerald-800 uppercase tracking-widest bg-emerald-50 px-3.5 py-1 rounded-full border border-emerald-200">
              {isHi ? "बुकिंग सफलतापूर्वक पुष्ट हुई" : "Booking Confirmed"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
              {isHi ? "सिद्ध श्री जोरावर धाम में आपका स्वागत है" : "Welcome to Siddh Shri Jorawar Dham"}
            </h2>
            <p className="text-[11px] text-stone-500 font-mono">
              सिद्ध श्री जोरावर धाम सेवा समिति (रजि. नं. COOP/2023/DHOLPUR/201054)
            </p>
          </div>

          <SacredDivider variant="gold" className="my-2" />

          {/* QR Code Container */}
          {qrDataUri && (
            <div className="inline-block p-4 bg-cream-ivory rounded-3xl border border-gold-royal/40 shadow-sacred-sm">
              <img
                src={qrDataUri}
                alt="Booking Verification QR"
                className="w-56 h-56 mx-auto rounded-xl shadow-sm"
              />
              <span className="block text-xs font-mono font-bold text-maroon-deep mt-3 tracking-widest">
                {bookingResult.bookingReference}
              </span>
            </div>
          )}

          {/* Pass Details Table */}
          <div className="max-w-md mx-auto bg-cream-warm rounded-2xl p-5 text-xs text-stone-700 space-y-2.5 text-left border border-sandstone-200">
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "सेवा:" : "Service:"}</span>
              <strong className="text-maroon-deep font-serif">{isHi ? bookingResult.serviceTitleHi : bookingResult.serviceTitleEn}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "दिनांक व समय:" : "Date & Time:"}</span>
              <strong className="text-stone-900 font-mono">{bookingResult.bookingDate} ({bookingResult.slotTime})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
              <strong className="text-stone-900">{bookingResult.numberOfDevotees}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "मुख्य श्रद्धालु:" : "Primary Devotee:"}</span>
              <strong className="text-stone-900">{bookingResult.primaryDevoteeName}</strong>
            </div>
          </div>

          {/* Action Links: View Ticket, Download Invoice, View Booking */}
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link
              href={`/${locale}/user/bookings/${bookingResult.id}/ticket`}
              className="min-h-[44px] inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep px-5 py-2.5 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm transition-all border border-gold-royal/40"
            >
              <QrCode className="w-4 h-4 text-maroon-deep" />
              <span>{isHi ? "डिजिटल पास देखें" : "View Ticket"}</span>
            </Link>

            <Link
              href={`/${locale}/user/bookings/${bookingResult.id}/invoice`}
              className="min-h-[44px] inline-flex items-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory px-5 py-2.5 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm transition-colors border border-gold-royal/40"
            >
              <Download className="w-4 h-4 text-gold-soft" />
              <span>{isHi ? "रसीद डाउनलोड करें" : "Download Invoice"}</span>
            </Link>

            <Link
              href={`/${locale}/user/bookings/${bookingResult.id}`}
              className="min-h-[44px] inline-flex items-center gap-2 bg-cream-warm hover:bg-sandstone-200 text-stone-800 px-5 py-2.5 rounded-xl font-serif font-semibold text-xs sm:text-sm shadow-sm transition-colors border border-sandstone-300"
            >
              <FileText className="w-4 h-4 text-maroon-deep" />
              <span>{isHi ? "बुकिंग विवरण" : "View Booking"}</span>
            </Link>

            <Link
              href={`/${locale}/user/bookings`}
              className="min-h-[44px] inline-flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-2.5 rounded-xl font-serif font-medium text-xs sm:text-sm transition-colors"
            >
              <span>{isHi ? "मेरी बुकिंग्स" : "My Bookings"}</span>
              <ArrowRight className="w-4 h-4 text-stone-500" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
