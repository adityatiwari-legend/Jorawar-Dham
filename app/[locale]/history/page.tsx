import type { Metadata } from "next";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { BookOpen, Flame, History, Award } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "पवित्र इतिहास एवं परंपरा - अखंड धूणा व तपोलीला | श्री जोरावर धाम"
      : "Sacred History & Tradition - Eternal Flame & Penance | Shri Jorawar Dham",
    description: isHi
      ? "राजस्थान की मरुधरा पर परम पूज्य जोरावर जी महाराज द्वारा स्थापित अखंड धूणे, तपस्या और धाम का पावन इतिहास।"
      : "Explore the sacred history of Param Pujya Jorawar Ji Maharaj, the eternal sacred flame (Akhand Dhoona), and centuries of spiritual heritage.",
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

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-3.5 py-1 rounded-full">
          <History className="w-3.5 h-3.5 text-saffron-600" />
          <span>{locale === "hi" ? "पावन इतिहास" : "Sacred History"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {locale === "hi" ? "श्री जोरावर धाम का दिव्य इतिहास" : "The Sacred History of Shri Jorawar Dham"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {locale === "hi"
            ? "परम पूज्य जोरावर जी महाराज की तपस्या, त्याग और राजस्थान की वीर धरा पर स्थापित पावन परंपरा।"
            : "The sacred penance and enduring spiritual tradition established on the revered soil of Rajasthan."}
        </p>
      </div>

      {/* Timeline & Narratives */}
      <div className="space-y-10">
        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-sandstone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-maroon-900">
            <Flame className="w-7 h-7 text-saffron-600" />
            <h2 className="text-2xl font-bold font-serif">
              {locale === "hi" ? "अखंड धूणे का प्राकट्य एवं तपस्या" : "The Eternal Flame & Divine Penance"}
            </h2>
          </div>
          <p className="text-stone-700 leading-relaxed text-base sm:text-lg">
            {locale === "hi"
              ? "प्राचीन काल में परम पूज्य जोरावर जी महाराज ने इस पावन भूमि को अपनी साधना स्थली चुना। घोर वन एवं मरुभूमि के मध्य उन्होंने वर्षों तक कठोर तपस्या कर लोक-कल्याण का वरदान प्राप्त किया। धाम में स्थापित अखंड धूणा उसी दिव्य तप की ज्योति का प्रतीक है, जो आज भी दिन-रात प्रज्वलित रहता है। भक्तजन इस पवित्र विभूति को माथे पर लगाकर समस्त कष्टों से मुक्ति पाते हैं।"
              : "Centuries ago, Param Pujya Jorawar Ji Maharaj chose this desolate desert landscape of Rajasthan for profound meditation. Amidst intense penance and austerity, he sanctified this soil. The Akhand Dhoona (eternal sacred fire) established by him burns unbroken to this day, radiating spiritual blessings and healing grace."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-sandstone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-maroon-900">
            <BookOpen className="w-7 h-7 text-amber-600" />
            <h2 className="text-2xl font-bold font-serif">
              {locale === "hi" ? "राजस्थान की भक्ति धारा में स्थान" : "Position in Rajasthan's Bhakti Tradition"}
            </h2>
          </div>
          <p className="text-stone-700 leading-relaxed text-base sm:text-lg">
            {locale === "hi"
              ? "राजस्थान संतों और शूरवीरों की भूमि रहा है। श्री जोरावर धाम की गणना शेखावाटी और बीकानेर अंचल के सर्वाधिक पूजनीय धामों में होती है। यहाँ जाति, संप्रदाय और वर्ग के बंधनों से परे होकर लाखों श्रद्धालु अपनी मनोकामना पूर्ति हेतु शीश नवाने आते हैं।"
              : "Rajasthan's rich heritage of devotional movements (Bhakti) found one of its purest sanctuaries at Shri Jorawar Dham. Transcending social barriers of caste and creed, pilgrims across North India undertake annual foot pilgrimages (Padyatras) to honor the Saint's legacy."}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-8 sm:p-10 border border-sandstone-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3 text-maroon-900">
            <Award className="w-7 h-7 text-emerald-600" />
            <h2 className="text-2xl font-bold font-serif">
              {locale === "hi" ? "आधुनिक समय में धाम का विस्तार" : "Temple Trust & Modern Expansion"}
            </h2>
          </div>
          <p className="text-stone-700 leading-relaxed text-base sm:text-lg">
            {locale === "hi"
              ? "श्रद्धालुओं की बढ़ती संख्या को देखते हुए पंजीकृत ट्रस्ट द्वारा मंदिर परिसर का जीर्णोद्धार, भव्य संगमरमर प्रांगण, धर्मशालाएँ, अत्याधुनिक गौशाला एवं 24 घंटे चिकित्सालय की व्यवस्था की गई है ताकि तीर्थयात्रियों को किसी भी असुविधा का सामना न करना पड़े।"
              : "To accommodate growing devotee congregations, the registered Trust has developed extensive pilgrim dormitories, community dining facilities, a cow sanctuary (Gaushala), and medical aid stations, preserving ancient sanctity while ensuring pilgrim comfort."}
          </p>
        </div>
      </div>
    </div>
  );
}
