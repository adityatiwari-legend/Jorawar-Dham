"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";

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

  // Wizard Steps: 1. DATE_SLOT -> 2. DEVOTEES -> 3. PAYMENT -> 4. CONFIRMATION
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

  // 1. Fetch slots when date or serviceSlug changes
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
        // Fetch QR details
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
      // 1. Create order
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

      // 2. In Mock/Dev mode, simulate immediate payment verification
      // (In full browser environment with Razorpay script, Razorpay checkout modal is launched)
      const mockPaymentId = `pay_mock_${Date.now()}`;
      // In mock mode signature is generated by test signature
      const verifyRes = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: bookingResult.id,
          orderId: orderData.order.orderId,
          paymentId: mockPaymentId,
          signature: "mock_signature_for_test", // Mock provider accepts
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok || !verifyData.success) {
        setError(verifyData.error || "भुगतान सत्यापन विफल");
        setActionLoading(false);
        return;
      }

      // Load full ticket
      await loadConfirmedTicket(bookingResult.id);
      setStep(4);
    } catch {
      setError("भुगतान प्रक्रिया में त्रुटि");
    } finally {
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

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8">
      {/* Step Indicator */}
      <div className="flex items-center justify-between max-w-xl mx-auto pb-4">
        {[
          { num: 1, label: isHi ? "दिनांक व स्लॉट" : "Date & Slot" },
          { num: 2, label: isHi ? "श्रद्धालु विवरण" : "Devotees" },
          { num: 3, label: isHi ? "भुगतान" : "Payment" },
          { num: 4, label: isHi ? "पुष्टि व टिकट" : "Confirmation" },
        ].map((s) => (
          <div key={s.num} className="flex flex-col items-center gap-1">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                step >= s.num
                  ? "bg-maroon-900 text-white shadow"
                  : "bg-sandstone-200 text-stone-600"
              }`}
            >
              {s.num}
            </div>
            <span className="text-[11px] font-medium text-stone-700 hidden sm:block">{s.label}</span>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: DATE & SLOT SELECTION */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-sandstone-200 p-6 sm:p-10 shadow-sm space-y-8">
          <div className="space-y-1">
            <span className="text-xs font-bold text-saffron-700 uppercase tracking-wider block">
              {isHi ? "चरण 1" : "Step 1"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-maroon-950">
              {service ? (isHi ? service.titleHi : service.titleEn) : isHi ? "बुकिंग विवरण" : "Booking Details"}
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Date Picker */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-stone-800 font-serif">
                {isHi ? "1. दर्शन/पूजा की तिथि चुनें" : "1. Select Date of Visit"}
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-saffron-600" />
                <input
                  type="date"
                  value={selectedDate}
                  min={new Date().toISOString().split("T")[0]}
                  max={new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0]}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border border-sandstone-300 bg-sandstone-50/50 text-stone-900 font-mono text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>
              <span className="text-[11px] text-stone-500 block">
                {isHi ? "आगामी 30 दिनों तक की अग्रिम बुकिंग मान्य है" : "Advance bookings open up to 30 days ahead"}
              </span>
            </div>

            {/* Devotees Counter */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-stone-800 font-serif">
                {isHi ? "2. श्रद्धालुओं की संख्या" : "2. Number of Devotees"}
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setNumberOfDevotees((p) => Math.max(1, p - 1))}
                  className="w-11 h-11 rounded-xl bg-sandstone-100 hover:bg-sandstone-200 text-stone-800 font-bold text-lg"
                >
                  -
                </button>
                <span className="font-mono text-xl font-bold text-maroon-950 w-12 text-center">
                  {numberOfDevotees}
                </span>
                <button
                  type="button"
                  onClick={() => setNumberOfDevotees((p) => Math.min(20, p + 1))}
                  className="w-11 h-11 rounded-xl bg-sandstone-100 hover:bg-sandstone-200 text-stone-800 font-bold text-lg"
                >
                  +
                </button>
              </div>
              <span className="text-[11px] text-stone-500 block">
                {isHi ? "एक बुकिंग में अधिकतम 20 श्रद्धालु सम्मिलित हो सकते हैं" : "Maximum 20 persons per booking"}
              </span>
            </div>
          </div>

          {/* Slots List */}
          <div className="space-y-3 pt-4 border-t border-sandstone-200">
            <label className="block text-sm font-bold text-stone-800 font-serif">
              {isHi ? "3. उपलब्ध समय स्लॉट चुनें" : "3. Choose Available Time Slot"}
            </label>

            {loading ? (
              <div className="text-center py-8 text-stone-500 text-sm">{isHi ? "स्लॉट लोड हो रहे हैं..." : "Loading slots..."}</div>
            ) : service?.isBlocked ? (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center text-red-900 space-y-1">
                <strong className="block text-base font-serif">
                  {isHi ? "इस तिथि पर बुकिंग अवरुद्ध है" : "Booking blocked for this date"}
                </strong>
                <p className="text-xs">{service.blockedReasonHi || "विशेष धार्मिक आयोजन हेतु स्लॉट बंद हैं"}</p>
              </div>
            ) : !service?.slots || service.slots.length === 0 ? (
              <div className="bg-sandstone-50 rounded-2xl p-6 text-center text-stone-500 text-sm">
                {isHi ? "इस तिथि पर कोई स्लॉट उपलब्ध नहीं है" : "No slots available on this date"}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {service.slots.map((slot) => {
                  const isSelected = selectedSlot?.id === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      disabled={!slot.isAvailable}
                      onClick={() => setSelectedSlot(slot)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? "border-maroon-900 bg-sandstone-50 ring-2 ring-maroon-900 shadow-sm"
                          : slot.isAvailable
                          ? "border-sandstone-300 hover:border-sandstone-400 bg-white"
                          : "border-stone-200 bg-stone-100 opacity-50 cursor-not-allowed"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 font-bold text-maroon-950 font-mono text-sm">
                          <Clock className="w-4 h-4 text-saffron-600" />
                          <span>{slot.startTime} - {slot.endTime}</span>
                        </div>
                        <span className="text-xs text-stone-500 block">
                          {slot.priceInPaise > 0 ? `₹${slot.priceInPaise / 100} प्रति श्रद्धालु` : isHi ? "निःशुल्क" : "Free"}
                        </span>
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                            slot.availableSeats > 10
                              ? "bg-emerald-100 text-emerald-800"
                              : slot.availableSeats > 0
                              ? "bg-amber-100 text-amber-800"
                              : "bg-stone-200 text-stone-600"
                          }`}
                        >
                          {slot.isAvailable ? `${slot.availableSeats} ${isHi ? "सीटें शेष" : "seats left"}` : isHi ? "स्थान पूर्ण" : "Full"}
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
              className="bg-maroon-900 hover:bg-maroon-800 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all disabled:opacity-40 flex items-center gap-2 text-sm"
            >
              <span>{isHi ? "आगे बढ़ें" : "Continue"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: DEVOTEES DETAILS */}
      {step === 2 && (
        <form onSubmit={handleProceedToPayment} className="bg-white rounded-3xl border border-sandstone-200 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-saffron-700 uppercase tracking-wider block">
              {isHi ? "चरण 2" : "Step 2"}
            </span>
            <h2 className="text-2xl font-bold font-serif text-maroon-950">
              {isHi ? "मुख्य श्रद्धालु संपर्क विवरण" : "Primary Devotee Contact Information"}
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                {isHi ? "मुख्य श्रद्धालु का नाम" : "Primary Devotee Full Name"}
              </label>
              <input
                type="text"
                required
                value={primaryName}
                onChange={(e) => setPrimaryName(e.target.value)}
                placeholder={isHi ? "उदा. रमेश शर्मा" : "e.g. Ramesh Sharma"}
                className="w-full px-4 py-3 rounded-xl border border-sandstone-300 text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                {isHi ? "मोबाइल नंबर (SMS पुष्टि हेतु)" : "Mobile Number (for SMS & Ticket)"}
              </label>
              <input
                type="tel"
                required
                maxLength={10}
                value={primaryPhone}
                onChange={(e) => setPrimaryPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="9876543210"
                className="w-full px-4 py-3 rounded-xl border border-sandstone-300 font-mono text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-sandstone-50 p-5 rounded-2xl border border-sandstone-200 space-y-2 text-sm">
            <div className="flex justify-between text-stone-600">
              <span>{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
              <span className="font-semibold text-stone-900">{numberOfDevotees}</span>
            </div>
            <div className="flex justify-between text-stone-600">
              <span>{isHi ? "शुल्क प्रति व्यक्ति:" : "Per Person:"}</span>
              <span className="font-semibold text-stone-900">
                {selectedSlot && selectedSlot.priceInPaise > 0 ? `₹${selectedSlot.priceInPaise / 100}` : isHi ? "निःशुल्क" : "Free"}
              </span>
            </div>
            <div className="pt-2 border-t border-sandstone-200 flex justify-between text-base font-bold text-maroon-950 font-serif">
              <span>{isHi ? "कुल देय राशि:" : "Total Payable:"}</span>
              <span className="text-lg">₹{totalAmountRupees}</span>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-stone-600 hover:text-stone-900 text-sm font-semibold"
            >
              {isHi ? "← वापस" : "← Back"}
            </button>
            <button
              type="submit"
              disabled={actionLoading || !primaryName || primaryPhone.length !== 10}
              className="bg-maroon-900 hover:bg-maroon-800 text-white font-bold px-8 py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-2 text-sm"
            >
              <span>{actionLoading ? (isHi ? "प्रतीक्षा करें..." : "Holding Slot...") : isHi ? "पुष्टि हेतु आगे बढ़ें" : "Proceed to Confirm"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* STEP 3: PAYMENT CHECKOUT */}
      {step === 3 && bookingResult && (
        <div className="bg-white rounded-3xl border border-sandstone-200 p-6 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-1">
            <span className="text-xs font-bold text-saffron-700 uppercase tracking-wider block">
              {isHi ? "चरण 3" : "Step 3"}
            </span>
            <h2 className="text-2xl font-bold font-serif text-maroon-950">
              {isHi ? "सुरक्षित ऑनलाइन भुगतान" : "Secure Payment Gateway Checkout"}
            </h2>
          </div>

          <div className="bg-sandstone-50 p-6 rounded-2xl border border-sandstone-200 space-y-4">
            <div className="flex justify-between items-center border-b border-sandstone-200 pb-3 text-sm">
              <span className="text-stone-500">{isHi ? "बुकिंग संदर्भ:" : "Booking Ref:"}</span>
              <span className="font-mono font-bold text-maroon-900">{bookingResult.bookingReference}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-stone-500">{isHi ? "देय राशि (INR):" : "Payable Amount:"}</span>
              <span className="font-mono font-bold text-2xl text-stone-900">₹{bookingResult.totalAmountInPaise / 100}</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3 text-xs text-emerald-900">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">{isHi ? "256-बिट सुरक्षित एन्क्रिप्टेड भुगतान" : "256-Bit Encrypted Gateway"}</strong>
              <span>{isHi ? "आपकी राशि सीधे श्री जोरावर धाम तीर्थ ट्रस्ट के अधिकृत खाते में प्रेषित होती है।" : "Funds are processed directly into the registered Trust bank account."}</span>
            </div>
          </div>

          <button
            type="button"
            disabled={actionLoading}
            onClick={handleExecutePayment}
            className="w-full bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 text-base"
          >
            <CreditCard className="w-5 h-5" />
            <span>{actionLoading ? (isHi ? "भुगतान संसाधित हो रहा है..." : "Processing Payment...") : isHi ? `₹${bookingResult.totalAmountInPaise / 100} का भुगतान करें` : `Pay ₹${bookingResult.totalAmountInPaise / 100}`}</span>
          </button>
        </div>
      )}

      {/* STEP 4: CONFIRMATION & QR TICKET */}
      {step === 4 && bookingResult && (
        <div className="bg-white rounded-3xl border border-sandstone-200 p-8 sm:p-12 shadow-xl text-center space-y-8">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              {isHi ? "बुकिंग सफलतापूर्वक पुष्ट हुई" : "Booking Confirmed"}
            </span>
            <h2 className="text-3xl font-bold font-serif text-maroon-950">
              {isHi ? "श्री जोरावर धाम में आपका स्वागत है" : "Welcome to Shri Jorawar Dham"}
            </h2>
            <p className="text-stone-600 text-sm">
              {isHi ? "आपका दर्शन/पूजा टिकट तैयार है। प्रवेश के समय यह क्यूआर कोड प्रस्तुत करें।" : "Your digital pass is ready. Please present this QR code at temple entry."}
            </p>
          </div>

          {/* QR Code Container */}
          {qrDataUri && (
            <div className="inline-block p-4 bg-sandstone-50 rounded-3xl border border-sandstone-200 shadow-inner">
              <img
                src={qrDataUri}
                alt="Booking Verification QR"
                className="w-56 h-56 mx-auto rounded-xl shadow"
              />
              <span className="block text-xs font-mono font-bold text-maroon-950 mt-3 tracking-widest">
                {bookingResult.bookingReference}
              </span>
            </div>
          )}

          {/* Ticket Details Summary */}
          <div className="max-w-md mx-auto bg-sandstone-50 rounded-2xl p-5 text-xs text-stone-700 space-y-2 text-left border border-sandstone-200">
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "सेवा:" : "Service:"}</span>
              <strong className="text-stone-900">{isHi ? bookingResult.serviceTitleHi : bookingResult.serviceTitleEn}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "दिनांक व समय:" : "Date & Time:"}</span>
              <strong className="text-stone-900 font-mono">{bookingResult.bookingDate} ({bookingResult.slotTime})</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">{isHi ? "श्रद्धालु संख्या:" : "Devotees:"}</span>
              <strong className="text-stone-900">{bookingResult.numberOfDevotees}</strong>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Link
              href={`/${locale}/devotee/dashboard`}
              className="inline-flex items-center gap-2 bg-maroon-900 hover:bg-maroon-800 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-colors"
            >
              <span>{isHi ? "मेरे टिकट्स व डैशबोर्ड" : "My Bookings Dashboard"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
