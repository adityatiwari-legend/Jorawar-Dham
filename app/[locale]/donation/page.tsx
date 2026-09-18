import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import {
  HeartHandshake,
  ShieldCheck,
  Building2,
  CheckCircle,
  FileText,
  Phone,
  ArrowRight,
  Sparkles,
  Layers,
  Award,
  AlertCircle,
  Info,
} from "lucide-react";
import DonationPortal from "@/components/donation/DonationPortal";
import SacredDivider from "@/components/public/SacredDivider";
import SectionHeader from "@/components/public/SectionHeader";
import { siteConfig } from "@/lib/content/site";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "आपका सहयोग | सिद्ध श्री जोरावर धाम सेवा समिति, चितौरा (धौलपुर)"
      : "Your Contribution | Siddh Shri Jorawar Dham Seva Samiti, Chitaura (Dholpur)",
    description: isHi
      ? "सिद्ध श्री जोरावर धाम मंदिर निर्माण एवं सेवा प्रकल्पों हेतु सहयोग: आर्थिक सहयोग, सामग्री दान, श्रमदान एवं 'एक ईंट, एक दान' अभियान।"
      : "Support temple construction and charitable seva at Shri Jorawar Dham: financial contribution, materials donation, shramdaan, and brick campaign.",
    alternates: {
      canonical: `/${locale}/donation`,
      languages: {
        hi: "/hi/donation",
        en: "/en/donation",
      },
    },
  };
}

