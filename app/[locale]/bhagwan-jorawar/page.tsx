import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { Sparkles, Flame, Heart, Shield, Sun, ArrowRight, BookOpen } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "भगवान जोरावर - पावन प्राकट्य, तपोगाथा एवं दिव्य स्वरूप | श्री जोरावर धाम"
      : "Bhagwan Jorawar - Divine Descent, Penance & Sacred Form | Shri Jorawar Dham",
    description: isHi
      ? "परम पूज्य भगवान जोरावर जी महाराज का दिव्य जीवन चरित्र, कठोर तपोबल, अखंड धूणे का प्राकट्य एवं जन-कल्याणकारी उपदेश।"
      : "The divine life narrative, profound austerity, eternal flame (Akhand Dhoona), and sacred teachings of Param Pujya Bhagwan Jorawar Ji Maharaj.",
    alternates: {
      canonical: `/${locale}/bhagwan-jorawar`,
      languages: {
        hi: "/hi/bhagwan-jorawar",
        en: "/en/bhagwan-jorawar",
      },
    },
  };
}

export default async function BhagwanJorawarPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "दिव्य प्राकट्य एवं तपोलीला" : "Divine Incarnation & Penance"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "परम पूज्य भगवान जोरावर जी महाराज" : "Param Pujya Bhagwan Jorawar Ji Maharaj"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "आस्था, शक्ति और परम शांति के प्रतीक — जिनका पावन सानिध्य जीवन के समस्त बंधनों और कष्टों का निवारण करता है।"
            : "The supreme embodiment of Faith, Strength, and Peace — whose holy sanctuary liberates devotees from worldly afflictions."}
        </p>
      </div>

      {/* Hero Narrative Card */}
      <div className="relative bg-gradient-to-br from-maroon-950 via-maroon-900 to-saffron-950 rounded-3xl text-white p-8 sm:p-12 overflow-hidden shadow-devotional-lg border border-gold-500/30">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-gold-500/30">
            <Sun className="w-3.5 h-3.5 text-gold-400" />
            <span>{isHi ? "तपस्या का अमृत" : "Sanctified Tapasya"}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold font-serif leading-snug text-gold-200">
            {isHi
              ? "मरुधरा की पावन भूमि पर ज्योतिर्मय प्राकट्य"
              : "Luminous Descent upon the Sacred Desert Soil"}
          </h2>

          <p className="text-sandstone-200 text-base sm:text-lg leading-relaxed font-light">
            {isHi
              ? "राजस्थान की वीर प्रसूता और संतों की उर्वर धरा पर भगवान जोरावर जी महाराज का प्राकट्य जनसाधारण में सत्य, धर्म और दया के पुनर्जागरण हेतु हुआ। बाल्यकाल से ही विरक्त भाव धारण कर उन्होंने मरुस्थलीय एकांत में कठोर साधना की। प्रकृति की विषम परिस्थितियों में ग्रीष्म की प्रचंड धूप और शीत के तुषार में अविचल रहकर उन्होंने अखंड ब्रह्मचर्य और आत्मज्ञान की पराकाष्ठा को सिद्ध किया।"
              : "On the revered soil of Rajasthan, celebrated for spiritual masters and saints, Bhagwan Jorawar Ji Maharaj descended to re-awaken righteousness, truth, and compassion among the people. Renouncing worldly illusions from early life, he engaged in rigorous penance across the quiet desert frontier, remaining steadfast amidst scorching sands and wintry frosts to attain supreme spiritual mastery."}
          </p>
        </div>
      </div>

      {/* Spiritual Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-saffron-100 border border-saffron-200 flex items-center justify-center text-saffron-800">
            <Flame className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-maroon-950 font-serif">
            {isHi ? "अखंड धूणा परंपरा" : "Akhand Dhoona"}
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            {isHi
              ? "महाराज श्री द्वारा स्थापित अखंड धूणा आज भी अहर्निश प्रज्वलित है। इस पावन अग्नि की विभूति भक्तों के समस्त शारीरिक, मानसिक और आध्यात्मिक कष्टों का शमन करती है।"
              : "The eternal fire lit by Maharaj burns continuously. Its sanctified ash (Vibhuti) is revered by pilgrims across India for healing and protective blessings."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
            <Heart className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-maroon-950 font-serif">
            {isHi ? "दीन-दुखियों पर कृपा" : "Unconditional Compassion"}
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            {isHi
              ? "भगवान जोरावर के दरबार में कोई धनी अथवा निर्धन नहीं है। निष्कपट हृदय से जो भी याचना करता है, महाराज श्री की असीम अनुकम्पा से उसका मनोरथ अवश्य पूर्ण होता है।"
              : "Before Bhagwan Jorawar, all distinctions of wealth and status dissolve. Any devotee seeking solace with a pure heart receives profound grace and guidance."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-xl bg-maroon-100 border border-maroon-200 flex items-center justify-center text-maroon-900">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-maroon-950 font-serif">
            {isHi ? "धर्म एवं गो-संरक्षण" : "Gau-Seva & Dharma"}
          </h3>
          <p className="text-sm text-stone-600 leading-relaxed">
            {isHi
              ? "महाराज श्री ने गोवंश सेवा, अन्नदान और सत्य आचरण को जीवन का सर्वोत्तम कर्तव्य बताया। यही कारण है कि धाम में नित्य अन्नक्षेत्र एवं कामधेनु गौशाला संचालित है।"
              : "He consecrated cow protection, hunger relief, and truthful conduct as foundational virtues, which continue today through the Trust's Gaushala and free Annakshetra."}
          </p>
        </div>
      </div>

      {/* Teachings & Devotional Conduct */}
      <div className="bg-sandstone-100/80 rounded-3xl p-8 sm:p-10 border border-sandstone-300 space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-maroon-950 font-serif">
          {isHi ? "महाराज श्री के अमर उपदेश" : "Sacred Precepts & Teachings"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-stone-700 text-sm sm:text-base leading-relaxed">
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-2">
            <strong className="block text-maroon-900 font-serif text-lg font-bold">
              {isHi ? "1. सत्य एवं निर्मल वाणी" : "1. Truthful & Gentle Speech"}
            </strong>
            <p>
              {isHi
                ? "सत्य ही ईश्वर का साक्षात्कार है। वाणी में मधुरता और हृदय में छल-कपट का त्याग ही सच्ची पूजा है।"
                : "Truth is the direct gateway to the Divine. Cultivate gentleness in words and banish deceit from the mind."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-2">
            <strong className="block text-maroon-900 font-serif text-lg font-bold">
              {isHi ? "2. परोपकार एवं सेवा" : "2. Selfless Service to Living Beings"}
            </strong>
            <p>
              {isHi
                ? "संसार के प्रत्येक प्राणी में परमात्मा का वास है। भूखे को भोजन, निर्बल को संबल और असमर्थ को आश्रय देना सबसे बड़ा पुण्य है।"
                : "See the Supreme Soul in every entity. Feeding the hungry and supporting the vulnerable is the greatest virtue."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-2">
            <strong className="block text-maroon-900 font-serif text-lg font-bold">
              {isHi ? "3. धैर्य और ईश्वर-विश्वास" : "3. Patience & Devout Surrender"}
            </strong>
            <p>
              {isHi
                ? "जीवन के सुख और दुःख दोनों ईश्वर के विधान हैं। प्रतिकूल परिस्थितियों में भी धैर्य और धर्म का मार्ग न त्यागें।"
                : "Joy and sorrow are divine dispensations. In moments of adversity, remain steadfast upon the righteous path."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-2">
            <strong className="block text-maroon-900 font-serif text-lg font-bold">
              {isHi ? "4. अखंड साधना" : "4. Inner Mindfulness"}
            </strong>
            <p>
              {isHi
                ? "दैनिक कर्म करते हुए भी मन में प्रभु का स्मरण बनाए रखें। कर्म ही पूजा है जब वह निष्काम भाव से किया जाए।"
                : "Maintain inner remembrance while fulfilling worldly duties; selfless action done with devotion is worship."}
            </p>
          </div>
        </div>

        {/* CTA Links */}
        <div className="pt-4 flex flex-wrap items-center gap-4">
          <Link
            href={`/${locale}/darshan`}
            className="inline-flex items-center gap-2 bg-maroon-900 hover:bg-maroon-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
          >
            <span>{isHi ? "दर्शन व आरती समय देखें" : "View Darshan Timings"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href={`/${locale}/history`}
            className="inline-flex items-center gap-2 bg-white hover:bg-sandstone-200 text-stone-800 border border-sandstone-300 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <BookOpen className="w-4 h-4 text-saffron-700" />
            <span>{isHi ? "धाम का संपूर्ण इतिहास" : "Explore Sacred History"}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
