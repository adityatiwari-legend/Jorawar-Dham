import { Clock, Sun, Sunset, Moon, Sparkles, CheckCircle2 } from "lucide-react";
import type { Service } from "@prisma/client";
import { Locale, localize } from "@/lib/utils/i18n";

interface DarshanTimingsCardProps {
  services: Service[];
  locale: Locale;
}

export default function DarshanTimingsCard({ services, locale }: DarshanTimingsCardProps) {
  const getAartiIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Sun className="w-5 h-5 text-amber-500" />;
      case 1:
        return <Sparkles className="w-5 h-5 text-saffron-500" />;
      case 2:
        return <Sun className="w-5 h-5 text-yellow-600" />;
      case 3:
        return <Sunset className="w-5 h-5 text-rose-500" />;
      default:
        return <Moon className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-sandstone-200 shadow-devotional overflow-hidden">
      {/* Header */}
      <div className="bg-sandstone-100/90 border-b border-sandstone-200 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 block mb-1">
              {locale === "hi" ? "दैनिक दर्शन सारिणी" : "Daily Darshan Schedule"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
              {locale === "hi" ? "महाआरती एवं दर्शन समय" : "Maha Aarti & Darshan Timings"}
            </h2>
          </div>
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3.5 py-1.5 rounded-full font-semibold shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{locale === "hi" ? "मंदिर प्रांगण दर्शन हेतु खुला है" : "Temple Sanctum is Open"}</span>
          </div>
        </div>
      </div>

      {/* Aarti List */}
      <div className="divide-y divide-sandstone-200">
        {services.map((service, idx) => {
          const title = localize(service, locale, "title");
          const timing = localize(service, locale, "timing");
          const description = localize(service, locale, "description");
          const guidelines = localize(service, locale, "guidelines");

          return (
            <div
              key={service.id}
              className="p-5 sm:p-6 hover:bg-sandstone-50/70 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sandstone-100 border border-sandstone-300 flex items-center justify-center shrink-0 mt-0.5">
                  {getAartiIcon(idx)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-maroon-950 font-serif flex items-center gap-2">
                    {title}
                  </h3>
                  <p className="text-sm text-stone-600 mt-1 max-w-xl leading-relaxed">
                    {description}
                  </p>
                  {guidelines && (
                    <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                      <span>{guidelines}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Timing Badge */}
              <div className="shrink-0 pl-14 md:pl-0">
                <div className="inline-flex items-center gap-2 bg-maroon-900 text-gold-300 px-4 py-2 rounded-xl text-sm font-semibold shadow-sm">
                  <Clock className="w-4 h-4 text-gold-400" />
                  <span>{timing}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
