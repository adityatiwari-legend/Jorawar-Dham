"use client";

import { useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Phone, Sparkles, ShieldCheck, ArrowRight, CheckCircle2, Lock } from "lucide-react";
import { Locale } from "@/lib/utils/i18n";

function DevoteeLoginContent({
  locale,
}: {
  locale: string;
}) {
  const isHi = locale === "hi";
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || `/${locale}/devotee/dashboard`;

  const [step, setStep] = useState<"PHONE" | "OTP">("PHONE");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testOtpNotice, setTestOtpNotice] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (isHi ? "OTP प्रेषण विफल" : "Failed to send OTP"));
        return;
      }

      if (data.testOtp) {
        setTestOtpNotice(data.testOtp);
      }

      setStep("OTP");
    } catch {
      setError(isHi ? "सर्वर से संपर्क नहीं हो सका" : "Network error, please try again");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.error || (isHi ? "सत्यापन विफल" : "Verification failed"));
        return;
      }

      // Success -> navigate to redirect path
      router.push(redirectPath);
      router.refresh();
    } catch {
      setError(isHi ? "सत्यापन में त्रुटि हुई" : "Verification error, please try again");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-md mx-auto">
      <div className="bg-white rounded-3xl border border-sandstone-200 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-br from-maroon-950 to-maroon-900 text-white p-8 text-center space-y-3 relative">
          <div className="flex justify-center mb-1">
            <Link href={`/${locale}`} className="inline-block">
              <img
                src="/branding/jorawar-dham-logo.png"
                alt="सिद्ध श्री जोरावर धाम सेवा समिति"
                className="h-14 sm:h-16 w-auto object-contain rounded-lg border border-gold-400/40 shadow-md bg-blue-950/50 p-1"
              />
            </Link>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold font-serif">
            {isHi ? "श्रद्धालु लॉगिन / पंजीकरण" : "Devotee Portal Sign In"}
          </h1>
          <p className="text-xs text-sandstone-200">
            {isHi
              ? "दर्शन, पूजा एवं सेवा बुकिंग हेतु सुरक्षित मोबाइल सत्यापन"
              : "Secure mobile OTP authentication for Darshan & Seva bookings"}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 font-medium">
              {error}
            </div>
          )}

          {testOtpNotice && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 space-y-1">
              <strong className="block font-semibold">परीक्षण OTP (Test OTP):</strong>
              <span className="font-mono text-base font-bold tracking-widest text-maroon-900">{testOtpNotice}</span>
            </div>
          )}

          {step === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1.5">
                  {isHi ? "मोबाइल नंबर दर्ज करें" : "Enter Mobile Number"}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone-500 text-sm font-semibold border-r border-stone-200 pr-2">
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-sandstone-300 text-stone-900 font-mono text-base focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-stone-500 block mt-1">
                  {isHi ? "हम आपके नंबर पर 6 अंकों का OTP प्रेषित करेंगे" : "We will send a 6-digit OTP to verify"}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white font-bold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <span>{loading ? (isHi ? "प्रतीक्षा करें..." : "Sending...") : isHi ? "OTP प्राप्त करें" : "Send OTP"}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-stone-800">
                    {isHi ? "प्राप्त OTP दर्ज करें" : "Enter 6-Digit OTP"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setTestOtpNotice(null);
                    }}
                    className="text-xs text-saffron-700 hover:underline"
                  >
                    {isHi ? "नंबर बदलें" : "Change Number"}
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="••••••"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-sandstone-300 text-stone-900 font-mono text-xl tracking-widest text-center focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full bg-maroon-900 hover:bg-maroon-800 text-white font-bold py-3.5 rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
              >
                <span>{loading ? (isHi ? "सत्यापन हो रहा है..." : "Verifying...") : isHi ? "लॉगिन पूर्ण करें" : "Verify & Sign In"}</span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Security Notice */}
          <div className="pt-4 border-t border-sandstone-100 flex items-start gap-2.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {isHi
                ? "आपकी व्यक्तिगत जानकारी पूर्णतः सुरक्षित है। इसका उपयोग केवल दर्शन व पूजा पुष्टि हेतु किया जाता है।"
                : "Your information is securely encrypted and used strictly for pilgrimage booking management."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DevoteeLoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = use(params);

  return (
    <Suspense
      fallback={
        <div className="py-20 text-center text-stone-500 text-sm">
          लोड हो रहा है... (Loading...)
        </div>
      }
    >
      <DevoteeLoginContent locale={locale} />
    </Suspense>
  );
}
