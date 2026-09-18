import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import {
  Sparkles,
  Building2,
  TreePine,
  Flame,
  Calendar,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
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
      ? "मुख्य आकर्षण | सिद्ध श्री जोरावर धाम, चितौरा (धौलपुर)"
      : "Main Attractions | Siddh Shri Jorawar Dham, Chitaura (Dholpur)",
    description: isHi
      ? "सिद्ध श्री जोरावर धाम के मुख्य आकर्षण: भव्य मंदिर परिसर, प्राकृतिक वातावरण, विशेष पूजा-हवन एवं वार्षिक तीज मेला।"
      : "Discover the main attractions of Shri Jorawar Dham: temple complex, serene natural environment, special pooja, and annual Teej fair.",
    alternates: {
      canonical: `/${locale}/attraction-point`,
      languages: {
        hi: "/hi/attraction-point",
        en: "/en/attraction-point",
      },
    },
  };
}

export default async function AttractionPointPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  const attractionIcons = [Building2, TreePine, Flame, Calendar];

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* 1. Header */}
      <div className="text-center space-y-4 border-b border-sandstone-200 pb-10">
        <div className="inline-flex items-center gap-2 bg-cream-warm border border-gold-royal/30 px-4 py-1.5 rounded-full text-gold-royal text-xs font-serif font-bold uppercase tracking-widest shadow-sacred-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isHi ? "तीर्थ दर्शन व विशेषताएं" : "Sacred Highlights"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-maroon-deep">
          {isHi ? "मुख्य आकर्षण" : "Main Attractions"}
        </h1>

        <p className="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "सिद्ध श्री जोरावर धाम तीर्थ के चार प्रमुख आध्यात्मिक एवं सांस्कृतिक आकर्षण जो जन-जन को आकर्षित करते हैं।"
            : "Four foundational spiritual, architectural, and cultural attractions of Shri Jorawar Dham."}
        </p>

        <SacredDivider variant="gold" className="my-2" />
      </div>

      {/* 2. The 4 Major Attractions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Attraction 1: मंदिर परिसर */}
        <div className="bg-cream-ivory rounded-3xl p-8 border border-sandstone-200 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-gold-royal/10 border border-gold-royal/30 flex items-center justify-center text-gold-royal">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
              {isHi ? "मंदिर परिसर" : "Temple Complex"}
            </h2>
            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed font-light">
              {isHi
                ? "सिद्ध श्री जोरावर धाम का प्रस्तावित भव्य मंदिर परिसर पारंपरिक राजस्थानी व भारतीय स्थापत्य कला का अनुपम उदाहरण होगा। गर्भगृह में परम पूज्य भगवान जोरावर जी महाराज की दिव्य व अलौकिक तेजपुंज प्रतिमा प्रतिष्ठापित होगी। परिसर में भक्तों के लिए शांत ध्यान कक्ष, विशाल परिक्रमा पथ एवं आधुनिक दर्शन सुविधाएं विकसित की जा रही हैं।"
                : "The proposed grand temple complex showcases traditional Indian stone architecture with a consecrated sanctum housing the divine deity idol of Bhagwan Jorawar."}
            </p>
          </div>
          <div className="pt-4 border-t border-sandstone-100 flex items-center gap-2 text-xs text-gold-royal font-serif font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>{isHi ? "सुदृढ़ एवं सुरक्षित संरचना" : "Disaster-safe structure"}</span>
          </div>
        </div>

        {/* Attraction 2: प्राकृतिक वातावरण */}
        <div className="bg-cream-ivory rounded-3xl p-8 border border-sandstone-200 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TreePine className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
              {isHi ? "प्राकृतिक वातावरण" : "Natural Serenity"}
            </h2>
            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed font-light">
              {isHi
                ? "शहरी कोलाहल से दूर, ग्राम चितौरा में स्थित यह धाम चारों ओर लहलहाते खेत-खलिहानों, घने छायादार पेड़-पौधों एवं पवित्र वृक्षों से घिरा हुआ है। प्रातःकाल एवं संध्या के समय पक्षियों का कलरव और शीतल पावन समीर यहाँ आने वाले प्रत्येक श्रद्धालु के हृदय को अद्भुत आत्मिक शांति और ताजगी प्रदान करती है।"
                : "Surrounded by lush green agricultural fields, sacred trees, and birdsong, the Dham offers a tranquil pastoral sanctuary for inner reflection and peace."}
            </p>
          </div>
          <div className="pt-4 border-t border-sandstone-100 flex items-center gap-2 text-xs text-emerald-700 font-serif font-semibold">
            <Sparkles className="w-4 h-4" />
            <span>{isHi ? "प्रदूषण मुक्त पावन तपोभूमि" : "Tranquil spiritual environment"}</span>
          </div>
        </div>

        {/* Attraction 3: विशेष पूजा और उत्सव */}
        <div className="bg-cream-ivory rounded-3xl p-8 border border-sandstone-200 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-maroon-deep/10 border border-maroon-deep/30 flex items-center justify-center text-maroon-deep">
              <Flame className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
              {isHi ? "विशेष पूजा और उत्सव" : "Special Pooja & Rituals"}
            </h2>
            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed font-light">
              {isHi
                ? "धाम में नित्य नियम से प्रातः एवं सायं कालीन दिव्य महाआरती, भक्ति-भजन एवं अखंड हवन का आयोजन होता है। प्रत्येक माह की विशेष मासिक तिथियों पर श्रद्धालु विशेष पूजा-अर्चना हेतु पधारते हैं। प्रतिवर्ष होली के पश्चात तृतीया को विशेष धार्मिक अनुष्ठान और मंगल महाआरती की जाती है।"
                : "Regular devotional hymns, continuous havan rituals, and monthly holy gatherings are celebrated with great spiritual fervor."}
            </p>
          </div>
          <div className="pt-4 border-t border-sandstone-100 flex items-center gap-2 text-xs text-maroon-deep font-serif font-semibold">
            <Flame className="w-4 h-4 text-gold-royal" />
            <span>{isHi ? "अखंड धूणा एवं दैनिक हवन" : "Continuous sacred rituals"}</span>
          </div>
        </div>

        {/* Attraction 4: वार्षिक मेला */}
        <div className="bg-cream-ivory rounded-3xl p-8 border border-sandstone-200 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-center text-amber-700">
              <Calendar className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-maroon-deep">
              {isHi ? "वार्षिक तीज मेला" : "Annual Teej Fair"}
            </h2>
            <p className="text-stone-700 text-xs sm:text-sm leading-relaxed font-light">
              {isHi
                ? "प्रतिवर्ष रंगों के उत्सव होली के पश्चात 'तीज' पर धाम में विशाल मेले का आयोजन होता है। इस अवसर पर भव्य सत्संग, भक्ति भजन-संगीत एवं पारंपरिक सांस्कृतिक कार्यक्रमों का आयोजन किया जाता है, जिसमें राजस्थान, उत्तर प्रदेश, मध्य प्रदेश सहित विभिन्न राज्यों से लाखों श्रद्धालु दर्शन और आशीर्वाद प्राप्त करने पहुँचते हैं।"
                : "Celebrated annually after Holi on Teej, this grand festival attracts thousands of pilgrims with satsang, devotional music, and cultural events."}
            </p>
          </div>
          <div className="pt-4 border-t border-sandstone-100 flex items-center gap-2 text-xs text-amber-800 font-serif font-semibold">
            <Calendar className="w-4 h-4" />
            <span>{isHi ? "होली पश्चात तीज का महापर्व" : "Annual post-Holi congregation"}</span>
          </div>
        </div>
      </div>

      {/* 3. Call to Action Banner */}
      <section className="bg-cream-warm rounded-3xl border border-gold-royal/30 p-8 sm:p-12 text-center space-y-4 shadow-sacred-sm">
        <h3 className="text-2xl font-serif font-bold text-maroon-deep">
          {isHi ? "धाम पधारकर इन दिव्य अनुभूतियों का लाभ लें" : "Experience the Divine Presence in Person"}
        </h3>
        <p className="text-xs sm:text-sm text-mutedText max-w-xl mx-auto">
          {isHi
            ? "धाम में सभी श्रद्धालुओं के लिए दर्शन पूर्णतः निःशुल्क हैं। आवास एवं भोजन की उत्तम व्यवस्था उपलब्ध है।"
            : "Free public darshan with clean dharamshala stay and daily community meals."}
        </p>
        <div className="pt-2 flex flex-wrap justify-center gap-3">
          <Link
            href={`/${locale}/how-to-reach`}
            className="inline-flex items-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory px-6 py-3 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm border border-gold-royal/30"
          >
            <span>{isHi ? "यहाँ कैसे पहुंचे (मार्ग विवरण)" : "How to Reach"}</span>
            <ArrowRight className="w-4 h-4 text-gold-soft" />
          </Link>
          <Link
            href={`/${locale}/donation`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep px-6 py-3 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm border border-gold-royal/40"
          >
            <HeartHandshake className="w-4 h-4" />
            <span>{isHi ? "मंदिर निर्माण में सहयोग करें" : "Support the Temple"}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
