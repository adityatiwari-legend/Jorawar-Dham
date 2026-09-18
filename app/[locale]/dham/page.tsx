import type { Metadata } from "next";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { Compass, Train, Car, Plane, Home, ShieldAlert, CheckCircle } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "तीर्थ विवरण व संदर्शिका - धाम प्रांगण, सरोवर व नियम | श्री जोरावर धाम"
      : "Dham Guide & Facilities - Sanctum, Sacred Tank & Decorum | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम परिसर, पवित्र सरोवर, धर्मशाला विश्राम गृह एवं दर्शन आचार संहिता की प्रामाणिक जानकारी।"
      : "Detailed guide to Shri Jorawar Dham pilgrimage facilities, holy sacred tank, dharamshala accommodation, and devotee protocols.",
    alternates: {
      canonical: `/${locale}/dham`,
      languages: {
        hi: "/hi/dham",
        en: "/en/dham",
      },
    },
  };
}

export default async function DhamPage({
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
          <Compass className="w-3.5 h-3.5 text-saffron-600" />
          <span>{locale === "hi" ? "तीर्थ यात्री संदर्शिका" : "Visitor & Pilgrim Guide"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {locale === "hi" ? "धाम विवरण एवं तीर्थ यात्रा मार्ग" : "Dham Facilities & Transit Guide"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {locale === "hi"
            ? "धाम पहुँचने, ठहरने, दर्शन नियमों एवं पवित्र सरोवर की संपूर्ण जानकारी।"
            : "Complete instructions on transit, dharamshala lodging, sacred tank, and pilgrim protocols."}
        </p>
      </div>

      {/* How to Reach Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-maroon-950 font-serif">
          {locale === "hi" ? "धाम कैसे पहुँचें?" : "How to Reach Shri Jorawar Dham"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <Train className="w-8 h-8 text-saffron-600" />
            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {locale === "hi" ? "रेलवे मार्ग" : "By Railway"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {locale === "hi"
                ? "निकटतम प्रमुख रेलवे स्टेशन धौलपुर (25 कि.मी.) एवं भरतपुर (75 कि.मी.) हैं। साथ ही आगरा (60 कि.मी.) व ग्वालियर (90 कि.मी.) से नियमित रेल संपर्क उपलब्ध है।"
                : "Nearest primary railway stations are Dholpur (25 km) and Bharatpur (75 km), along with Agra (60 km) and Gwalior (90 km)."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <Car className="w-8 h-8 text-amber-600" />
            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {locale === "hi" ? "सड़क मार्ग" : "By Road"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {locale === "hi"
                ? "धौलपुर (25 कि.मी.), खरोगढ़ (17 कि.मी.), आगरा (60 कि.मी.), ग्वालियर (90 कि.मी.), भरतपुर (75 कि.मी.) एवं करौली (105 कि.मी.) से पक्की सड़कों द्वारा सुगम संपर्क।"
                : "Smooth road connectivity from Dholpur (25 km), Kheragarh UP (17 km), Agra (60 km), Gwalior (90 km), Bharatpur (75 km), and Karauli (105 km)."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <Plane className="w-8 h-8 text-maroon-800" />
            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {locale === "hi" ? "वायु मार्ग" : "By Air"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {locale === "hi"
                ? "निकटतम हवाई अड्डे आगरा एयरपोर्ट (लगभग 60 कि.मी.) एवं ग्वालियर एयरपोर्ट (लगभग 90 कि.मी.) स्थित हैं।"
                : "The nearest airports are Agra Airport (approx. 60 km) and Gwalior Airport (approx. 90 km), offering convenient taxi access."}
            </p>
          </div>
        </div>
      </div>

      {/* Facilities: Dharamshala & Kund */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl border border-sandstone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-maroon-900">
            <Home className="w-6 h-6 text-saffron-600" />
            <h3 className="text-xl font-bold font-serif">
              {locale === "hi" ? "धर्मशाला एवं विश्राम गृह" : "Dharamshala & Accommodation"}
            </h3>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {locale === "hi"
              ? "तीर्थ ट्रस्ट द्वारा संचालित वातानुकूलित एवं सामान्य कक्ष श्रद्धालुओं हेतु मामूली रख-रखाव सहयोग राशि पर उपलब्ध हैं। परिवार एवं वृद्धजनों के लिए विशेष व्यवस्था है।"
              : "Clean air-conditioned and standard rooms managed by the Trust are allocated on arrival at minimal nominal maintenance contributions."}
          </p>
          <ul className="text-xs text-stone-600 space-y-2 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locale === "hi" ? "24 घंटे निर्बाध जल एवं विद्युत आपूर्ति" : "24-Hour continuous water & power backup"}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{locale === "hi" ? "समीप ही निःशुल्क अन्नक्षेत्र भोजन व्यवस्था" : "Proximity to free community meals"}</span>
            </li>
          </ul>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-sandstone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-maroon-900">
            <ShieldAlert className="w-6 h-6 text-amber-600" />
            <h3 className="text-xl font-bold font-serif">
              {locale === "hi" ? "दर्शन एवं आचार संहिता" : "Devotee Code of Conduct"}
            </h3>
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {locale === "hi"
              ? "धाम की पवित्रता बनाए रखने हेतु सभी तीर्थयात्रियों से विनम्र सहयोग की अपेक्षा है।"
              : "Devotees are requested to observe sacred decorum inside the holy precinct."}
          </p>
          <ul className="text-xs text-stone-600 space-y-2 pt-2">
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locale === "hi" ? "मंदिर प्रांगण में शालीन एवं पारम्परिक वस्त्र पहनें" : "Wear modest, respectful traditional attire"}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locale === "hi" ? "गर्भगृह के सम्मुख मोबाइल फोन साइलेंट रखें" : "Keep mobile devices silent inside sanctum"}</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locale === "hi" ? "परिसर में धूम्रपान एवं नशीले पदार्थ सर्वथा वर्जित हैं" : "Strict prohibition of intoxicants and smoking"}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
