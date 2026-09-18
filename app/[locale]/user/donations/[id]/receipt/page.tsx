"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Heart,
  ShieldCheck,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

export default function DonationReceiptPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = use(params);
  const isHi = locale === "hi";
  const router = useRouter();

  const [receipt, setReceipt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReceipt() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/donations/${id}/receipt`);
        if (res.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/user/donations/${id}/receipt`);
          return;
        }
        if (res.status === 403) {
          setError(isHi ? "अनधिकृत पहुंच: यह दान रसीद आपके खाते से संबद्ध नहीं है।" : "Unauthorized access.");
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error || "रसीद प्राप्त करने में असमर्थ");
          return;
        }
        setReceipt(data.receipt);
      } catch {
        setError("नेटवर्क त्रुटि उत्पन्न हुई");
      } finally {
        setLoading(false);
      }
    }

    loadReceipt();
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
          {isHi ? "दान रसीद तैयार हो रही है..." : "Generating donation receipt..."}
        </p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-serif font-bold text-stone-900">
          {isHi ? "दान रसीद उपलब्ध नहीं है" : "Receipt Not Found"}
        </h2>
        <p className="text-xs text-stone-600">{error}</p>
        <Link
          href={`/${locale}/user/donations`}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-maroon-deep text-cream-ivory text-xs font-bold font-serif"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "दान पोर्टल पर वापस जाएं" : "Back to Donations"}</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-8 sm:py-12 px-4 max-w-3xl mx-auto space-y-6">
      {/* Print Controls (Hidden on Print) */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <Link
          href={`/${locale}/user/donations`}
          className="inline-flex items-center gap-1.5 text-xs text-stone-600 hover:text-maroon-deep transition-colors font-serif"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isHi ? "वापस दान इतिहास" : "Back to Donations"}</span>
        </Link>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-deep hover:bg-maroon-primary text-cream-ivory text-xs font-serif font-bold shadow-sacred-sm transition-all border border-gold-royal/30"
        >
          <Printer className="w-4 h-4 text-gold-soft" />
          <span>{isHi ? "रसीद प्रिंट / सेव करें (PDF)" : "Print / Save PDF"}</span>
        </button>
      </div>

      {/* Official Formatted Donation Receipt Document */}
      <div className="bg-white rounded-3xl border-2 border-stone-300 shadow-xl overflow-hidden p-8 sm:p-12 space-y-8 text-stone-900 print:border-none print:shadow-none print:p-0 print:m-0">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 border-b-2 border-gold-royal/40 pb-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="w-16 h-16 rounded-full object-contain border-2 border-gold-royal shadow-sm bg-maroon-deep p-1 shrink-0"
            />
            <div>
              <span className="text-[10px] font-serif font-bold tracking-widest text-gold-royal uppercase block">
                धार्मिक एवं धर्मार्थ तीर्थ न्यास
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep leading-tight">
                {receipt.organizationNameHi}
              </h1>
              <p className="text-xs text-stone-600 font-serif mt-0.5">
                ग्राम चितौरा, तहसील सैंपऊ, जिला धौलपुर, राजस्थान - 328027
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 font-mono mt-1">
                <span>रजि. नं: {receipt.trustRegistrationNo}</span>
              </div>
            </div>
          </div>

          <div className="text-center sm:text-right shrink-0">
            <span className="inline-block bg-cream-warm border border-gold-royal/40 text-maroon-deep font-serif font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {isHi ? "धर्मार्थ दान रसीद" : "DONATION RECEIPT"}
            </span>
            <div className="mt-2 text-xs text-stone-500 space-y-0.5 font-mono">
              <div>
                <span className="text-stone-400">रसीद सं: </span>
                <strong className="text-stone-900 font-bold">{receipt.receiptNumber}</strong>
              </div>
              <div>
                <span className="text-stone-400">दिनांक: </span>
                <span className="text-stone-900">{new Date(receipt.issuedAt).toLocaleDateString("hi-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Donor & Contribution Overview */}
        <div className="bg-cream-warm/50 p-6 rounded-2xl border border-sandstone-200 text-xs space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] font-serif uppercase tracking-widest text-gold-royal font-bold block">
                {isHi ? "दानदाता विवरण" : "Donor Details"}
              </span>
              <h3 className="font-serif font-bold text-stone-900 text-base">{receipt.donorName}</h3>
              <p className="text-stone-600 font-mono">मोबाइल: {receipt.maskedPhone}</p>
              {receipt.donorPan && (
                <p className="text-stone-600 font-mono">पैन (PAN): {receipt.donorPan}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:text-right">
              <span className="text-[10px] font-serif uppercase tracking-widest text-gold-royal font-bold block">
                {isHi ? "दान प्रयोजन एवं संदर्भ" : "Contribution Purpose"}
              </span>
              <p className="font-mono font-bold text-maroon-deep text-sm">{receipt.donationReference}</p>
              <p className="text-stone-800 font-serif font-bold text-sm">{receipt.causeTitleHi}</p>
              <p className="text-[11px] text-stone-500 font-mono">गेटवे संदर्भ: {receipt.gatewayPaymentId || "DIRECT"}</p>
            </div>
          </div>

          <div className="pt-4 border-t border-sandstone-300 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-serif font-bold text-sm text-stone-700">
              {isHi ? "स्वीकृत दान राशि (Contribution Amount):" : "Donation Amount:"}
            </span>
            <span className="font-mono font-bold text-2xl text-maroon-deep">
              ₹{receipt.amountInRupees}.00
            </span>
          </div>
        </div>

        {/* Official Legal & Religious Note */}
        <div className="bg-cream-warm/30 p-5 rounded-2xl border border-sandstone-200 space-y-2 text-xs text-stone-600 leading-relaxed">
          <div className="flex items-center gap-2 text-maroon-deep font-serif font-bold text-xs">
            <Heart className="w-4 h-4 text-gold-royal" />
            <span>{isHi ? "आधिकारिक उद्घोषणा एवं कृतज्ञता" : "Official Acknowledgement"}</span>
          </div>
          <p>{receipt.legalNoteHi}</p>
          <p className="text-[10px] text-stone-400 pt-1">
            * यह रसीद सिद्ध श्री जोरावर धाम सेवा समिति द्वारा अधिकृत इलेक्ट्रॉनिक प्रणाली से जारी की गई है।
          </p>
        </div>

        {/* Footer & Signatory */}
        <div className="pt-6 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs text-stone-500">
          <div className="space-y-1 text-[11px]">
            <p className="font-serif font-bold text-stone-800">॥ ॐ श्री जोरा Bernardाय नमः ॥</p>
            <p>संपर्क: info@jorawardham.org • दूरभाष: +91 94140 53123</p>
            <p>पंजीकृत कार्यालय: ग्राम चितौरा, तहसील सैंपऊ, जिला धौलपुर (राज.)</p>
          </div>

          <div className="sm:text-right">
            <div className="inline-block border border-gold-royal/40 rounded-2xl p-4 bg-cream-warm/40 text-center min-w-[200px]">
              <span className="font-serif font-bold text-maroon-deep text-xs block">
                सिद्ध श्री जोरावर धाम सेवा समिति
              </span>
              <span className="text-[10px] text-stone-500 font-mono block">
                चितौरा (धौलपुर) राज.
              </span>
              <div className="my-2 border-b border-dashed border-stone-300" />
              <span className="text-[10px] font-serif text-stone-600 block">
                {isHi ? "अधिकृत कोषाध्यक्ष / सचिव" : "Authorized Signatory"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