export default async function DonationPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* 1. Header */}
      <div className="text-center space-y-4 border-b border-sandstone-200 pb-10">
        <div className="p-2 bg-cream-ivory rounded-2xl border border-gold-royal/30 shadow-sacred-sm inline-block">
          <img
            src="/branding/jorawar-dham-logo.png"
            alt="सिद्ध श्री जोरावर धाम सेवा समिति"
            className="h-16 sm:h-20 w-auto object-contain rounded-md"
          />
        </div>

        <div className="space-y-1">
          <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-widest block">
            ॥ {siteConfig.mantra} ॥
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-bold text-maroon-deep">
            {isHi ? "आपका सहयोग" : "Your Contribution"}
          </h1>
          <p className="text-xs font-mono text-stone-500">
            {siteConfig.organization.nameHi} • रजि. नं. {siteConfig.organization.registrationNumber}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto font-light leading-relaxed">
          {isHi
            ? "परम पूज्य भगवान जोरावर धाम मंदिर निर्माण, नित्य अन्नक्षेत्र एवं जनकल्याणकारी प्रकल्पों में आपका स्वैच्छिक सहयोग सादर प्रार्थनीय है।"
            : "Your voluntary contribution supports the sacred temple construction, daily free meals, and pilgrim amenities."}
        </p>

        <SacredDivider variant="gold" className="my-2" />
      </div>

      {/* 2. Three Contribution Methods (From Source Material) */}
      <section className="space-y-8">
        <SectionHeader
          eyebrow={isHi ? "सहयोग के प्रकार" : "Contribution Channels"}
          title={isHi ? "सहयोग के तीन प्रमुख माध्यम" : "Three Ways to Contribute"}
          subtitle={
            isHi
              ? "प्रत्येक श्रद्धालु अपनी श्रद्धा एवं सामर्थ्य के अनुसार निम्न माध्यमों से पुण्य लाभ प्राप्त कर सकते हैं"
              : "Devotees may support the sacred mission through monetary support, construction materials, or voluntary service"
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {siteConfig.donationMethods.map((method) => (
            <div
              key={method.step}
              className="bg-cream-ivory rounded-3xl p-6 sm:p-8 border border-sandstone-200 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-4"
            >
              <span className="w-10 h-10 rounded-2xl bg-maroon-deep text-gold-soft font-mono font-bold text-sm flex items-center justify-center border border-gold-royal/30">
                {method.step}
              </span>
              <h3 className="text-xl font-serif font-bold text-maroon-deep">
                {method.titleHi}
              </h3>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-light">
                {method.descHi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Campaign Section: "एक ईंट, एक दान — भगवान जोरावर के सम्मान में समर्पण" */}
      <section className="sacred-gradient-card rounded-3xl text-cream-ivory p-8 sm:p-12 lg:p-14 shadow-devotional-lg relative overflow-hidden border border-gold-royal/40 space-y-6">
        <div className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-gold-royal/20 text-gold-soft px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold uppercase tracking-wider border border-gold-royal/40">
            <Layers className="w-4 h-4 text-gold-royal" />
            <span>{isHi ? "विशेष अभियान" : "Special Campaign"}</span>
          </span>

          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold leading-tight text-cream-ivory">
            {siteConfig.brickCampaign.taglineHi}
          </h2>

          <p className="text-sandstone-200 text-sm sm:text-base leading-relaxed font-light">
            {siteConfig.brickCampaign.descriptionHi}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs text-sandstone-200">
          <div className="bg-maroon-deep/80 p-4 rounded-2xl border border-gold-royal/30 space-y-1">
            <span className="font-serif font-bold text-cream-ivory block text-sm">प्रत्येक ईंट की गिनती</span>
            <span className="text-[11px] text-sandstone-300">मंदिर की नींव में आपकी श्रद्धा अमर रहेगी</span>
          </div>
          <div className="bg-maroon-deep/80 p-4 rounded-2xl border border-gold-royal/30 space-y-1">
            <span className="font-serif font-bold text-cream-ivory block text-sm">स्मृति पट्टिका पर अंकन</span>
            <span className="text-[11px] text-sandstone-300">दानदाताओं के नाम मंदिर प्रांगण में संरक्षित</span>
          </div>
          <div className="bg-maroon-deep/80 p-4 rounded-2xl border border-gold-royal/30 space-y-1">
            <span className="font-serif font-bold text-cream-ivory block text-sm">सामुदायिक सहभागिता</span>
            <span className="text-[11px] text-sandstone-300">समाज के हर वर्ग के सहयोग से भव्य निर्माण</span>
          </div>
        </div>
      </section>

      {/* 4. Interactive Online Seva Contribution Portal */}
      <section className="space-y-4">
        <div className="text-center space-y-1 max-w-2xl mx-auto">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal block">
            {isHi ? "ऑनलाइन सहयोग" : "Online Contribution"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
            {isHi ? "डिजिटल माध्यम से सेवा समर्पण" : "Contribute Online"}
          </h2>
        </div>
        <DonationPortal locale={locale} />
      </section>

      {/* 5. Bank Account Information Section (Preserving Source Placeholders with "जानकारी शीघ्र उपलब्ध होगी") */}
      <section className="bg-cream-warm rounded-3xl border border-gold-royal/30 p-8 sm:p-10 shadow-sacred-sm space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-gold-royal">
            <Building2 className="w-5 h-5" />
            <span className="text-xs font-serif font-bold uppercase tracking-widest">
              {isHi ? "बैंक खाता विवरण" : "Bank Transfer Details"}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
            {isHi ? "ट्रस्ट अधिकृत बैंक विवरण" : "Official Trust Bank Details"}
          </h3>
          <p className="text-xs text-stone-600 font-light">
            {isHi
              ? "स्रोत सामग्री के अनुसार ट्रस्ट के अधिकृत बैंक खाते की जानकारी निम्नानुसार है। किसी भी अनधिकृत खाते में राशि प्रेषित न करें।"
              : "Official Trust bank details for direct RTGS/NEFT/IMPS transfer."}
          </p>
        </div>

        {/* Transparent Placeholder Status (ZERO FABRICATION) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-cream-ivory p-5 rounded-2xl border border-sandstone-200 space-y-3">
            <div className="flex justify-between items-center border-b border-sandstone-100 pb-2">
              <span className="text-stone-500 font-serif font-semibold">खाता संख्या (Account No.):</span>
              <span className="font-mono text-stone-700 bg-sandstone-100 px-2.5 py-1 rounded text-[11px]">
                जानकारी शीघ्र उपलब्ध होगी
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-sandstone-100 pb-2">
              <span className="text-stone-500 font-serif font-semibold">बैंक व खाताधारक का नाम:</span>
              <span className="font-serif font-bold text-maroon-deep text-[11px]">
                {siteConfig.organization.nameHi}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-serif font-semibold">आईएफएससी कोड (IFSC):</span>
              <span className="font-mono text-stone-700 bg-sandstone-100 px-2.5 py-1 rounded text-[11px]">
                जानकारी शीघ्र उपलब्ध होगी
              </span>
            </div>
          </div>

          <div className="bg-cream-ivory p-5 rounded-2xl border border-sandstone-200 space-y-3">
            <div className="flex justify-between items-center border-b border-sandstone-100 pb-2">
              <span className="text-stone-500 font-serif font-semibold">ऑनलाइन भुगतान (UPI):</span>
              <span className="font-mono text-stone-700 bg-sandstone-100 px-2.5 py-1 rounded text-[11px]">
                जानकारी शीघ्र उपलब्ध होगी
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-sandstone-100 pb-2">
              <span className="text-stone-500 font-serif font-semibold">यूपीआई आईडी (UPI ID):</span>
              <span className="font-mono text-stone-700 bg-sandstone-100 px-2.5 py-1 rounded text-[11px]">
                जानकारी शीघ्र उपलब्ध होगी
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-stone-500 font-serif font-semibold">क्यू आर कोड (QR Code):</span>
              <span className="text-stone-600 font-serif text-[11px]">
                कार्यालय काउंटर पर उपलब्ध
              </span>
            </div>
          </div>
        </div>

        {/* Verification Note */}
        <div className="bg-cream-ivory/80 border border-gold-royal/20 rounded-2xl p-4 flex items-start gap-3 text-xs text-stone-600">
          <Info className="w-5 h-5 text-gold-royal shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            {isHi
              ? "दान के संबंध में किसी भी स्पष्टीकरण अथवा रसीद सत्यापन हेतु कृपया ट्रस्ट के अधिकृत फोन नंबर (+91-9530106218 / 19 / 20) अथवा कार्यालय से संपर्क करें।"
              : "For donation verification or physical receipt assistance, please contact the official Trust helpline (+91-9530106218) or visit the temple office."}
          </p>
        </div>
      </section>
    </div>
  );
}
