"use client";

import { useState, use, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Phone,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  ArrowLeft,
} from "lucide-react";
import SacredDivider from "@/components/public/SacredDivider";

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
  const [smsNotice, setSmsNotice] = useState<string | null>(null);

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

      if (data.smsGatewayNotice) {
        setSmsNotice(data.smsGatewayNotice);
      } else {
        setSmsNotice(null);
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
    <div className="min-h-[85vh] flex items-center justify-center py-10 sm:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full bg-cream-ivory rounded-3xl border border-gold-royal/30 shadow-sacred-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* 1. Left Side: Sacred Visual / Temple Image (Desktop) */}
        <div className="lg:col-span-5 relative hidden lg:flex flex-col justify-between p-8 text-cream-ivory overflow-hidden">
          <img
            src="/images/auth-backdrop.jpg"
            alt="श्री जोरावर धाम गर्भगृह"
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep via-maroon-deep/80 to-maroon-deep/60 backdrop-blur-[0.5px]" />
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#D4A72C_1px,transparent_1px)] [background-size:20px_20px]" />

          {/* Top Left Motto */}
          <div className="relative z-10 space-y-1">
            <span className="text-xs font-serif font-bold text-gold-soft uppercase tracking-widest block">
              ॥ आस्था • शक्ति • शांति ॥
            </span>
            <span className="text-xs text-sandstone-300 font-light">
              सिद्ध श्री जोरावर धाम सेवा समिति
            </span>
          </div>

          {/* Center Devotional Blessing Quote */}
          <div className="relative z-10 space-y-3">
            <SacredDivider variant="gold" className="my-1 justify-start" />
            <h3 className="text-xl font-serif font-bold text-cream-ivory leading-snug">
              {isHi
                ? "पवित्र जोरावर धाम तीर्थ में आपका स्वागत है"
                : "Welcome to the Sacred Shri Jorawar Dham Sanctuary"}
            </h3>
            <p className="text-xs text-sandstone-200/90 leading-relaxed font-light">
              {isHi
                ? "दर्शन, महाआरती, अखंड धूणा एवं पूजा सेवा बुकिंग हेतु सुरक्षित मोबाइल सत्यापन।"
                : "Secure mobile verification for pilgrims, darshan passes, and seva bookings."}
            </p>
          </div>

          {/* Bottom Trust Badge */}
          <div className="relative z-10 flex items-center gap-2 text-[11px] text-sandstone-300 pt-4 border-t border-gold-royal/30">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{isHi ? "100% सुरक्षित एवं पंजीकृत" : "100% Secure & Encrypted"}</span>
          </div>
        </div>

        {/* 2. Right Side: Official Brand Authentication Form */}
        <div className="lg:col-span-7 p-6 sm:p-10 lg:p-12 flex flex-col justify-between space-y-6">
          {/* Top Header & Official Logo */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Link href={`/${locale}`} className="inline-flex items-center gap-1.5 text-xs text-stone-500 hover:text-maroon-deep transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{isHi ? "मुख्य पृष्ठ" : "Back to Home"}</span>
              </Link>
              <span className="text-[10px] font-mono text-gold-royal uppercase tracking-wider bg-gold-royal/10 px-2 py-0.5 rounded border border-gold-royal/20">
                Devotee Portal
              </span>
            </div>

            <div className="text-center sm:text-left space-y-2">
              <div className="inline-block py-1">
                <img
                  src="/branding/jorawar-dham-logo.png"
                  alt="सिद्ध श्री जोरावर धाम सेवा समिति"
                  className="h-12 sm:h-14 w-auto object-contain mx-auto sm:mx-0"
                />
              </div>
              <h1 className="text-2xl font-serif font-bold text-maroon-deep">
                {isHi ? "श्रद्धालु लॉगिन / पंजीकरण" : "Devotee Sign In / Register"}
              </h1>
              <p className="text-xs text-mutedText">
                {isHi
                  ? "दर्शन, पूजा एवं सेवा बुकिंग हेतु सुरक्षित मोबाइल सत्यापन"
                  : "Enter your Indian mobile number to receive a secure login OTP"}
              </p>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 font-medium">
              {error}
            </div>
          )}

          {/* Fast2SMS Gateway Notice (If account needs verification/recharge) */}
          {smsNotice && (
            <div className="bg-amber-50 border border-amber-300 rounded-xl p-3.5 text-xs text-amber-950 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-1.5 font-bold text-amber-900">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Fast2SMS Gateway Status:</span>
              </div>
              <p className="font-mono text-[11px] bg-amber-100/70 p-2 rounded border border-amber-200 text-amber-900">
                {smsNotice}
              </p>
              <p className="text-[11px] text-amber-800">
                {isHi
                  ? "Fast2SMS खाते में वेबसाइट सत्यापन अथवा ₹100 रिचार्ज होने तक, नीचे दिया गया OTP उपयोग करके तुरंत लॉगिन करें।"
                  : "Until Fast2SMS website verification or ₹100 minimum recharge is completed, use the instant OTP displayed below to sign in."}
              </p>
            </div>
          )}

          {/* Instant / Test OTP Notice */}
          {testOtpNotice && (
            <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 text-xs text-emerald-950 space-y-1">
              <strong className="block font-semibold text-emerald-900">
                {isHi ? "सत्यापन कोड (Devotee Login OTP):" : "Login OTP (Instant Access):"}
              </strong>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xl font-bold tracking-widest text-emerald-800 bg-emerald-100/80 px-3 py-1 rounded-lg border border-emerald-300">
                  {testOtpNotice}
                </span>
                <span className="text-[11px] text-emerald-700">
                  ({isHi ? "यह कोड स्वतः दर्ज करें" : "Enter this OTP above"})
                </span>
              </div>
            </div>
          )}

          {/* Form Step: PHONE vs OTP */}
          {step === "PHONE" ? (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-serif font-bold text-maroon-deep mb-1.5">
                  {isHi ? "मोबाइल नंबर दर्ज करें" : "Enter Mobile Number"}
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-stone-500 text-sm font-semibold border-r border-sandstone-300 pr-2">
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    placeholder="9876543210"
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-sandstone-300 bg-cream-warm/40 text-stone-900 font-mono text-base focus:ring-2 focus:ring-gold-royal focus:outline-none"
                  />
                </div>
                <span className="text-[11px] text-stone-500 block mt-1">
                  {isHi ? "हम आपके नंबर पर 6 अंकों का सुरक्षित OTP प्रेषित करेंगे" : "We will send a 6-digit OTP for verification"}
                </span>
              </div>

              <button
                type="submit"
                disabled={loading || phone.length !== 10}
                className="w-full min-h-[46px] bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-bold py-3 rounded-xl shadow-sacred-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm border border-gold-royal/40"
              >
                <span>{loading ? (isHi ? "प्रतीक्षा करें..." : "Sending...") : isHi ? "OTP प्राप्त करें" : "Send OTP"}</span>
                <ArrowRight className="w-4 h-4 text-gold-soft" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-serif font-bold text-maroon-deep">
                    {isHi ? "प्राप्त OTP दर्ज करें" : "Enter 6-Digit OTP"}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep("PHONE");
                      setTestOtpNotice(null);
                      setSmsNotice(null);
                    }}
                    className="text-xs text-gold-royal hover:underline font-serif"
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
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-sandstone-300 bg-cream-warm/40 text-stone-900 font-mono text-xl tracking-widest text-center focus:ring-2 focus:ring-gold-royal focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className="w-full min-h-[46px] bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-bold py-3 rounded-xl shadow-sacred-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs sm:text-sm border border-gold-royal/40"
              >
                <span>{loading ? (isHi ? "सत्यापन हो रहा है..." : "Verifying...") : isHi ? "लॉगिन पूर्ण करें" : "Verify & Sign In"}</span>
                <CheckCircle2 className="w-4 h-4 text-gold-soft" />
              </button>
            </form>
          )}

          {/* Security & Privacy Notice */}
          <div className="pt-4 border-t border-sandstone-200/80 flex items-start gap-2.5 text-[11px] text-stone-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              {isHi
                ? "आपकी व्यक्तिगत जानकारी पूर्णतः सुरक्षित है। इसका उपयोग केवल दर्शन व सेवा पुष्टि हेतु किया जाता है।"
                : "Your phone number is strictly encrypted and used solely for darshan passes & booking confirmations."}
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
        <div className="py-20 text-center text-stone-500 text-sm font-serif">
          लोड हो रहा है... (Loading...)
        </div>
      }
    >
      <DevoteeLoginContent locale={locale} />
    </Suspense>
  );
}
