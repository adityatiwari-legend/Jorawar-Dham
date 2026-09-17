import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { Flame, Clock, Sparkles, Bell, ShieldCheck, ArrowRight, Sun, Moon } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "दैनिक महाआरती समय सारिणी एवं नियम | श्री जोरावर धाम"
      : "Daily Maha Aarti Schedule & Rituals | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम में मंगला, श्रृंगार, राजभोग, संध्या एवं शयन आरती का अधिकृत समय, मंत्र एवं दर्शन नियम।"
      : "Official schedule and spiritual significance of Mangala, Shringar, Rajbhog, Sandhya, and Shayan Aartis at Shri Jorawar Dham.",
    alternates: {
      canonical: `/${locale}/aarti`,
      languages: {
        hi: "/hi/aarti",
        en: "/en/aarti",
      },
    },
  };
}

export default async function AartiPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  const aartis = [
    {
      nameHi: "मंगला आरती",
      nameEn: "Mangala Aarti",
      time: "05:15 AM",
      icon: <Sun className="w-6 h-6 text-amber-500" />,
      descHi: "ब्रह्म मुहूर्त में भगवान के प्रथम दर्शन। सुगंधित धूप, शंखनाद और वैदिक मंत्रोच्चार के साथ भगवान को जगाने का मंगल अनुष्ठान।",
      descEn: "First divine darshan in the auspicious Brahma Muhurta. Waking the deity with fragrant incense, sacred conch blowing, and Vedic hymns.",
      statusHi: "प्रातः काल",
      statusEn: "Dawn Ritual",
    },
    {
      nameHi: "श्रृंगार आरती",
      nameEn: "Shringar Aarti",
      time: "07:30 AM",
      icon: <Sparkles className="w-6 h-6 text-saffron-500" />,
      descHi: "दिव्य विग्रह के दिव्य स्नान (अभिषेक), नूतन वस्त्र, चंदन, पुष्पमाला और आभूषणों से अलंकृत करने के उपरांत होने वाली भव्य आरती।",
      descEn: "Grand worship post holy ritual bath (Abhishekam), adorned with fresh traditional silks, sandalwood paste, garlands, and sacred jewels.",
      statusHi: "प्रातः काल",
      statusEn: "Morning Ritual",
    },
    {
      nameHi: "राजभोग आरती",
      nameEn: "Rajbhog Aarti",
      time: "12:00 PM",
      icon: <Flame className="w-6 h-6 text-orange-500" />,
      descHi: "दोपहर के समय भगवान को छप्पन भोग एवं पवित्र सात्विक नैवेद्य अर्पित करने के पश्चात की जाने वाली मुख्य मध्याह्न आरती।",
      descEn: "Midday ceremonial offering of holy sattvic feast and delicacies (Naivedyam) to the deity, followed by midday rest.",
      statusHi: "मध्याह्न काल",
      statusEn: "Midday Ritual",
    },
    {
      nameHi: "संध्या महाआरती",
      nameEn: "Sandhya Maha Aarti",
      time: "07:00 PM",
      icon: <Bell className="w-6 h-6 text-rose-500" />,
      descHi: "सूर्यास्त के समय नगाड़ों, घंटियों एवं विशाल पंच-प्रदीपक दीपों के साथ आयोजित होने वाली धाम की सर्वाधिक भव्य आरती।",
      descEn: "The most magnificent congregation of the day at twilight, resonating with temple drums, brass bells, and giant multi-wick brass lamps.",
      statusHi: "सायं काल (महापर्व)",
      statusEn: "Twilight Ritual (Grand)",
    },
    {
      nameHi: "शयन आरती",
      nameEn: "Shayan Aarti",
      time: "09:30 PM",
      icon: <Moon className="w-6 h-6 text-indigo-400" />,
      descHi: "रात्रि के समय भगवान को विश्राम अर्पित करने हेतु मधुर भजनों के साथ अंतिम आरती। इसके उपरांत गर्भगृह के कपाट बंद होते हैं।",
      descEn: "The concluding night ceremony offering devotional lullabies and fragrant oils before the sanctum doors are respectfully closed for rest.",
      statusHi: "रात्रि काल",
      statusEn: "Night Concluding Ritual",
    },
  ];

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <Flame className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "दैनिक महाआरती परंपरा" : "Sacred Aarti Tradition"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "श्री जोरावर धाम की पंच-आरती सारिणी" : "Pancha-Aarti Schedule & Timings"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "दिन के पांचों प्रहरों में होने वाली मंगल आरती का समय, आध्यात्मिक महात्म्य एवं दर्शनार्थियों के लिए नियम।"
            : "Complete schedule, spiritual significance, and congregation rules for all five daily worship rituals."}
        </p>
      </div>

      {/* Aartis Grid */}
      <div className="space-y-6">
        {aartis.map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-2xl border border-sandstone-200 p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-start gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-sandstone-100 border border-sandstone-200 flex items-center justify-center shrink-0">
                {item.icon}
              </div>
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-bold text-maroon-950 font-serif">
                    {isHi ? item.nameHi : item.nameEn}
                  </h2>
                  <span className="bg-sandstone-100 text-stone-700 text-xs px-2.5 py-0.5 rounded-full font-medium">
                    {isHi ? item.statusHi : item.statusEn}
                  </span>
                </div>
                <p className="text-sm text-stone-600 leading-relaxed max-w-2xl">
                  {isHi ? item.descHi : item.descEn}
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center justify-between sm:justify-center border-t sm:border-t-0 sm:border-l border-sandstone-200 pt-4 sm:pt-0 sm:pl-8 shrink-0">
              <span className="text-xs text-stone-500 font-medium uppercase tracking-wider">
                {isHi ? "समय" : "Time"}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-maroon-900 font-mono tracking-tight">
                {item.time}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Devotee Guidelines Box */}
      <div className="bg-sandstone-100/90 rounded-3xl p-8 border border-sandstone-300 space-y-4">
        <div className="flex items-center gap-2 text-maroon-950 font-bold text-lg font-serif">
          <ShieldCheck className="w-5 h-5 text-saffron-700" />
          <span>{isHi ? "आरती दर्शनार्थियों के लिए महत्वपूर्ण नियम" : "Important Rules for Aarti Devotees"}</span>
        </div>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-stone-700">
          <li className="flex items-start gap-2">
            <span className="text-saffron-600 font-bold">•</span>
            <span>
              {isHi
                ? "आरती आरंभ होने से कम से कम 15 मिनट पूर्व गर्भगृह प्रांगण में स्थान ग्रहण करें।"
                : "Please assemble inside the sanctum courtyard at least 15 minutes prior to aarti start."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-saffron-600 font-bold">•</span>
            <span>
              {isHi
                ? "आरती के पावन क्षणों में वीडियोग्राफी एवं फोटोग्राफी पूर्णतः प्रतिबंधित है।"
                : "Videography and mobile recording are strictly prohibited during sacred ritual moments."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-saffron-600 font-bold">•</span>
            <span>
              {isHi
                ? "आरती उपरांत चरणामृत एवं प्रसाद शांतिपूर्वक कतारबद्ध होकर प्राप्त करें।"
                : "Receive sacred charanamrit and prasadam in orderly queues post-worship."}
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-saffron-600 font-bold">•</span>
            <span>
              {isHi
                ? "वृद्धजनों एवं नन्हे बच्चों के लिए प्रथम पंक्ति में विशेष स्थान आरक्षित रहता है।"
                : "Special reserved seating is accommodated for the elderly and parents with young infants."}
            </span>
          </li>
        </ul>
      </div>

      {/* Cross Links */}
      <div className="flex flex-wrap gap-4 justify-center pt-2">
        <Link
          href={`/${locale}/darshan`}
          className="inline-flex items-center gap-2 bg-maroon-900 hover:bg-maroon-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
        >
          <Clock className="w-4 h-4" />
          <span>{isHi ? "दैनिक दर्शन समय" : "Daily Darshan Schedule"}</span>
        </Link>
        <Link
          href={`/${locale}/seva`}
          className="inline-flex items-center gap-2 bg-white hover:bg-sandstone-200 text-stone-800 border border-sandstone-300 px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
        >
          <span>{isHi ? "आरती एवं पूजा सेवा संकल्प" : "Offer Pooja & Seva"}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
