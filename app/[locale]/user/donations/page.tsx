"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Script from "next/script";
import {
  Heart,
  CreditCard,
  CheckCircle2,
  FileText,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Download,
  Info,
  Clock,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

interface DonationCause {
  id: string;
  slug: string;
  titleHi: string;
  titleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  suggestedAmounts: number[];
}

interface UserDonation {
  id: string;
  donationReference: string;
  amountInRupees: number;
  currency: string;
  status: string;
  causeTitleHi: string;
  causeTitleEn: string;
  donorName: string;
  receiptNumber?: string;
  paymentReference: string;
  createdAt: string;
}

export default function UserDonationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);
  const isHi = locale === "hi";
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"MAKE" | "HISTORY">("MAKE");
  const [donations, setDonations] = useState<UserDonation[]>([]);
  const [causes, setCauses] = useState<DonationCause[]>([]);
  const [devotee, setDevotee] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedCauseId, setSelectedCauseId] = useState<string>("");
  const [selectedAmount, setSelectedAmount] = useState<number>(501);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [donorName, setDonorName] = useState<string>("");
  const [donorPhone, setDonorPhone] = useState<string>("");
  const [donorEmail, setDonorEmail] = useState<string>("");
  const [donorPan, setDonorPan] = useState<string>("");
  const [donorCity, setDonorCity] = useState<string>("");
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);

  // Flow State
  const [step, setStep] = useState<"FORM" | "REVIEW" | "CONFIRMED">("FORM");
  const [confirmedDonation, setConfirmedDonation] = useState<any>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [meRes, donRes, causeRes] = await Promise.all([
          fetch("/api/auth/devotee/me"),
          fetch("/api/donations"),
          fetch("/api/public/causes").catch(() => null),
        ]);

        if (meRes.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/user/donations`);
          return;
        }

        const meData = await meRes.json();
        if (meData.success) {
          setDevotee(meData.user);
          setDonorName(meData.user.fullName || "");
          setDonorPhone(meData.user.phone || "");
        }

        if (donRes.ok) {
          const donData = await donRes.json();
          if (donData.success) setDonations(donData.donations || []);
        }

        // Load causes
        try {
          const cRes = await fetch("/api/admin/donations/causes");
          if (cRes.ok) {
            const cData = await cRes.json();
            if (cData.success && cData.causes) {
              setCauses(cData.causes);
              if (cData.causes.length > 0) setSelectedCauseId(cData.causes[0].id);
            }
          }
        } catch {}
      } catch (err) {
        console.error("Donation portal loading error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [locale, router]);

  const finalAmount = customAmount && parseInt(customAmount, 10) > 0
    ? parseInt(customAmount, 10)
    : selectedAmount;

  const handleInitiateDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (finalAmount < 10) {
      setErrorMessage(isHi ? "न्यूनतम दान राशि ₹10 है" : "Minimum donation amount is ₹10");
      return;
    }

    setActionLoading(true);

    try {
      // 1. Create donation order on backend
      const res = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          causeId: selectedCauseId || null,
          amountInRupees: finalAmount,
          donorName: isAnonymous ? "गुप्त दानदाता (Anonymous)" : donorName,
          donorPhone: donorPhone,
          donorEmail: donorEmail || undefined,
          donorPan: donorPan || undefined,
          donorCity: donorCity || undefined,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || "दान आदेश सृजन में त्रुटि");
        setActionLoading(false);
        return;
      }

      const { donationId, order } = data;

      // 2. Mock Gateway or Razorpay
      if (order.isMock || !order.keyId || order.keyId.startsWith("rzp_mock_")) {
        const mockPaymentId = `pay_don_mock_${Date.now()}`;
        const verifyRes = await fetch("/api/donations/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donationId,
            orderId: order.orderId,
            paymentId: mockPaymentId,
            signature: "mock_signature_verified",
          }),
        });

        const verifyData = await verifyRes.json();
        if (!verifyRes.ok || !verifyData.success) {
          setErrorMessage(verifyData.error || "दान सत्यापन विफल");
          setActionLoading(false);
          return;
        }

        setConfirmedDonation(verifyData.donation || { id: donationId, amountInRupees: finalAmount });
        setStep("CONFIRMED");
        setActionLoading(false);
        return;
      }

      // 3. Real Razorpay Checkout
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const options = {
        key: order.keyId,
        amount: order.amountInPaise,
        currency: "INR",
        name: isHi ? "सिद्ध श्री जोरावर धाम सेवा समिति" : "Siddh Shri Jorawar Dham Seva Samiti",
        description: "पवित्र धार्मिक एवं धर्मार्थ दान",
        order_id: order.orderId,
        prefill: {
          name: donorName,
          contact: donorPhone,
          email: donorEmail,
        },
        theme: { color: "#881337" },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/donations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                donationId,
                orderId: response.razorpay_order_id || order.orderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setConfirmedDonation(verifyData.donation || { id: donationId, amountInRupees: finalAmount });
              setStep("CONFIRMED");
            } else {
              setErrorMessage(verifyData.error || "दान सत्यापन में त्रुटि");
            }
          } catch {
            setErrorMessage("सत्यापन सर्वर से संपर्क नहीं हो सका");
          } finally {
            setActionLoading(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch {
      setErrorMessage("दान प्रक्रिया प्रारंभ करने में असमर्थ");
      setActionLoading(false);
    }
  };

  return (
    <div className="py-10 sm:py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-8">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {/* Header */}
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
            {isHi ? "धर्मार्थ सहयोग एवं दान सेवा" : "Charitable Offerings & Seva"}
          </h1>
          <p className="text-xs text-stone-500">
            {isHi
              ? "सिद्ध श्री जोरावर धाम के अन्नक्षेत्र, गौशाला, मंदिर प्रकल्प एवं धर्मार्थ कार्यों में पावन सहयोग"
              : "Support Annakshetra, Gaushala, and sacred temple projects at Siddh Shri Jorawar Dham"}
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 bg-cream-ivory p-1.5 rounded-2xl border border-sandstone-300 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setActiveTab("MAKE");
              setStep("FORM");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
              activeTab === "MAKE"
                ? "bg-maroon-deep text-cream-ivory shadow-sm"
                : "text-stone-700 hover:bg-sandstone-200"
            }`}
          >
            {isHi ? "दान करें (Contribute)" : "Make Donation"}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("HISTORY")}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold transition-all ${
              activeTab === "HISTORY"
                ? "bg-maroon-deep text-cream-ivory shadow-sm"
                : "text-stone-700 hover:bg-sandstone-200"
            }`}
          >
            {isHi ? `दान इतिहास (${donations.length})` : `Donation History (${donations.length})`}
          </button>
        </div>
      </div>

      {/* TAB 1: MAKE DONATION */}
      {activeTab === "MAKE" && (
        <>
          {step === "CONFIRMED" && confirmedDonation ? (
            <div className="bg-cream-ivory rounded-3xl border-2 border-gold-royal/40 p-8 sm:p-12 text-center space-y-6 shadow-sacred-md">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-widest block">
                  ॥ श्री जोरावर जी प्रसन्न ॥
                </span>
                <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
                  {isHi ? "पावन सहयोग हेतु आपका कोटि-कोटि धन्यवाद" : "Thank you for your generous contribution"}
                </h2>
                <p className="text-xs text-stone-600 max-w-md mx-auto">
                  {isHi
                    ? `आपका दान (₹${confirmedDonation.amountInRupees || finalAmount}) सफलतापूर्वक प्राप्त हुआ है। आपकी आधिकारिक रसीद जारी कर दी गई है।`
                    : `Your contribution of ₹${confirmedDonation.amountInRupees || finalAmount} was received successfully.`}
                </p>
              </div>

              <div className="flex flex-wrap justify-center gap-3 pt-4">
                <Link
                  href={`/${locale}/user/donations/${confirmedDonation.id}/receipt`}
                  className="min-h-[44px] inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep font-serif font-bold text-xs px-6 py-2.5 rounded-xl shadow-sacred-sm border border-gold-royal/40"
                >
                  <Download className="w-4 h-4 text-maroon-deep" />
                  <span>{isHi ? "दान रसीद डाउनलोड करें" : "Download Donation Receipt"}</span>
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setStep("FORM");
                    setCustomAmount("");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-serif font-semibold"
                >
                  {isHi ? "अन्य दान करें" : "Make Another Donation"}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInitiateDonation} className="bg-cream-ivory rounded-3xl border border-sandstone-300 p-6 sm:p-10 shadow-sacred-sm space-y-8">
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* 1. Cause Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-maroon-deep">
                  {isHi ? "1. पुण्य प्रकल्प / सेवा का चयन करें" : "1. Select Sacred Cause / Project"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {causes.map((c) => {
                    const isSelected = selectedCauseId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCauseId(c.id)}
                        className={`p-4 rounded-2xl border text-left transition-all subtle-lift ${
                          isSelected
                            ? "bg-cream-warm border-gold-royal ring-2 ring-gold-royal/30 shadow-sm"
                            : "bg-white hover:bg-cream-warm/50 border-sandstone-200"
                        }`}
                      >
                        <strong className="block text-sm font-serif font-bold text-maroon-deep">
                          {isHi ? c.titleHi : c.titleEn}
                        </strong>
                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">
                          {isHi ? c.descriptionHi : c.descriptionEn}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Amount Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-maroon-deep">
                  {isHi ? "2. दान राशि (INR) चुनें" : "2. Select Donation Amount (INR)"}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {[251, 501, 1100, 2100, 5100, 11000].map((amt) => {
                    const isSelected = selectedAmount === amt && !customAmount;
                    return (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => {
                          setSelectedAmount(amt);
                          setCustomAmount("");
                        }}
                        className={`py-3 rounded-2xl border text-center font-mono font-bold text-sm transition-all ${
                          isSelected
                            ? "bg-maroon-deep text-cream-ivory border-gold-royal shadow-sm ring-2 ring-gold-royal/30"
                            : "bg-cream-warm hover:bg-sandstone-200 border-sandstone-200 text-stone-800"
                        }`}
                      >
                        ₹{amt}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <label className="block text-xs text-stone-500 mb-1">
                    {isHi ? "अथवा अपनी इच्छानुसार राशि प्रविष्ट करें:" : "Or enter custom amount:"}
                  </label>
                  <div className="relative max-w-xs">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-stone-500 font-bold">₹</span>
                    <input
                      type="number"
                      min={10}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      placeholder="e.g. 10000"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-cream-warm border border-sandstone-300 font-mono text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Donor Details */}
              <div className="space-y-4 pt-2 border-t border-sandstone-200">
                <label className="block text-xs font-serif font-bold uppercase tracking-wider text-maroon-deep">
                  {isHi ? "3. दानदाता विवरण" : "3. Donor Details"}
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-stone-600 mb-1">{isHi ? "पूरा नाम: *" : "Full Name: *"}</label>
                    <input
                      type="text"
                      required
                      value={donorName}
                      onChange={(e) => setDonorName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cream-warm border border-sandstone-300 focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">{isHi ? "मोबाइल नंबर: *" : "Mobile Number: *"}</label>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      placeholder="10 digit mobile"
                      className="w-full p-2.5 rounded-xl bg-cream-warm border border-sandstone-300 font-mono focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">{isHi ? "ईमेल (वैकल्पिक):" : "Email (Optional):"}</label>
                    <input
                      type="email"
                      value={donorEmail}
                      onChange={(e) => setDonorEmail(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-cream-warm border border-sandstone-300 focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-600 mb-1">{isHi ? "पैन नंबर (PAN - वैकल्पिक):" : "PAN Card (Optional):"}</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={donorPan}
                      onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      className="w-full p-2.5 rounded-xl bg-cream-warm border border-sandstone-300 font-mono uppercase focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    />
                  </div>
                </div>

                {/* Anonymous Toggle */}
                <div className="pt-2 flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    id="anonymous-check"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="w-4 h-4 rounded text-maroon-deep focus:ring-gold-royal"
                  />
                  <label htmlFor="anonymous-check" className="text-stone-700 cursor-pointer">
                    {isHi ? "गुप्त दान (सार्वजनिक रूप से नाम प्रदर्शित न करें)" : "Anonymous donation (keep name private)"}
                  </label>
                </div>
              </div>

              {/* Submit CTA */}
              <div className="pt-4 border-t border-sandstone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-stone-500">
                  <span>{isHi ? "कुल देय राशि: " : "Total Amount: "}</span>
                  <strong className="font-mono text-base font-bold text-maroon-deep">₹{finalAmount}</strong>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep font-serif font-bold text-xs sm:text-sm px-8 py-3 rounded-xl shadow-sacred-sm transition-all border border-gold-royal/40"
                >
                  <CreditCard className="w-4 h-4 text-maroon-deep" />
                  <span>
                    {actionLoading
                      ? isHi ? "भुगतान प्रारंभ हो रहा है..." : "Initiating Payment..."
                      : isHi ? `₹${finalAmount} का दान करें` : `Contribute ₹${finalAmount}`}
                  </span>
                </button>
              </div>
            </form>
          )}
        </>
      )}

      {/* TAB 2: DONATION HISTORY */}
      {activeTab === "HISTORY" && (
        <div className="space-y-4">
          {donations.length === 0 ? (
            <div className="bg-cream-ivory rounded-3xl border-2 border-dashed border-sandstone-300 p-12 text-center space-y-4 shadow-sacred-sm">
              <Heart className="w-12 h-12 mx-auto text-sandstone-400" />
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="font-serif font-bold text-base text-maroon-deep">
                  {isHi ? "अभी कोई दान इतिहास उपलब्ध नहीं है।" : "No donation history available yet."}
                </h3>
                <p className="text-xs text-stone-500">
                  {isHi
                    ? "श्री जोरावर धाम के धर्मार्थ एवं सेवा कार्यों में सहयोग देकर पुण्य अर्जित करें।"
                    : "Make a charitable offering towards sacred temple causes."}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab("MAKE")}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep px-6 py-2.5 rounded-xl font-serif font-bold text-xs shadow-sacred-sm border border-gold-royal/40"
              >
                <Heart className="w-4 h-4 text-maroon-deep" />
                <span>{isHi ? "दान करें (Donate Now)" : "Donate Now"}</span>
              </button>
            </div>
          ) : (
            <div className="bg-cream-ivory rounded-3xl border border-sandstone-300 overflow-hidden shadow-sacred-sm divide-y divide-sandstone-200">
              {donations.map((d) => (
                <div key={d.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-gold-royal">
                        {d.donationReference}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          d.status === "PAID"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {d.status}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-stone-900 text-base">
                      {isHi ? d.causeTitleHi : d.causeTitleEn}
                    </h3>

                    <p className="text-xs text-stone-500 font-mono">
                      दिनांक: {d.createdAt} • संदर्भ: {d.paymentReference}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <span className="font-mono font-bold text-xl text-maroon-deep block">
                        ₹{d.amountInRupees}
                      </span>
                    </div>

                    {d.status === "PAID" && (
                      <Link
                        href={`/${locale}/user/donations/${d.id}/receipt`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-deep hover:bg-maroon-primary text-cream-ivory text-xs font-serif font-semibold shadow-sm transition-colors border border-gold-royal/30"
                      >
                        <FileText className="w-3.5 h-3.5 text-gold-soft" />
                        <span>{isHi ? "रसीद डाउनलोड" : "Receipt"}</span>
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
