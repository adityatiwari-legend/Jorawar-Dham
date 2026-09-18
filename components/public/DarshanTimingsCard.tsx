import Link from "next/link";
import { Clock, Sun, Sunset, Moon, Sparkles, CheckCircle2, ArrowRight, ShieldCheck, Flame } from "lucide-react";
import type { Service } from "@prisma/client";
import { Locale, localize } from "@/lib/utils/i18n";
import { siteConfig } from "@/lib/content/site";

interface DarshanTimingsCardProps {
  services?: Service[];
  locale: Locale;
}

export default function DarshanTimingsCard({ locale }: DarshanTimingsCardProps) {
  const isHi = locale === "hi";

  const getSlotIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Sparkles className="w-5 h-5 text-gold-royal" />;
      case 1:
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 2:
        return <Flame className="w-5 h-5 text-gold-soft" />;
      case 3:
        return <Sun className="w-5 h-5 text-yellow-600" />;
      case 4:
        return <Sunset className="w-5 h-5 text-rose-500" />;
      default:
        return <Moon className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-cream-ivory rounded-3xl border border-gold-royal/30 shadow-sacred-md overflow-hidden">
      {/* 1. Top Section: Header & Live Status */}
      <div className="bg-gradient-to-r from-cream-warm via-cream-50 to-cream-warm border-b border-sandstone-200/80 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal block">
              {isHi ? "दैनिक दर्शन सारिणी" : "Daily Darshan Timings"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
              {isHi ? "दिव्य दर्शन समय" : "Divine Darshan Schedule"}
            </h2>
          </div>

          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2 rounded-full font-medium shadow-sm shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>{isHi ? "मंदिर प्रांगण दर्शन हेतु खुला है" : "Sanctum is Open for Darshan"}</span>
          </div>
        </div>
      </div>

      {/* 2. Source Darshan Timetable (Exact 6 Slots from Source Material) */}
      <div className="divide-y divide-sandstone-200/70">
        {siteConfig.darshanTimings.map((item, idx) => (
          <div
            key={item.slot}
            className="p-5 sm:p-6 hover:bg-cream-warm/60 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-cream-warm border border-gold-royal/30 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                {getSlotIcon(idx)}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-serif font-bold text-maroon-deep flex items-center gap-2">
                  {isHi ? item.slot : item.slotEn}
                </h3>
                <p className="text-xs sm:text-sm text-mutedText mt-0.5 max-w-xl leading-relaxed">
                  {isHi ? item.descHi : item.descEn}
                </p>
              </div>
            </div>

            {/* Exact Source Timing Badge */}
            <div className="shrink-0 pl-14 md:pl-0 flex items-center gap-3">
              <div className="inline-flex items-center gap-2 bg-maroon-deep text-gold-soft px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold shadow-sacred-sm border border-gold-royal/30 font-mono">
                <Clock className="w-3.5 h-3.5 text-gold-soft" />
                <span>{item.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Bottom Footer CTA Bar */}
      <div className="bg-cream-warm p-5 sm:p-6 border-t border-sandstone-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs text-stone-600">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            {isHi
              ? "दर्शन हेतु किसी भी प्रकार का अग्रिम शुल्क देय नहीं है। समस्त दर्शन पूर्णतः निःशुल्क हैं।"
              : "No advance fee is required for darshan. Public darshan is entirely complimentary."}
          </span>
        </div>

        <Link
          href={`/${locale}/how-to-reach`}
          className="inline-flex items-center gap-2 text-xs font-serif font-bold text-maroon-deep hover:text-gold-royal transition-colors group shrink-0"
        >
          <span>{isHi ? "यहाँ कैसे पहुंचे व मार्ग विवरण" : "View Transport & Travel Logistics"}</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
