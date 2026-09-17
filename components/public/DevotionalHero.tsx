import Link from "next/link";
import { Sparkles, Calendar, BookOpen, ShieldCheck } from "lucide-react";
import { Locale, getDictionary } from "@/lib/utils/i18n";

interface DevotionalHeroProps {
  locale: Locale;
}

export default function DevotionalHero({ locale }: DevotionalHeroProps) {
  const dict = getDictionary(locale);

  return (
    <section className="relative overflow-hidden sacred-hero-mesh text-white py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 border-b-4 border-gold-500">
      {/* Decorative Traditional Rajasthani Temple Mandala / Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px]" />

      <div className="relative max-w-5xl mx-auto text-center space-y-8">
        {/* Sacred Badge & Revered Motto */}
        <div className="flex flex-col items-center gap-2">
          <div className="inline-flex items-center gap-2 bg-maroon-900/80 border border-gold-500/50 px-4 py-1.5 rounded-full text-gold-300 text-xs sm:text-sm font-medium shadow-lg backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-gold-400 animate-pulse" />
            <span>{dict.hero.badge}</span>
          </div>
          <div className="text-gold-400 font-serif font-bold text-lg sm:text-2xl tracking-widest drop-shadow">
            {locale === "hi" ? "॥ आस्था • शक्ति • शांति ॥" : "|| Faith • Strength • Peace ||"}
          </div>
        </div>

        {/* Grand Headline */}
        <div className="space-y-3">
          <span className="block text-2xl sm:text-3xl text-saffron-300 font-serif font-semibold tracking-wide">
            {locale === "hi" ? "श्री जोरावर धाम" : "Shri Jorawar Dham"}
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-serif tracking-tight text-white drop-shadow-md">
            {dict.hero.title}
          </h1>
        </div>

        {/* Subtitle */}
        <p className="text-base sm:text-xl text-sandstone-200 max-w-3xl mx-auto font-light leading-relaxed">
          {dict.hero.subtitle}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href={`/${locale}/darshan`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white font-semibold px-8 py-3.5 rounded-xl shadow-lg hover:shadow-gold-glow transition-all transform hover:-translate-y-0.5"
          >
            <Calendar className="w-5 h-5" />
            <span>{dict.hero.ctaDarshan}</span>
          </Link>

          <Link
            href={`/${locale}/history`}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3.5 rounded-xl border border-white/20 backdrop-blur-sm transition-all"
          >
            <BookOpen className="w-5 h-5 text-gold-400" />
            <span>{dict.hero.ctaHistory}</span>
          </Link>
        </div>

        {/* Free Entry & Anti-Exploitation Guarantee Notice */}
        <div className="pt-4 max-w-2xl mx-auto">
          <div className="bg-maroon-950/70 border border-gold-500/30 rounded-xl p-3.5 flex items-center justify-center gap-2.5 text-xs text-sandstone-200 shadow-sm backdrop-blur-sm">
            <ShieldCheck className="w-4 h-4 text-gold-400 shrink-0" />
            <span>{dict.hero.emergencyNotice}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
