import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import {
  History as HistoryIcon,
  Flame,
  Sparkles,
  MapPin,
  Calendar,
  Compass,
  Building2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
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
      ? "इतिहास | सिद्ध श्री जोरावर धाम, चितौरा (धौलपुर)"
      : "History | Siddh Shri Jorawar Dham, Chitaura (Dholpur)",
    description: isHi
      ? "भगवान जोरावर जी का करीब 130 वर्ष पूर्व जन्म, भक्ति, साधना, 24 मार्च 1962 समाधि एवं सिद्ध श्री जोरावर धाम का पावन इतिहास।"
      : "The sacred history of Bhagwan Jorawar Ji Maharaj, born ~130 years ago in Chitaura (Dholpur), his samadhi on 24 March 1962, and temple traditions.",
    alternates: {
      canonical: `/${locale}/history`,
      languages: {
        hi: "/hi/history",
        en: "/en/history",
      },
    },
  };
}

export default async function HistoryPage({
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
        <div className="inline-flex items-center gap-2 bg-cream-warm border border-gold-royal/30 px-4 py-1.5 rounded-full text-gold-royal text-xs font-serif font-bold uppercase tracking-widest shadow-sacred-sm">
          <HistoryIcon className="w-3.5 h-3.5" />
          <span>{isHi ? "पावन प्राकट्य एवं तपोगाथा" : "Sacred History"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-maroon-deep">
          {isHi ? "इतिहास" : "Sacred History"}
        </h1>

        <p className="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "परम पूज्य भगवान जोरावर जी महाराज का दिव्य अवतरण, भक्ति-साधना, लोक-कल्याण एवं पावन समाधि का प्रामाणिक वृत्तांत।"
            : "The authentic spiritual narrative of Param Pujya Bhagwan Jorawar Ji Maharaj in Chitaura (Dholpur)."}
        </p>

        <SacredDivider variant="gold" className="my-2" />
      </div>

      {/* 2. Critical Milestones Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center space-y-1 shadow-sacred-sm">
          <span className="text-[10px] uppercase font-serif font-bold tracking-wider text-stone-500 block">
            {isHi ? "पावन प्राकट्य" : "Birth"}
          </span>
          <span className="text-base sm:text-lg font-serif font-bold text-maroon-deep block">
            ~130 वर्ष पूर्व
          </span>
          <span className="text-[11px] text-mutedText block">चितौरा, धौलपुर रियासत</span>
        </div>

        <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center space-y-1 shadow-sacred-sm">
          <span className="text-[10px] uppercase font-serif font-bold tracking-wider text-stone-500 block">
            {isHi ? "महासमाधि तिथि" : "Samadhi"}
          </span>
          <span className="text-base sm:text-lg font-serif font-bold text-maroon-deep block">
            24 मार्च 1962
          </span>
          <span className="text-[11px] text-mutedText block">दोपहर 12:00 बजे (सप्तदीप)</span>
        </div>

        <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center space-y-1 shadow-sacred-sm">
          <span className="text-[10px] uppercase font-serif font-bold tracking-wider text-stone-500 block">
            {isHi ? "वार्षिक मेला" : "Annual Mela"}
          </span>
          <span className="text-base sm:text-lg font-serif font-bold text-gold-royal block">
            होली पश्चात तीज
          </span>
          <span className="text-[11px] text-mutedText block">विशाल श्रद्धालु समागम</span>
        </div>

        <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center space-y-1 shadow-sacred-sm">
          <span className="text-[10px] uppercase font-serif font-bold tracking-wider text-stone-500 block">
            {isHi ? "प्रबंधन समिति" : "Management"}
          </span>
          <span className="text-xs sm:text-sm font-serif font-bold text-emerald-800 block">
            सिद्ध श्री जोरावर धाम
          </span>
          <span className="text-[10px] font-mono text-mutedText block">COOP/2023/DHOLPUR</span>
        </div>
      </div>

      {/* 3. The 8 Verified History Chapters */}
      <div className="space-y-6">
        {siteConfig.historyChapters.map((chapter) => (
          <article
            key={chapter.number}
            className="bg-cream-ivory rounded-3xl p-6 sm:p-10 border border-sandstone-200/90 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-3"
          >
            <div className="flex items-center gap-3">
              <span className="w-9 h-9 rounded-xl bg-maroon-deep text-gold-soft font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-gold-royal/30">
                {chapter.number}
              </span>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
                {chapter.titleHi}
              </h2>
            </div>
            <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-light pl-0 sm:pl-12">
              {chapter.contentHi}
            </p>
          </article>
        ))}
      </div>

      {/* 4. Location Distances from Source Material */}
      <section className="bg-cream-warm rounded-3xl border border-gold-royal/30 p-8 sm:p-10 shadow-sacred-sm space-y-6">
        <div className="flex items-center gap-2 text-gold-royal">
          <Compass className="w-5 h-5" />
          <span className="text-xs font-serif font-bold uppercase tracking-widest">
            {isHi ? "भौगोलिक स्थिति एवं दूरियां" : "Location Distances"}
          </span>
        </div>

        <h3 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
          {isHi ? "प्रमुख नगरों से धाम की दूरी" : "Distances from Surrounding Cities"}
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center">
            <span className="text-xs text-stone-500 font-serif block">धौलपुर शहर</span>
            <span className="text-lg font-serif font-bold text-maroon-deep block mt-1">25 कि.मी.</span>
          </div>
          <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center">
            <span className="text-xs text-stone-500 font-serif block">आगरा (उ.प्र.)</span>
            <span className="text-lg font-serif font-bold text-maroon-deep block mt-1">60 कि.मी.</span>
          </div>
          <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center">
            <span className="text-xs text-stone-500 font-serif block">ग्वालियर (म.प्र.)</span>
            <span className="text-lg font-serif font-bold text-maroon-deep block mt-1">90 कि.मी.</span>
          </div>
          <div className="bg-cream-ivory p-4 rounded-2xl border border-sandstone-200 text-center">
            <span className="text-xs text-stone-500 font-serif block">भरतपुर</span>
            <span className="text-lg font-serif font-bold text-maroon-deep block mt-1">95 कि.मी.</span>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <Link
            href={`/${locale}/how-to-reach`}
            className="inline-flex items-center gap-2 text-xs font-serif font-bold text-maroon-deep hover:text-gold-royal transition-colors group"
          >
            <span>{isHi ? "विस्तृत यात्रा मार्गदर्शिका (रेल व सड़क मार्ग)" : "Detailed Travel Route & Guide"}</span>
            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>
    </div>
  );
}
