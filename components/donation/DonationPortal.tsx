"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import {
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Building2,
  Lock,
  ArrowRight,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

interface DonationCause {
  id: string;
  slug: string;
  titleHi: string;
  titleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  suggestedAmountsInRupees: number[];
  targetAmountInRupees?: number | null;
  collectedAmountInRupees?: number;
}

export default function DonationPortal({ locale }: { locale: string }) {
  const isHi = locale === "hi";

  const [causes, setCauses] = useState<DonationCause[]>([]);
  const [selectedCauseId, setSelectedCauseId] = useState<string>("");
  const [amount, setAmount] = useState<number>(501);
  const [customAmount, setCustomAmount] = useState<string>("");
  const [isCustom, setIsCustom] = useState<boolean>(false);

  // Donor form
  const [donorName, setDonorName] = useState("");
  const [donorPhone, setDonorPhone] = useState("");
  const [donorEmail, setDonorEmail] = useState("");
  const [donorPan, setDonorPan] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  // States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successReceipt, setSuccessReceipt] = useState<{
    receiptNumber: string;
    donationReference: string;
    amountInRupees: number;
    causeTitle: string;
    donationId: string;
  } | null>(null);

  useEffect(() => {
    fetch("/api/public/donation-causes")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.causes.length > 0) {
          setCauses(data.causes);
          setSelectedCauseId(data.causes[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const selectedCause = causes.find((c) => c.id === selectedCauseId);
  const presetAmounts = selectedCause?.suggestedAmountsInRupees || [251, 501, 1100, 2100, 5100];

  const handleSelectPreset = (val: number) => {
    setIsCustom(false);
    setAmount(val);
    setCustomAmount("");
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, "");
    setCustomAmount(val);
    setIsCustom(true);
    setAmount(Number(val) || 0);
  };

  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (amount < 10) {
      setError(isHi ? "न्यूनतम सहयोग राशि ₹10 है" : "Minimum donation amount is ₹10");
      return;
    }

    if (!donorPhone || donorPhone.length !== 10) {
      setError(isHi ? "कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें" : "Enter a valid 10-digit mobile number");
      return;
    }

    setLoading(true);

    try {
      // 1. Create order
      const res = await fetch("/api/donations/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          causeId: selectedCauseId || null,
          amountInRupees: amount,
          donorName: isAnonymous ? (isHi ? "गोपनीय श्रद्धालु" : "Anonymous Devotee") : donorName,
          donorPhone,
          donorEmail: donorEmail.trim() || undefined,
          donorPan: donorPan.trim() ? donorPan.trim().toUpperCase() : undefined,
          isAnonymous,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || (isHi ? "दान आदेश निर्माण में त्रुटि" : "Failed to initiate donation"));
      }

      const { donationId, gatewayOrderId, keyId, amountInPaise, isMock, donationReference } = data;

      // 2. Safe Gateway Handling:
      // If mock mode is active, NEVER invoke real Razorpay checkout.js (which would contact api.razorpay.com and trigger a 401 Basic Auth popup).
      if (isMock || !keyId || keyId.startsWith("rzp_mock_") || keyId.includes("placeholder")) {
        const verifyRes = await fetch("/api/donations/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            donationId,
            orderId: gatewayOrderId,
            paymentId: `pay_mock_${Date.now()}`,
            signature: "mock_signature_dev",
          }),
        });
        const verifyData = await verifyRes.json();
        if (verifyData.success) {
          setSuccessReceipt({
            receiptNumber: verifyData.receiptNumber,
            donationReference,
            amountInRupees: amount,
            causeTitle: selectedCause ? selectedCause.titleHi : "सामान्य सेवा",
            donationId,
          });
        } else {
          setError(verifyData.error || (isHi ? "भुगतान सत्यापन असफल" : "Payment verification failed"));
        }
        setLoading(false);
        return;
      }

      // 3. Official Razorpay Checkout Flow (Live / Test Mode)
      if (typeof window === "undefined" || !(window as any).Razorpay) {
        throw new Error(
          isHi
            ? "रेज़रपे भुगतान गेटवे लोड नहीं हो सका। कृपया पृष्ठ को पुनः लोड करें।"
            : "Razorpay Checkout failed to initialize. Please refresh the page."
        );
      }

      const options = {
        key: keyId,
        amount: amountInPaise,
        currency: "INR",
        name: isHi ? "सिद्ध श्री जोरावर धाम सेवा समिति" : "Siddh Shri Jorawar Dham Seva Samiti",
        description: selectedCause ? (isHi ? selectedCause.titleHi : selectedCause.titleEn) : "Dham Seva",
        order_id: gatewayOrderId,
        prefill: {
          name: donorName,
          contact: donorPhone,
          email: donorEmail || undefined,
        },
        theme: {
          color: "#881337",
        },
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch("/api/donations/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                donationId,
                orderId: response.razorpay_order_id || gatewayOrderId,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              setSuccessReceipt({
                receiptNumber: verifyData.receiptNumber,
                donationReference,
                amountInRupees: amount,
                causeTitle: selectedCause ? selectedCause.titleHi : "सामान्य सेवा",
                donationId,
              });
            } else {
              setError(verifyData.error || (isHi ? "भुगतान सत्यापन असफल" : "Payment verification failed"));
            }
          } catch {
            setError(isHi ? "सत्यापन सर्वर से संपर्क नहीं हो सका" : "Failed to contact verification server");
          } finally {
            setLoading(false);
          }
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", function (failResp: any) {
        setError(failResp.error?.description || (isHi ? "भुगतान असफल रहा" : "Payment failed"));
        setLoading(false);
      });
      rzp.open();
    } catch (err: any) {
      setError(err.message || (isHi ? "भुगतान प्रक्रिया में त्रुटि" : "Payment processing error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="bg-gradient-to-br from-amber-50/50 via-white to-stone-50 rounded-3xl border-2 border-saffron-200/60 shadow-xl overflow-hidden p-6 sm:p-10 space-y-8">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-saffron-100 text-saffron-700 flex items-center justify-center mx-auto border border-saffron-300 shadow-sm">
            <HeartHandshake className="w-6 h-6" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-serif text-maroon-950">
            {isHi ? "ऑनलाइन धर्मार्थ सहयोग व संकल्प" : "Online Charitable Contribution"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 max-w-lg mx-auto">
            {isHi
              ? "अन्नक्षेत्र, कामधेनु गौशाला एवं धाम विस्तार हेतु त्वरित व सुरक्षित ऑनलाइन दान (Razorpay / UPI / NetBanking)"
              : "Instant, safe online seva contribution via Razorpay / UPI / NetBanking"}
          </p>
        </div>

        {/* Success Confirmation Card */}
        {successReceipt ? (
          <div className="bg-emerald-50 border-2 border-emerald-400 rounded-3xl p-6 sm:p-8 space-y-5 text-center animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-black text-emerald-800 bg-emerald-200/80 px-3.5 py-1 rounded-full">
                {isHi ? "दान संकल्प सफलतापूर्वक प्राप्त" : "Donation Received with Gratitude"}
              </span>
              <h3 className="text-2xl font-bold text-emerald-950 mt-3 font-serif">
                ₹{successReceipt.amountInRupees.toLocaleString("en-IN")}
              </h3>
              <p className="text-xs text-emerald-800 mt-1">
                {isHi ? `प्रकल्प: ${successReceipt.causeTitle}` : `Cause: ${successReceipt.causeTitle}`}
              </p>
            </div>

            <div className="max-w-sm mx-auto bg-white p-4 rounded-2xl border border-emerald-200 text-xs space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-stone-500">{isHi ? "रसीद संख्या:" : "Receipt No:"}</span>
                <span className="font-mono font-bold text-stone-900">{successReceipt.receiptNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">{isHi ? "संदर्भ कोड:" : "Reference:"}</span>
                <span className="font-mono text-stone-700">{successReceipt.donationReference}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <a
                href={`/api/donations/${successReceipt.donationId}/receipt`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-emerald-800 text-white font-bold rounded-xl text-xs hover:bg-emerald-900 shadow-md transition"
              >
                <FileText className="w-4 h-4" />
                <span>{isHi ? "डिजिटल रसीद देखें / डाउनलोड करें" : "View / Print Receipt"}</span>
              </a>
              <button
                onClick={() => setSuccessReceipt(null)}
                className="px-4 py-2.5 bg-stone-200 text-stone-800 font-semibold rounded-xl text-xs hover:bg-stone-300 transition"
              >
                {isHi ? "अन्य दान करें" : "Make Another Donation"}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleDonateSubmit} className="space-y-6">
            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* 1. Cause Selection */}
            {causes.length > 0 && (
              <div className="space-y-2.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                  {isHi ? "1. सेवा / दान प्रकल्प का चयन करें" : "1. Select Sacred Cause"}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {causes.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedCauseId(c.id);
                        if (c.suggestedAmountsInRupees?.[0]) {
                          handleSelectPreset(c.suggestedAmountsInRupees[0]);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        selectedCauseId === c.id
                          ? "bg-saffron-50 border-saffron-600 shadow-sm ring-2 ring-saffron-500/20"
                          : "bg-white border-stone-200 hover:border-stone-300"
                      }`}
                    >
                      <span className="font-bold text-xs text-stone-900 block font-serif">
                        {isHi ? c.titleHi : c.titleEn}
                      </span>
                      <span className="text-[11px] text-stone-500 mt-1 line-clamp-2 block">
                        {isHi ? c.descriptionHi : c.descriptionEn}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Amount Selection */}
            <div className="space-y-3">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                {isHi ? "2. दान राशि (INR) चुनें" : "2. Select Contribution Amount (INR)"}
              </label>

              {/* Preset Chips */}
              <div className="flex flex-wrap gap-2.5">
                {presetAmounts.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handleSelectPreset(p)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      !isCustom && amount === p
                        ? "bg-maroon-900 text-white shadow-md"
                        : "bg-white border border-stone-200 text-stone-800 hover:bg-stone-50"
                    }`}
                  >
                    ₹{p.toLocaleString("en-IN")}
                  </button>
                ))}
              </div>

              {/* Custom Amount Input */}
              <div className="relative max-w-xs pt-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-stone-400">
                  ₹
                </span>
                <input
                  type="text"
                  value={customAmount}
                  onChange={handleCustomChange}
                  placeholder={isHi ? "अन्य राशि दर्ज करें..." : "Other amount..."}
                  className={`w-full pl-8 pr-4 py-2.5 rounded-xl border text-sm font-bold ${
                    isCustom
                      ? "border-saffron-600 ring-2 ring-saffron-500/20"
                      : "border-stone-300 focus:border-saffron-600"
                  }`}
                />
              </div>
            </div>

            {/* 3. Donor Information Form */}
            <div className="space-y-4 pt-3 border-t border-stone-200/80">
              <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                {isHi ? "3. श्रद्धालु विवरण (Donor Information)" : "3. Donor Details"}
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {isHi ? "पूरा नाम *" : "Full Name *"}
                  </label>
                  <input
                    type="text"
                    required={!isAnonymous}
                    disabled={isAnonymous}
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder={isHi ? "उदा. रमेश शर्मा" : "e.g. Ramesh Sharma"}
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-saffron-500 disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {isHi ? "मोबाइल नंबर (रसीद हेतु) *" : "Mobile Number (For Receipt) *"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value.replace(/\D/g, ""))}
                      placeholder="9876543210"
                      className="w-full pl-12 pr-3 p-2.5 border border-stone-300 rounded-xl font-mono focus:ring-2 focus:ring-saffron-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {isHi ? "ईमेल (वैकल्पिक)" : "Email Address (Optional)"}
                  </label>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="devotee@example.com"
                    className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-saffron-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {isHi ? "पैन नंबर (PAN - आयकर अभिलेख हेतु वैकल्पिक)" : "PAN Number (Optional)"}
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={donorPan}
                    onChange={(e) => setDonorPan(e.target.value.toUpperCase())}
                    placeholder="ABCDE1234F"
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-mono uppercase focus:ring-2 focus:ring-saffron-500"
                  />
                </div>
              </div>

              {/* Anonymous Checkbox */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="anonymousCheck"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4 text-saffron-600 rounded"
                />
                <label htmlFor="anonymousCheck" className="text-xs text-stone-600 font-medium">
                  {isHi
                    ? "मेरा नाम सार्वजनिक सूचियों में गुप्त रखें (Donate Anonymously)"
                    : "Keep my name anonymous on public donor boards"}
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-stone-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2 text-xs text-stone-500">
                <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {isHi
                    ? "256-बिट SSL सुरक्षित भुगतान (Razorpay / 100% Secure)"
                    : "256-bit SSL encrypted payment gateway (Razorpay)"}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || amount < 10}
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-gradient-to-r from-saffron-600 to-amber-700 hover:from-saffron-700 hover:to-amber-800 text-white font-bold rounded-2xl text-sm shadow-lg shadow-saffron-600/20 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{isHi ? "प्रक्रिया जारी है..." : "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <span>
                      {isHi
                        ? `₹${amount.toLocaleString("en-IN")} दान हेतु आगे बढ़ें`
                        : `Proceed to Donate ₹${amount.toLocaleString("en-IN")}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
