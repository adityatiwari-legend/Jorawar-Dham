import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import {
  Sparkles,
  ShieldCheck,
  HeartHandshake,
  CheckCircle2,
  Building2,
  Target,
  ArrowRight,
  Flame,
  Sun,
  Compass,
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
      ? "हमारे बारे में | सिद्ध श्री जोरावर धाम सेवा समिति, चितौरा (धौलपुर)"
      : "About Us | Siddh Shri Jorawar Dham Seva Samiti, Chitaura (Dholpur)",
    description: isHi
      ? "भगवान जोरावर धाम, धार्मिक महत्व, आस्था, शक्ति, शांति, चितौरा, धौलपुर, लगभग 130 वर्ष पूर्व जन्म एवं मंदिर निर्माण के उद्देश्य।"
      : "Discover the spiritual heritage, life, and construction objectives of Siddh Shri Jorawar Dham, Chitaura (Dholpur, Rajasthan).",
    alternates: {
      canonical: `/${locale}/about`,
      languages: {
        hi: "/hi/about",
        en: "/en/about",
      },
    },
  };
}

export default async function AboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* 1. Header & Official Identity */}
      <div className="flex flex-col items-center text-center space-y-4 border-b border-sandstone-200 pb-10">
        <div className="p-2 bg-cream-ivory rounded-2xl border border-gold-royal/30 shadow-sacred-sm">
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
            {isHi ? "हमारे बारे में" : "About Us"}
          </h1>
          <p className="text-xs font-mono text-stone-500">
            {siteConfig.organization.nameHi} • रजि. नं. {siteConfig.organization.registrationNumber}
          </p>
        </div>

        <p className="text-xs sm:text-sm text-mutedText font-mono">
          {siteConfig.address.fullHi}
        </p>

        <SacredDivider variant="gold" className="my-2" />
      </div>

      {/* 2. Core Introductory Section */}
      <section className="bg-cream-ivory rounded-3xl border border-gold-royal/30 p-8 sm:p-12 shadow-sacred-sm space-y-6">
        <div className="space-y-2">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal block">
            {isHi ? "आस्था • शक्ति • शांति" : "Faith • Strength • Peace"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
            {isHi ? "भगवान जोरावर धाम — धार्मिक महत्व एवं पवित्र पृष्ठभूमि" : "Bhagwan Jorawar Dham — Spiritual Heritage"}
          </h2>
        </div>

        <div className="space-y-4 text-stone-700 text-sm sm:text-base leading-relaxed font-light">
          <p>
            {isHi
              ? "राजस्थान राज्य के ऐतिहासिक धौलपुर जिले में पावन तहसील सैंपऊ के अंतर्गत स्थित ग्राम चितौरा में 'सिद्ध श्री जोरावर धाम' आस्था, शक्ति और शांति का एक अलौकिक आध्यात्मिक केंद्र है। यहाँ का शांत, सुरम्य और प्राकृतिक वातावरण स्वतः ही मन को ईश्वरीय चेतना से जोड़ देता है।"
              : "Located in village Chitaura, Tehsil Saipau, District Dholpur (Rajasthan), Siddh Shri Jorawar Dham stands as a sanctified center of spiritual energy, faith, strength, and serene peace."}
          </p>
          <p>
            {isHi
              ? "स्थानीय मान्यताओं और उपलब्ध प्रामाणिक ऐतिहासिक वृत्तांतों के अनुसार, परम पूज्य भगवान जोरावर जी महाराज का जन्म आज से लगभग 130 वर्ष पूर्व इसी पावन धरा पर हुआ था। उन्होंने सांसारिक गृहस्थ जीवन में रहते हुए भी कठोर तप, निस्वार्थ भक्ति और लोक-कल्याण का अद्वितीय आदर्श प्रस्तुत किया। गृहस्थ आश्रम में रहकर भी उन्होंने ऐसी दिव्य आध्यात्मिक सिद्धियाँ प्राप्त कीं, जिन्होंने क्षेत्र के अनगिनत असहाय और पीड़ित जनों के जीवन में नवप्रकाश भरा।"
              : "According to venerated traditions, Bhagwan Jorawar was born approximately 130 years ago in this very land. Leading a disciplined household life, he attained extraordinary spiritual heights and dedicated himself completely to community welfare and divine penance."}
          </p>
          <p>
            {isHi
              ? "आज यह पावन तीर्थ स्थान लाखों श्रद्धालुओं की अटूट आस्था का केंद्र है, जहाँ जाति, वर्ण अथवा वर्ग के किसी भी भेद के बिना प्रत्येक भक्त का आदरपूर्वक स्वागत होता है और सार्वजनिक दर्शन पूर्णतः निःशुल्क हैं।"
              : "Today, this sacred sanctuary welcomes thousands of pilgrims without discrimination, providing free darshan and solace to all seekers."}
          </p>
        </div>
      </section>

      {/* 3. Section: उद्देश्य (Purpose) */}
      <section className="bg-cream-warm rounded-3xl border border-sandstone-200 p-8 sm:p-12 shadow-sacred-sm space-y-5">
        <div className="flex items-center gap-2 text-gold-royal">
          <Target className="w-5 h-5" />
          <span className="text-xs font-serif font-bold uppercase tracking-widest">
            {isHi ? "संस्था का ध्येय" : "Mission"}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
          {siteConfig.purpose.titleHi}
        </h2>
        <p className="text-stone-700 text-sm sm:text-base leading-relaxed font-light">
          {siteConfig.purpose.textHi}
        </p>
      </section>

      {/* 4. Section: मंदिर निर्माण का उद्देश्य (Exact 6 Construction Objectives) */}
      <section id="construction-objectives" className="scroll-mt-24 space-y-8">
        <SectionHeader
          eyebrow={isHi ? "संकल्प" : "Vision"}
          title={isHi ? "निर्माण का उद्देश्य" : "Construction Objectives"}
          subtitle={
            isHi
              ? "भव्य मंदिर निर्माण एवं तीर्थ विकास के छह मुख्य उद्देश्य"
              : "Six foundational objectives guiding the proposed temple construction and pilgrim welfare"
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {siteConfig.constructionObjectives.map((obj) => (
            <div
              key={obj.num}
              className="bg-cream-ivory rounded-2xl border border-sandstone-200 p-6 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-gold-royal bg-maroon-deep px-3 py-1 rounded-full border border-gold-royal/30">
                  {obj.num}
                </span>
                <span className="text-xs font-serif font-bold text-maroon-deep">
                  {obj.titleHi}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-stone-700 leading-relaxed font-light">
                {obj.textHi}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Section: मंदिर निर्माण हेतु अपील (Appeal with Strong CTA) */}
      <section className="sacred-gradient-card rounded-3xl text-cream-ivory p-8 sm:p-12 lg:p-14 shadow-devotional-lg relative overflow-hidden border border-gold-royal/40 space-y-6">
        <div className="space-y-3 max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-gold-royal/20 text-gold-soft px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold uppercase tracking-wider border border-gold-royal/40">
            <Building2 className="w-4 h-4 text-gold-royal" />
            <span>{siteConfig.appeal.titleHi}</span>
          </span>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold leading-tight text-cream-ivory">
            {isHi
              ? "पावन मंदिर निर्माण में आपका स्वैच्छिक सहयोग सादर प्रार्थनीय है"
              : "Your Voluntary Support for Temple Construction is Reverently Solicited"}
          </h2>
          <p className="text-sandstone-200 text-sm sm:text-base leading-relaxed font-light">
            {siteConfig.appeal.textHi}
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-4">
          <Link
            href={`/${locale}/donation`}
            className="min-h-[46px] inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep font-serif font-bold px-7 py-3 rounded-xl shadow-sacred-md transition-all text-xs sm:text-sm border border-gold-royal/40 subtle-lift"
          >
            <HeartHandshake className="w-4 h-4 text-maroon-deep" />
            <span>{siteConfig.appeal.ctaHi}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/history`}
            className="min-h-[46px] inline-flex items-center gap-2 bg-cream-ivory/10 hover:bg-cream-ivory/20 text-cream-ivory font-serif font-semibold px-6 py-3 rounded-xl border border-cream-ivory/20 backdrop-blur-sm transition-all text-xs sm:text-sm"
          >
            <span>{isHi ? "धाम का संपूर्ण इतिहास पढ़ें" : "Read Complete History"}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
