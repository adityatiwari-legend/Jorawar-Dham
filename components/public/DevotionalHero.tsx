import Link from "next/link";
import { Sparkles, Calendar, BookOpen, ShieldCheck, HeartHandshake, User, ArrowRight } from "lucide-react";
import { Locale, getDictionary } from "@/lib/utils/i18n";
import SacredDivider from "./SacredDivider";
import { siteConfig } from "@/lib/content/site";

interface DevotionalHeroProps {
  locale: Locale;
}

export default function DevotionalHero({ locale }: DevotionalHeroProps) {
  const isHi = locale === "hi";

  return (
    <section className="relative overflow-hidden min-h-[620px] lg:min-h-[700px] flex items-center justify-center text-cream-ivory border-b-2 border-gold-royal/30">
      {/* 1. Cinematic Background Image & Sacred Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/temple-hero.jpg"
          alt="सिद्ध श्री जोरावर धाम"
          className="w-full h-full object-cover object-center scale-105 transform animate-in fade-in duration-1000"
          priority-hint="high"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep via-maroon-deep/75 to-maroon-deep/60 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-maroon-deep/30 to-maroon-deep/80 pointer-events-none" />
        <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D4A72C_1px,transparent_1px)] [background-size:28px_28px]" />
      </div>

      {/* 2. Hero Devotional Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center space-y-7">
        {/* Sacred Brand Icon & Official Tri-Mantra Eyebrow */}
        <div className="flex flex-col items-center gap-3">
          {/* Official Icon in Golden Frame */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-tr from-gold-royal via-gold-soft to-amber-300 shadow-gold-glow flex items-center justify-center subtle-lift">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="w-full h-full object-contain rounded-full bg-maroon-deep p-1.5"
            />
          </div>

          {/* Official Repeated Mantra from Source Material */}
          <div className="bg-maroon-deep/90 border border-gold-royal/50 px-5 py-2 rounded-2xl text-gold-soft font-serif shadow-sacred-md backdrop-blur-md space-y-0.5">
            <div className="flex items-center justify-center gap-1.5 text-xs sm:text-sm font-bold tracking-widest uppercase">
              <Sparkles className="w-3.5 h-3.5 text-gold-royal animate-pulse" />
              <span>{siteConfig.mantraRepeated[0]}</span>
            </div>
            <div className="text-[11px] sm:text-xs text-sandstone-300 tracking-wider">
              {siteConfig.mantraRepeated[1]} • {siteConfig.mantraRepeated[2]}
            </div>
          </div>
        </div>

        {/* Grand Headline & Spiritual Title */}
        <div className="space-y-3">
          <span className="block text-xl sm:text-2xl lg:text-3xl text-gold-soft font-serif font-medium tracking-wide drop-shadow-sm">
            {isHi ? "जोरावर धाम में आपका स्वागत है" : "Welcome to Shri Jorawar Dham"}
          </span>
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif font-bold tracking-tight text-cream-ivory leading-tight sm:leading-tight drop-shadow-md">
            {isHi ? "आस्था • शक्ति • शांति की पावन तपोभूमि" : "Sanctuary of Faith, Strength & Tranquility"}
          </h1>
        </div>

        {/* Supporting Devotional Description with Official Dholpur Location */}
        <p className="text-sm sm:text-base lg:text-lg text-sandstone-200/95 max-w-2xl mx-auto font-light leading-relaxed">
          {isHi
            ? "राजस्थान के धौलपुर जिले में पावन ग्राम चितौरा (तहसील सैंपऊ) में स्थित भगवान जोरावर धाम — जहाँ आध्यात्मिक ऊर्जा, प्राकृतिक सौंदर्य और लाखों श्रद्धालुओं की आस्था का संगम है।"
            : "Located in village Chitaura, Tehsil Saipau, District Dholpur (Rajasthan) — the sacred ground of Bhagwan Jorawar offering spiritual solace and divine darshan."}
        </p>

        {/* Reusable Sacred Ornamental Divider */}
        <SacredDivider variant="gold" className="my-2" />

        {/* Dual Primary Call-to-Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
          <a
            href="#darshan-timings"
            className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep font-serif font-bold px-7 py-3 rounded-xl shadow-sacred-md hover:shadow-gold-glow transition-all subtle-lift text-sm border border-gold-royal/40"
          >
            <Calendar className="w-4 h-4 text-maroon-deep" />
            <span>{isHi ? "दिव्य दर्शन समय देखें" : "View Darshan Timings"}</span>
          </a>

          <Link
            href={`/${locale}/about`}
            className="w-full sm:w-auto min-h-[46px] inline-flex items-center justify-center gap-2 bg-maroon-primary/80 hover:bg-maroon-wine text-cream-ivory font-serif font-semibold px-7 py-3 rounded-xl border border-gold-royal/40 backdrop-blur-md transition-all subtle-lift text-sm shadow-sacred-sm"
          >
            <BookOpen className="w-4 h-4 text-gold-soft" />
            <span>{isHi ? "धाम का पावन इतिहास" : "Dham History"}</span>
            <ArrowRight className="w-4 h-4 text-gold-soft" />
          </Link>
        </div>

        {/* Highlights: Free Darshan, Annakshetra, 80G Tax Exemption */}
        <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-3xl mx-auto text-left">
          <div className="bg-maroon-deep/80 border border-gold-royal/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm shadow-sacred-sm">
            <ShieldCheck className="w-5 h-5 text-gold-soft shrink-0" />
            <div>
              <span className="block text-xs font-serif font-bold text-cream-ivory">
                {isHi ? "100% निःशुल्क दर्शन" : "100% Free Darshan"}
              </span>
              <span className="text-[10px] text-sandstone-300">
                {isHi ? "प्रवेश व दर्शन पूर्णतः निःशुल्क" : "Zero entry fee or charges"}
              </span>
            </div>
          </div>

          <div className="bg-maroon-deep/80 border border-gold-royal/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm shadow-sacred-sm">
            <HeartHandshake className="w-5 h-5 text-gold-soft shrink-0" />
            <div>
              <span className="block text-xs font-serif font-bold text-cream-ivory">
                {isHi ? "नित्य अन्नक्षेत्र सेवा" : "Daily Free Meals"}
              </span>
              <span className="text-[10px] text-sandstone-300">
                {isHi ? "सभी श्रद्धालुओं हेतु महाप्रसाद" : "Complimentary community meals"}
              </span>
            </div>
          </div>

          <div className="bg-maroon-deep/80 border border-gold-royal/30 rounded-xl p-3 flex items-center gap-3 backdrop-blur-sm shadow-sacred-sm">
            <Sparkles className="w-5 h-5 text-gold-soft shrink-0" />
            <div>
              <span className="block text-xs font-serif font-bold text-cream-ivory">
                {isHi ? "80G आयकर छूट पंजीकृत" : "80G Tax Exemption"}
              </span>
              <span className="text-[10px] text-sandstone-300">
                {siteConfig.organization.registrationNumber}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
