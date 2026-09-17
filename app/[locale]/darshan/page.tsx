import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import DarshanTimingsCard from "@/components/public/DarshanTimingsCard";
import { Clock, ShieldCheck, Info } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "दैनिक दर्शन एवं आरती समय सारिणी | श्री जोरावर धाम"
      : "Daily Darshan & Aarti Timings | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम में प्रातः व सायं दर्शन समय, मंगला, भोग एवं संध्या आरती का आधिकारिक समय व कतार नियम।"
      : "Official daily morning and evening darshan hours, Maha Aarti schedule, and queue guidelines at Shri Jorawar Dham.",
    alternates: {
      canonical: `/${locale}/darshan`,
      languages: {
        hi: "/hi/darshan",
        en: "/en/darshan",
      },
    },
  };
}

export default async function DarshanPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-3.5 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5 text-saffron-600" />
          <span>{locale === "hi" ? "दैनिक आरती एवं दर्शन" : "Daily Darshan & Aartis"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {locale === "hi" ? "श्री जोरावर धाम दर्शन समय सारिणी" : "Sacred Darshan & Maha Aarti Schedule"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {locale === "hi"
            ? "मंगला, श्रृंगार, राजभोग, संध्या एवं शयन आरती का अधिकृत समय एवं दर्शन नियम।"
            : "Official schedule for Mangala, Shringar, Rajbhog, Sandhya, and Shayan aartis."}
        </p>
      </div>

      {/* Timings Card */}
      <DarshanTimingsCard services={services} locale={locale as Locale} />

      {/* Devotee Guidelines Box */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2.5 text-amber-900 font-bold text-lg font-serif">
          <Info className="w-5 h-5 text-amber-700" />
          <span>{locale === "hi" ? "दर्शनार्थियों के लिए आवश्यक दिशा-निर्देश" : "Crucial Guidelines for Devotees"}</span>
        </div>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-stone-700">
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{locale === "hi" ? "धाम में दर्शन पूर्णतः निःशुल्क हैं। किसी मध्यस्थ को शुल्क न दें।" : "Sanctum entry is 100% free; beware of unauthorized touts."}</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{locale === "hi" ? "आरती के समय पंक्तिबद्ध रहें एवं अनुशासन बनाए रखें।" : "Assemble in orderly queues 15 minutes before ritual timings."}</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{locale === "hi" ? "दिव्यांग एवं वरिष्ठ श्रद्धालुओं के लिए व्हीलचेयर उपलब्ध है।" : "Wheelchair facilities and accessible ramps are provided."}</span>
          </li>
          <li className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{locale === "hi" ? "जूता-चप्पल स्टैंड पर निःशुल्क जमा करवाकर टोकन प्राप्त करें।" : "Deposit footwear at the designated complimentary counter."}</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
