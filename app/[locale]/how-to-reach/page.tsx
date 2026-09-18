import type { Metadata } from "next";
import Link from "next/link";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import {
  Compass,
  MapPin,
  Clock,
  Train,
  Plane,
  Car,
  ShieldCheck,
  Phone,
  ArrowRight,
  Sun,
  Sunset,
  Sparkles,
  Flame,
  Moon,
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
      ? "यहाँ कैसे पहुंचे | सिद्ध श्री जोरावर धाम, चितौरा (धौलपुर)"
      : "How to Reach | Siddh Shri Jorawar Dham, Chitaura (Dholpur)",
    description: isHi
      ? "सिद्ध श्री जोरावर धाम, ग्राम चितौरा, तहसील सैंपऊ (धौलपुर) पहुंचने का मार्ग, निकटतम स्टेशन, दूरियां एवं दिव्य दर्शन समय।"
      : "Travel directions, distances, airport/railway stations, and darshan timings for Shri Jorawar Dham, Chitaura (Dholpur, Rajasthan).",
    alternates: {
      canonical: `/${locale}/how-to-reach`,
      languages: {
        hi: "/hi/how-to-reach",
        en: "/en/how-to-reach",
      },
    },
  };
}

export default async function HowToReachPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-16">
      {/* 1. Header */}
      <div className="text-center space-y-4 border-b border-sandstone-200 pb-10">
        <div className="inline-flex items-center gap-2 bg-cream-warm border border-gold-royal/30 px-4 py-1.5 rounded-full text-gold-royal text-xs font-serif font-bold uppercase tracking-widest shadow-sacred-sm">
          <Compass className="w-3.5 h-3.5" />
          <span>{isHi ? "यात्रा मार्गदर्शिका" : "Pilgrim Logistics"}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-serif font-bold text-maroon-deep">
          {isHi ? "यहाँ कैसे पहुंचे" : "How to Reach"}
        </h1>

        <p className="text-xs sm:text-sm font-serif text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {siteConfig.address.fullHi}
        </p>

        <SacredDivider variant="gold" className="my-2" />
      </div>

      {/* 2. Source Distances Table / Grid */}
      <section className="space-y-6">
        <SectionHeader
          eyebrow={isHi ? "दूरियां" : "Distances"}
          title={isHi ? "प्रमुख नगरों एवं स्टेशनों से दूरी" : "Distances from Key Transit Hubs"}
          subtitle={
            isHi
              ? "स्रोत सामग्री के अनुसार प्रमुख रेलवे स्टेशनों, हवाई अड्डों एवं समीपवर्ती शहरों से दूरी"
              : "Exact distances from nearby railway junctions, airports, and neighbouring cities"
          }
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {siteConfig.distances.map((item) => (
            <div
              key={item.destination}
              className="bg-cream-ivory rounded-2xl p-5 border border-sandstone-200 shadow-sacred-sm text-center space-y-1.5 subtle-lift"
            >
              <div className="w-8 h-8 rounded-full bg-cream-warm border border-gold-royal/30 flex items-center justify-center text-gold-royal mx-auto">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-xs font-serif font-bold text-stone-800 block">
                {item.destination}
              </span>
              <span className="text-base sm:text-lg font-mono font-bold text-maroon-deep block">
                {item.distance}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Transport Modes (Rail, Road, Air) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200/90 shadow-sacred-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-gold-royal/10 border border-gold-royal/30 flex items-center justify-center text-gold-royal">
            <Car className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-maroon-deep text-base">
            {isHi ? "सड़क मार्ग द्वारा" : "By Road"}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {isHi
              ? "धौलपुर (25 कि.मी.) एवं खरोगढ़ (17 कि.मी.) से नियमित बस व निजी टैक्सी सेवाएं उपलब्ध हैं। आगरा-ग्वालियर राष्ट्रीय राजमार्ग से सैंपऊ होते हुए चितौरा का सुगम पक्का मार्ग है।"
              : "Well-connected by paved roads from Dholpur (25 km), Kheragarh (17 km), and Saipau tehsil with frequent local transport."}
          </p>
        </div>

        <div className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200/90 shadow-sacred-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-maroon-deep/10 border border-maroon-deep/30 flex items-center justify-center text-maroon-deep">
            <Train className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-maroon-deep text-base">
            {isHi ? "रेलवे द्वारा" : "By Rail"}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {isHi
              ? "निकटतम प्रमुख रेलवे जंक्शन धौलपुर (25 कि.मी.), आगरा (60 कि.मी.), भरतपुर (75 कि.मी.) एवं ग्वालियर (90 कि.मी.) हैं। इन स्टेशनों से सीधी टैक्सियां एवं बसें उपलब्ध रहती हैं।"
              : "Major rail heads include Dholpur Junction (25 km), Agra Cantt (60 km), Bharatpur (75 km), and Gwalior (90 km)."}
          </p>
        </div>

        <div className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200/90 shadow-sacred-sm space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
            <Plane className="w-5 h-5" />
          </div>
          <h3 className="font-serif font-bold text-maroon-deep text-base">
            {isHi ? "हवाई मार्ग द्वारा" : "By Air"}
          </h3>
          <p className="text-xs text-stone-600 leading-relaxed font-light">
            {isHi
              ? "निकटतम घरेलू हवाई अड्डे आगरा (खेरिया एयरपोर्ट, 60 कि.मी.) एवं ग्वालियर (राजमाता विजयाराजे सिंधिया एयरपोर्ट, 90 कि.मी.) हैं। अंतरराष्ट्रीय उड़ानों हेतु नई दिल्ली एयरपोर्ट (230 कि.मी.) सुगम है।"
              : "Closest airports are Agra (60 km) and Gwalior (90 km). International travelers can access via New Delhi Airport (~230 km)."}
          </p>
        </div>
      </section>

      {/* 4. Exact Darshan Timetable from Source Material */}
      <section className="bg-cream-warm rounded-3xl border border-gold-royal/30 p-8 sm:p-12 shadow-sacred-sm space-y-6">
        <div className="space-y-1">
          <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal block">
            {isHi ? "दैनिक दर्शन सारिणी" : "Sanctuary Timings"}
          </span>
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
            {isHi ? "दिव्य दर्शन समय" : "Divine Darshan Timetable"}
          </h2>
          <p className="text-xs sm:text-sm text-stone-600">
            {isHi
              ? "श्रद्धालुओं की सुविधा हेतु श्री जोरावर धाम में निर्धारित दैनिक दर्शन समय"
              : "Daily darshan sessions consecrated for pilgrims at Shri Jorawar Dham"}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {siteConfig.darshanTimings.map((slot) => (
            <div
              key={slot.slot}
              className="bg-cream-ivory rounded-2xl p-5 border border-sandstone-200 shadow-sacred-sm space-y-1.5"
            >
              <span className="text-xs font-serif font-bold text-maroon-deep block">
                {isHi ? slot.slot : slot.slotEn}
              </span>
              <span className="text-base font-mono font-bold text-gold-royal block">
                {slot.time}
              </span>
              <span className="text-[11px] text-mutedText block font-light">
                {isHi ? slot.descHi : slot.descEn}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Contact Helpline Card */}
      <section className="bg-maroon-deep text-cream-ivory rounded-3xl p-8 sm:p-10 shadow-sacred-md flex flex-col sm:flex-row items-center justify-between gap-6 border border-gold-royal/30">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-widest block">
            {isHi ? "मार्ग सहायता केंद्र" : "Route Assistance"}
          </span>
          <h3 className="text-xl sm:text-2xl font-serif font-bold text-cream-ivory">
            {isHi ? "मार्ग अथवा आवास पूछताछ हेतु संपर्क करें" : "Need Travel or Route Assistance?"}
          </h3>
          <p className="text-xs text-sandstone-300">
            {isHi
              ? "हमारे सहायता केंद्र पर संपर्क करके सुगम मार्ग एवं धर्मशाला की जानकारी प्राप्त कर सकते हैं।"
              : "Contact our 24/7 trust helpline for live road conditions and dharamshala availability."}
          </p>
        </div>

        <div className="shrink-0 flex flex-col sm:flex-row gap-3">
          <a
            href={`tel:${siteConfig.contact.phones[0].replace(/\D/g, "")}`}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep font-serif font-bold px-6 py-3 rounded-xl text-xs sm:text-sm shadow-sacred-sm"
          >
            <Phone className="w-4 h-4 text-maroon-deep" />
            <span>{siteConfig.contact.phones[0]}</span>
          </a>
          <Link
            href={`/${locale}/contact`}
            className="inline-flex items-center gap-2 bg-cream-ivory/10 hover:bg-cream-ivory/20 text-cream-ivory font-serif font-semibold px-6 py-3 rounded-xl border border-cream-ivory/20 text-xs sm:text-sm"
          >
            <span>{isHi ? "संपर्क पृष्ठ" : "Contact Us"}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
