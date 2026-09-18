import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { Compass, Train, Car, Plane, Home, ShieldCheck, Clock, CheckCircle, HeartHandshake, PhoneCall, AlertCircle, Accessibility } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "यात्री सूचना एवं मार्गदर्शिका - पहुँचने का मार्ग, धर्मशाला एवं नियम | श्री जोरावर धाम"
      : "Visitor Information & Guide - Transit, Lodging & Guidelines | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम आने वाले तीर्थयात्रियों हेतु मार्गदर्शिका: रेल, सड़क व वायु मार्ग, धर्मशाला आवास, दर्शन नियम एवं सुविधाएं।"
      : "Complete visitor guide for Shri Jorawar Dham pilgrims: transit routes, dharamshala accommodation, facilities, accessibility, and protocols.",
    alternates: {
      canonical: `/${locale}/visitor-info`,
      languages: {
        hi: "/hi/visitor-info",
        en: "/en/visitor-info",
      },
    },
  };
}

export default async function VisitorInfoPage({
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
          <Compass className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "तीर्थयात्री संपूर्ण मार्गदर्शिका" : "Comprehensive Pilgrim Guide"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "श्री जोरावर धाम यात्री सूचना" : "Visitor Information & Dham Logistics"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "यात्रा की सुगम तैयारी, आवास (धर्मशाला), यातायात के साधन, सुरक्षा एवं परिसर सुविधाओं का सम्पूर्ण विवरण।"
            : "Everything you need to plan a seamless pilgrimage: travel routes, dharamshala stay, facilities, and protocols."}
        </p>
      </div>

      {/* Transit Options Grid */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-maroon-950 font-serif">
          {isHi ? "धाम कैसे पहुँचें? (यातायात के साधन)" : "How to Reach Shri Jorawar Dham"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-saffron-100 border border-saffron-200 flex items-center justify-center text-saffron-700">
              <Train className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {isHi ? "रेलवे मार्ग" : "By Train"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {isHi
                ? "निकटतम प्रमुख रेलवे स्टेशन धौलपुर जंक्शन (25 कि.मी.) एवं भरतपुर स्टेशन (75 कि.मी.) हैं। साथ ही आगरा (60 कि.मी.) व ग्वालियर (90 कि.मी.) प्रमुख रेल संपर्क बिंदु हैं। स्टेशन से चितौरा हेतु नियमित टैक्सियां व स्थानीय साधन उपलब्ध हैं।"
                : "The primary railway stations are Dholpur Junction (25 km) and Bharatpur Station (75 km), along with major junctions at Agra (60 km) and Gwalior (90 km). Regular taxis and transport are available to Chitaura."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700">
              <Car className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {isHi ? "सड़क मार्ग" : "By Road"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {isHi
                ? "धौलपुर शहर से 25 कि.मी., खरोगढ़ (उ.प्र.) से 17 कि.मी., आगरा से 60 कि.मी., ग्वालियर से 90 कि.मी., भरतपुर से 75 कि.मी. एवं करौली से 105 कि.मी. की दूरी पर स्थित है। सुगम पक्की सड़कों द्वारा सीधी कनेक्टिविटी है।"
                : "Connected via well-paved roads: Dholpur (25 km), Kheragarh UP (17 km), Agra (60 km), Gwalior (90 km), Bharatpur (75 km), and Karauli (105 km)."}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-sandstone-200 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-maroon-100 border border-maroon-200 flex items-center justify-center text-maroon-900">
              <Plane className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-stone-900 font-serif">
              {isHi ? "हवाई मार्ग" : "By Air"}
            </h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              {isHi
                ? "निकटतम हवाई अड्डे आगरा एयरपोर्ट (लगभग 60 कि.मी.) एवं ग्वालियर एयरपोर्ट (लगभग 90 कि.मी.) हैं। यहाँ से टैक्सी अथवा बस द्वारा सीधे धाम पहुंचा जा सकता है।"
                : "The nearest airports are Agra Airport (approx. 60 km) and Gwalior Airport (approx. 90 km), with smooth taxi connectivity to the Dham."}
            </p>
          </div>
        </div>
      </div>

      {/* Dharamshala & Stay */}
      <div className="bg-white rounded-3xl p-8 border border-sandstone-200 shadow-sm space-y-6">
        <div className="flex items-center gap-3 border-b border-sandstone-200 pb-4">
          <Home className="w-7 h-7 text-saffron-600" />
          <div>
            <h2 className="text-2xl font-bold text-maroon-950 font-serif">
              {isHi ? "श्री जोरावर धाम धर्मशाला (आवास व्यवस्था)" : "Dharamshala & Pilgrim Accommodation"}
            </h2>
            <span className="text-xs text-stone-500">{isHi ? "तीर्थ ट्रस्ट द्वारा संचालित" : "Managed directly by Temple Trust"}</span>
          </div>
        </div>

        <p className="text-stone-700 text-sm sm:text-base leading-relaxed">
          {isHi
            ? "दूर-दराज से आने वाले श्रद्धालुओं की सुविधा हेतु धाम परिसर में 150+ स्वच्छ वातानुकूलित (AC) एवं गैर-वातानुकूलित पारिवारिक कक्ष एवं विशाल विश्राम हॉल उपलब्ध हैं। कक्षों का आवंटन मुख्य स्वागत कार्यालय पर आगमन के समय 'पहले आओ, पहले पाओ' के आधार पर किया जाता है।"
            : "To comfortably accommodate visiting families, the Trust operates 150+ well-ventilated AC and Non-AC guest rooms, along with spacious devotee dormitory halls. Room allotment is processed at the reception desk on a first-come, first-served basis upon presenting government ID."}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-sandstone-50 p-4 rounded-xl border border-sandstone-200 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">{isHi ? "चेक-इन / चेक-आउट" : "Check-in / Check-out"}</span>
            <p className="text-sm font-bold text-stone-900">{isHi ? "दोपहर 12:00 बजे (24 घंटे चक्र)" : "12:00 PM (24-Hour Cycle)"}</p>
          </div>
          <div className="bg-sandstone-50 p-4 rounded-xl border border-sandstone-200 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">{isHi ? "आवश्यक दस्तावेज" : "Required ID"}</span>
            <p className="text-sm font-bold text-stone-900">{isHi ? "आधार कार्ड / वैध पहचान पत्र" : "Aadhaar Card / Government Photo ID"}</p>
          </div>
          <div className="bg-sandstone-50 p-4 rounded-xl border border-sandstone-200 space-y-1">
            <span className="text-xs text-stone-500 font-semibold">{isHi ? "सहयोग राशि" : "Maintenance Charge"}</span>
            <p className="text-sm font-bold text-stone-900">{isHi ? "मात्र नाममात्र रख-रखाव शुल्क" : "Nominal Maintenance Only"}</p>
          </div>
        </div>
      </div>

      {/* Facilities & Accessibility */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-maroon-950 font-bold text-lg font-serif">
            <Accessibility className="w-6 h-6 text-emerald-600" />
            <span>{isHi ? "दिव्यांग एवं वरिष्ठ नागरिक सहायता" : "Senior & Accessibility Services"}</span>
          </div>
          <ul className="space-y-2.5 text-sm text-stone-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{isHi ? "गर्भगृह तक व्हीलचेयर एवं सुगम रैंप की व्यवस्था।" : "Wheelchair facilities and smooth ramps right up to the sanctum."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{isHi ? "वरिष्ठ नागरिकों (65+ वर्ष) हेतु विशेष कतार व विश्राम बेंच।" : "Dedicated priority queue and shaded seating for seniors (65+)."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{isHi ? "स्वयंसेवकों द्वारा सहायता केंद्र पर तत्पर मार्गदर्शन।" : "Trust sevaks stationed at help desks for immediate personal assistance."}</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-7 border border-sandstone-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2.5 text-maroon-950 font-bold text-lg font-serif">
            <ShieldCheck className="w-6 h-6 text-saffron-700" />
            <span>{isHi ? "परिसर सुविधाएं" : "On-Premises Amenities"}</span>
          </div>
          <ul className="space-y-2.5 text-sm text-stone-700">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
              <span>{isHi ? "निःशुल्क जूता-चप्पल स्टैंड एवं टोकन प्रणाली।" : "Complimentary footwear deposit counters with token security."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
              <span>{isHi ? "सामान एवं मोबाइल हेतु सुरक्षित क्लॉक रूम (लॉकर)।" : "Secure luggage and mobile cloakroom lockers."}</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-saffron-600 shrink-0 mt-0.5" />
              <span>{isHi ? "24 घंटे निःशुल्क प्राथमिक स्वास्थ्य केंद्र एवं एम्बुलेंस।" : "24/7 complimentary first-aid clinic and ambulance station."}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Best Season to Visit */}
      <div className="bg-sandstone-100/80 rounded-2xl p-7 border border-sandstone-300 space-y-3">
        <h3 className="font-bold text-lg text-maroon-950 font-serif">
          {isHi ? "यात्रा का सर्वोत्तम समय" : "Best Time to Visit"}
        </h3>
        <p className="text-sm text-stone-700 leading-relaxed">
          {isHi
            ? "राजस्थान के सुखद मौसम का आनंद लेने हेतु अक्टूबर से मार्च का समय सर्वाधिक अनुकूल रहता है। विशेष धार्मिक आयोजनों में चैत्र व आश्विन नवरात्र, गुरु पूर्णिमा एवं वार्षिक पाटोत्सव के दौरान धाम में विशेष भक्ति उल्लास रहता है।"
            : "The ideal period to visit is from October through March when Rajasthan's climate is pleasantly cool. The holy festivals of Chaitra/Ashwin Navratri, Guru Purnima, and the Annual Dham Patotsav draw grand congregations of pilgrims."}
        </p>
      </div>

      {/* Helpline Contact Strip */}
      <div className="bg-maroon-950 text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="space-y-1 text-center sm:text-left">
          <span className="text-xs text-gold-300 font-semibold uppercase tracking-wider">
            {isHi ? "तीर्थयात्री सहायता डेस्क" : "Devotee Helpline"}
          </span>
          <p className="text-lg font-bold font-serif">
            {isHi ? "यात्रा अथवा आवास संबंधी किसी भी असुविधा के लिए संपर्क करें" : "Need assistance planning your visit?"}
          </p>
        </div>
        <a
          href="tel:+919530106218"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all shrink-0"
        >
          <PhoneCall className="w-4 h-4" />
          <span>+91-9530106218</span>
        </a>
      </div>
    </div>
  );
}
