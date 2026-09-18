"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Printer,
  Download,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Locale } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";

export default function BookingInvoicePage({
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
        const res = await fetch(`/api/bookings/${id}/receipt`);
        if (res.status === 401) {
          router.push(`/${locale}/auth/login?redirect=/${locale}/user/bookings/${id}/invoice`);
          return;
        }
        if (res.status === 403) {
          setError(isHi ? "अनधिकृत पहुंच: यह रसीद आपके खाते से संबद्ध नहीं है।" : "Unauthorized access to this invoice.");
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
          {isHi ? "कर चालान व रसीद तैयार हो रही है..." : "Generating formatted invoice..."}
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
          {isHi ? "रसीद उपलब्ध नहीं है" : "Invoice Not Found"}
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

  const amountRupees = receipt.amountInPaise / 100;

  return (
    <div className="py-8 sm:py-12 px-4 max-w-3xl mx-auto space-y-6">
      {/* Print Controls (Hidden on Print) */}
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
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-maroon-deep hover:bg-maroon-primary text-cream-ivory text-xs font-serif font-bold shadow-sacred-sm transition-all border border-gold-royal/30"
          >
            <Printer className="w-4 h-4 text-gold-soft" />
            <span>{isHi ? "रसीद प्रिंट / सेव करें (PDF)" : "Print / Save PDF"}</span>
          </button>
        </div>
      </div>

      {/* Official Formatted Human-Readable Invoice Document */}
      <div className="bg-white rounded-3xl border-2 border-stone-300 shadow-xl overflow-hidden p-8 sm:p-12 space-y-8 text-stone-900 print:border-none print:shadow-none print:p-0 print:m-0 print:max-w-none">
        {/* Document Header with Official Trust Branding */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-6 border-b-2 border-gold-royal/40 pb-6">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="w-16 h-16 rounded-full object-contain border-2 border-gold-royal shadow-sm bg-maroon-deep p-1 shrink-0"
            />
            <div>
              <span className="text-[10px] font-serif font-bold tracking-widest text-gold-royal uppercase block">
                पवित्र धार्मिक एवं धर्मार्थ तीर्थ न्यास
              </span>
              <h1 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep leading-tight">
                सिद्ध श्री जोरावर धाम सेवा समिति
              </h1>
              <p className="text-xs text-stone-600 font-serif mt-0.5">
                ग्राम चितौरा, तहसील सैंपऊ, जिला धौलपुर, राजस्थान - 328027
              </p>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-500 font-mono mt-1">
                <span>रजि. नं: COOP/2023/DHOLPUR/201054</span>
                <span>•</span>
                <span>पैन (PAN): AABTS9284F</span>
              </div>
            </div>
          </div>

          {/* Invoice Header Badge */}
          <div className="text-center sm:text-right shrink-0">
            <span className="inline-block bg-cream-warm border border-gold-royal/40 text-maroon-deep font-serif font-bold text-xs px-3.5 py-1.5 rounded-full uppercase tracking-wider">
              {isHi ? "कर चालान / भुगतान रसीद" : "INVOICE / RECEIPT"}
            </span>
            <div className="mt-2 text-xs text-stone-500 space-y-0.5 font-mono">
              <div>
                <span className="text-stone-400">रसीद सं: </span>
                <strong className="text-stone-900 font-bold">{receipt.receiptNumber}</strong>
              </div>
              <div>
                <span className="text-stone-400">जारी दिनांक: </span>
                <span className="text-stone-900">{new Date(receipt.issuedAt).toLocaleDateString("hi-IN")}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bill-To & Booking Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-cream-warm/50 p-5 rounded-2xl border border-sandstone-200 text-xs">
          <div className="space-y-1.5">
            <span className="text-[10px] font-serif uppercase tracking-widest text-gold-royal font-bold block">
              {isHi ? "श्रद्धालु / बिल प्राप्तकर्ता विवरण" : "Devotee Details"}
            </span>
            <h3 className="font-serif font-bold text-stone-900 text-sm">{receipt.devoteeName}</h3>
            <p className="text-stone-600 font-mono">मोबाइल: {receipt.maskedPhone}</p>
            <p className="text-stone-500 font-serif">{isHi ? "तीर्थयात्री / दर्शनार्थी" : "Pilgrim / Devotee"}</p>
          </div>

          <div className="space-y-1.5 sm:text-right">
            <span className="text-[10px] font-serif uppercase tracking-widest text-gold-royal font-bold block">
              {isHi ? "आरक्षण एवं स्लॉट संदर्भ" : "Booking Details"}
            </span>
            <p className="font-mono font-bold text-maroon-deep text-sm">{receipt.bookingReference}</p>
            <p className="text-stone-700">दर्शन तिथि: <strong className="font-mono">{receipt.bookingDate}</strong></p>
            <p className="text-stone-700">समय स्लॉट: <strong className="font-mono">{receipt.slotTime}</strong></p>
          </div>
        </div>

        {/* Itemized Service Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-stone-300 bg-stone-50 text-stone-600 font-serif font-bold">
                <th className="py-3 px-4">#</th>
                <th className="py-3 px-4">{isHi ? "सेवा विवरण" : "Service Description"}</th>
                <th className="py-3 px-4 text-center">{isHi ? "श्रद्धालु संख्या" : "Devotees"}</th>
                <th className="py-3 px-4 text-right">{isHi ? "दर (प्रति व्यक्ति)" : "Rate"}</th>
                <th className="py-3 px-4 text-right">{isHi ? "कुल राशि (INR)" : "Amount (INR)"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              <tr>
                <td className="py-4 px-4 font-mono text-stone-400">01</td>
                <td className="py-4 px-4">
                  <strong className="font-serif font-bold text-stone-900 block text-sm">
                    {isHi ? receipt.serviceTitleHi : receipt.serviceTitleEn}
                  </strong>
                  <span className="text-[11px] text-stone-500 block mt-0.5">
                    सिद्ध श्री जोरावर धाम तीर्थ • दर्शन पास एवं अनुष्ठान व्यवस्था
                  </span>
                </td>
                <td className="py-4 px-4 text-center font-mono font-bold">{receipt.numberOfDevotees}</td>
                <td className="py-4 px-4 text-right font-mono">
                  {amountRupees > 0 ? `₹${amountRupees / receipt.numberOfDevotees}` : "₹0.00"}
                </td>
                <td className="py-4 px-4 text-right font-mono font-bold text-stone-900">
                  {amountRupees > 0 ? `₹${amountRupees.toFixed(2)}` : "₹0.00 (निःशुल्क)"}
                </td>
              </tr>
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-stone-300 font-bold text-xs">
                <td colSpan={4} className="py-3 px-4 text-right font-serif">
                  {isHi ? "कुल देय राशि (Total Amount):" : "Total Amount:"}
                </td>
                <td className="py-3 px-4 text-right font-mono text-base text-maroon-deep">
                  ₹{amountRupees.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Payment Transaction & Gateway Information */}
        <div className="bg-cream-warm p-5 rounded-2xl border border-sandstone-200 text-xs space-y-3">
          <div className="flex items-center justify-between border-b border-sandstone-300 pb-2">
            <span className="font-serif font-bold text-maroon-deep uppercase tracking-wider text-[11px]">
              {isHi ? "भुगतान एवं गेटवे विवरण (Transaction Details)" : "Payment Transaction Details"}
            </span>
            <span className="inline-flex items-center gap-1 text-emerald-800 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full text-[10px]">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isHi ? "सफल भुगतान (PAID)" : "PAID / SUCCESS"}</span>
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px] text-stone-700">
            <div>
              <span className="text-stone-500 block text-[10px]">आंतरिक भुगतान संदर्भ:</span>
              <span>{receipt.paymentReference}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">गेटवे संदर्भ सं (Gateway ID):</span>
              <span className="truncate block">{receipt.gatewayPaymentId}</span>
            </div>
            <div>
              <span className="text-stone-500 block text-[10px]">भुगतान माध्यम:</span>
              <span>{amountRupees === 0 ? "निःशुल्क सेवा पास" : "ऑनलाइन डिजिटल गेटवे"}</span>
            </div>
          </div>
        </div>

        {/* Official Trust Footnotes, Seal & Signatory representation */}
        <div className="pt-4 border-t border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-6 items-end text-xs text-stone-500">
          <div className="space-y-1 text-[11px] leading-relaxed">
            <p className="font-serif font-bold text-stone-800">
              {isHi ? "॥ कृतज्ञता एवं शुभाशीष ॥" : "Thank you for your devotion"}
            </p>
            <p>
              {isHi
                ? "सिद्ध श्री जोरावर धाम सेवा समिति की पावन सेवाओं में सहभागिता हेतु साधुवाद। आपकी यात्रा मंगलमय एवं कल्याणकारी हो।"
                : "Thank you for visiting Siddh Shri Jorawar Dham. May Bhagwan Jorawar shower divine blessings upon you and your family."}
            </p>
            <p className="text-[10px] text-stone-400 pt-1">
              * यह कंप्यूटर जनित आधिकारिक भुगतान रसीद है, अतः भौतिक हस्ताक्षर की आवश्यकता नहीं है।
            </p>
          </div>

          {/* Official Seal Box */}
          <div className="sm:text-right space-y-1">
            <div className="inline-block border border-gold-royal/40 rounded-2xl p-4 bg-cream-warm/40 text-center min-w-[200px]">
              <span className="font-serif font-bold text-maroon-deep text-xs block">
                सिद्ध श्री जोरावर धाम सेवा समिति
              </span>
              <span className="text-[10px] text-stone-500 font-mono block">
                चितौरा (धौलपुर) राज.
              </span>
              <div className="my-2 border-b border-dashed border-stone-300" />
              <span className="text-[10px] font-serif text-stone-600 block">
                {isHi ? "अधिकृत कोषाध्यक्ष / व्यवस्थापक" : "Authorized Signatory"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
