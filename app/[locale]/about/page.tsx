import type { Metadata } from "next";
import { Locale, isValidLocale, getDictionary } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { Sparkles, Shield, HeartHandshake, Eye } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "धाम परिचय - श्री जोरावर धाम तीर्थ ट्रस्ट | आस्था • शक्ति • शांति"
      : "About Jorawar Dham - Pilgrimage Trust & Mission | Faith • Strength • Peace",
    description: isHi
      ? "राजस्थान के शेखावाटी अंचल में स्थित श्री जोरावर धाम तीर्थ ट्रस्ट का परिचय, निष्काम सेवा संकल्प एवं सनातन परंपरा।"
      : "Discover Shri Jorawar Dham, a sacred pilgrimage sanctuary in Rajasthan dedicated to spiritual service and Sanatan values.",
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

  const dict = getDictionary(locale as Locale);

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Page Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-3.5 py-1 rounded-full">
          <Sparkles className="w-3.5 h-3.5 text-saffron-600" />
          <span>{locale === "hi" ? "धाम परिचय" : "About Jorawar Dham"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {locale === "hi" ? "श्री जोरावर धाम तीर्थ ट्रस्ट" : "Shri Jorawar Dham Pilgrimage Trust"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {locale === "hi"
            ? "राजस्थान के पावन शेखावाटी अंचल में स्थित, श्रद्धा, साधना एवं जनकल्याण का पावन केंद्र।"
            : "Situated in the sacred Shekhawati region of Rajasthan, a timeless sanctuary of devotion, spiritual austerity, and community welfare."}
        </p>
      </div>

      {/* Main Content */}
      <div className="prose prose-stone max-w-none space-y-8 text-stone-700 leading-relaxed">
        <section className="bg-white rounded-2xl p-8 border border-sandstone-200 shadow-sm space-y-4">
          <h2 className="text-2xl font-bold text-maroon-900 font-serif">
            {locale === "hi" ? "आध्यात्मिक ध्येय एवं संकल्प" : "Spiritual Purpose & Mission"}
          </h2>
          <p>
            {locale === "hi"
              ? "श्री जोरावर धाम केवल एक मंदिर नहीं, अपितु भारतीय सनातन संस्कृति, तपस्या और निस्वार्थ सेवा का जीवंत केंद्र है। यहाँ आने वाले प्रत्येक श्रद्धालु को अलौकिक शांति और मानसिक शक्ति की अनुभूति होती है। धाम में अखंड धूणा प्रज्वलित है, जहाँ संत-महात्माओं द्वारा युगों से निरंतर साधना की जाती रही है।"
              : "Shri Jorawar Dham is not merely a temple, but a living vibrant center of Sanatan culture, spiritual discipline, and selfless service. Every pilgrim visiting the Dham experiences profound peace and sacred rejuvenation. The eternal sacred flame (Akhand Dhoona) has burned here for generations as a beacon of relentless prayer and penance."}
          </p>
        </section>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 not-prose">
          <div className="bg-sandstone-100/70 p-6 rounded-2xl border border-sandstone-300/80 space-y-3">
            <Shield className="w-8 h-8 text-maroon-900" />
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              {locale === "hi" ? "निःशुल्क दर्शन" : "Free Public Darshan"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {locale === "hi"
                ? "प्रत्येक भक्त के लिए मंदिर के द्वार समान रूप से खुले हैं। किसी भी प्रकार का भेदभाव या वीआईपी शुल्क यहाँ स्वीकार्य नहीं है।"
                : "The divine doors are open equally to all devotees without commercialization or preferential fee barriers."}
            </p>
          </div>

          <div className="bg-sandstone-100/70 p-6 rounded-2xl border border-sandstone-300/80 space-y-3">
            <HeartHandshake className="w-8 h-8 text-saffron-700" />
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              {locale === "hi" ? "अन्नदान सेवा" : "Annadan Seva"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {locale === "hi"
                ? "धाम में प्रतिदिन सात्विक महाप्रसाद का निःशुल्क वितरण होता है। भूखे को भोजन और प्यासे को जल प्रदान करना हमारा परम धर्म है।"
                : "Daily free distribution of holy sattvic meals to pilgrims and wandering mendicants in our community annakshetra."}
            </p>
          </div>

          <div className="bg-sandstone-100/70 p-6 rounded-2xl border border-sandstone-300/80 space-y-3">
            <Eye className="w-8 h-8 text-amber-700" />
            <h3 className="text-lg font-bold text-stone-900 font-serif">
              {locale === "hi" ? "पारदर्शिता व सत्यनिष्ठा" : "Trust & Transparency"}
            </h3>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
              {locale === "hi"
                ? "धाम का संचालन पंजीकृत धर्मार्थ ट्रस्ट द्वारा अत्यंत ईमानदारी और पारदर्शिता के साथ किया जाता है।"
                : "Administered by a registered religious and charitable trust adhering to the highest standards of governance."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
