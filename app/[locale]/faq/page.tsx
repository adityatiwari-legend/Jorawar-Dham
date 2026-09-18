import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import FaqAccordion from "@/components/public/FaqAccordion";
import { HelpCircle, PhoneCall } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "प्रश्नोत्तरी (FAQ) - दर्शन, धर्मशाला व दान संबंधी जिज्ञासाएं | श्री जोरावर धाम"
      : "Frequently Asked Questions (FAQ) - Darshan, Stay & Seva | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम के दर्शन समय, धर्मशाला बुकिंग, निःशुल्क भोजन व्यवस्था एवं दान संबंधी सामान्य प्रश्नों के अधिकृत उत्तर।"
      : "Official answers to frequently asked questions about visiting Shri Jorawar Dham, darshan timings, accommodation, and donations.",
    alternates: {
      canonical: `/${locale}/faq`,
      languages: {
        hi: "/hi/faq",
        en: "/en/faq",
      },
    },
  };
}

export default async function FaqPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  // Fetch FAQs from PostgreSQL database
  const faqs = await prisma.faq.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <HelpCircle className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "श्रद्धालु जिज्ञासा समाधान" : "Devotee Assistance & FAQ"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "अक्सर पूछे जाने वाले प्रश्न (FAQ)" : "Frequently Asked Questions"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "धाम आगमन, आरती, दर्शन नियम, धर्मशाला एवं सेवा प्रकल्पों से जुड़े आपके समस्त प्रश्नों के प्रामाणिक उत्तर।"
            : "Authorized answers to common questions regarding temple darshan, aarti rituals, accommodation, and pilgrim facilities."}
        </p>
      </div>

      {/* Accordion Component */}
      <FaqAccordion faqs={faqs} locale={locale as Locale} />

      {/* Devotee Help Strip */}
      <div className="bg-sandstone-100/90 rounded-2xl p-6 sm:p-8 border border-sandstone-300 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs font-bold text-saffron-800 uppercase tracking-wider">
            {isHi ? "क्या आपका प्रश्न यहाँ नहीं मिला?" : "Still have questions?"}
          </span>
          <p className="text-stone-800 font-serif font-bold text-base">
            {isHi ? "हमारे तीर्थयात्री सहायता केंद्र से सीधे बात करें" : "Speak directly with our pilgrim support desk"}
          </p>
        </div>
        <a
          href="tel:+919530106218"
          className="inline-flex items-center gap-2 bg-maroon-900 hover:bg-maroon-800 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-sm shrink-0"
        >
          <PhoneCall className="w-4 h-4 text-gold-400" />
          <span>+91-9530106218</span>
        </a>
      </div>
    </div>
  );
}
