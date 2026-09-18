import type { Metadata } from "next";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Send,
  Navigation,
  AlertTriangle,
  Share2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
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
      ? "संपर्क करें — सिद्ध श्री जोरावर धाम सेवा समिति | चितौरा, धौलपुर (राज.)"
      : "Contact Us — Siddh Shri Jorawar Dham Seva Samiti | Dholpur, Rajasthan",
    description: isHi
      ? "सिद्ध श्री जोरावर धाम सेवा समिति, ग्राम व पोस्ट चितौरा, तहसील सैंपऊ, जिला धौलपुर (राज.) - 328027। अधिकृत दूरभाष: +91-9530106218, +91-9530106219, +91-9530106220, ईमेल: info@jorawardham.in।"
      : "Official contact numbers, address, and email for Siddh Shri Jorawar Dham Seva Samiti, Chitaura, Saipau, Dholpur, Rajasthan - 328027.",
    alternates: {
      canonical: `/${locale}/contact`,
      languages: {
        hi: "/hi/contact",
        en: "/en/contact",
      },
    },
  };
}

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const isHi = locale === "hi";

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header Banner */}
      <div className="flex flex-col items-center text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-widest bg-maroon-deep/5 px-4 py-1.5 rounded-full border border-gold-royal/30">
          {siteConfig.mantra}
        </span>
        <div className="p-2.5 bg-white rounded-2xl border border-sandstone-300 shadow-md">
          <img
            src="/branding/jorawar-dham-logo.png"
            alt={siteConfig.organization.nameHi}
            className="h-16 sm:h-20 w-auto object-contain rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
            {isHi ? "संपर्क करें" : "Contact Us"}
          </h1>
          <p className="text-base sm:text-lg font-serif text-maroon-primary font-semibold">
            {isHi ? siteConfig.organization.nameHi : siteConfig.organization.nameEn}
          </p>
          <p className="text-xs sm:text-sm font-mono text-saffron-800 font-semibold">
            {isHi
              ? `पंजीकरण संख्या: ${siteConfig.organization.registrationNumber}`
              : `Registration No.: ${siteConfig.organization.registrationNumber}`}
          </p>
        </div>
        <p className="text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "धाम दर्शन, धार्मिक अनुष्ठान, दान एवं यात्रा संबंधी समस्त पूछताछ हेतु हमारे आधिकारिक संपर्क सूत्रों से संपर्क करें।"
            : "Reach out via our official communication channels for darshan guidelines, sacred rituals, donations, and pilgrimage transit."}
        </p>
      </div>

      {/* Main Grid: Contact Channels + Devotee Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Official Contact Channels */}
        <div className="lg:col-span-5 space-y-6">
          {/* Official Address Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sandstone-300 shadow-sm space-y-5">
            <div className="flex items-center gap-3 border-b border-sandstone-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-gold-soft/10 border border-gold-royal/30 flex items-center justify-center text-maroon-deep">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">
                  {isHi ? "अधिकृत पता" : "Official Address"}
                </h2>
                <span className="text-xs text-mutedText">
                  {isHi ? "संस्था एवं धाम कार्यालय" : "Trust & Dham Headquarters"}
                </span>
              </div>
            </div>

            <div className="text-sm text-stone-800 leading-relaxed font-serif bg-sandstone-50 p-4 rounded-xl border border-sandstone-200">
              <p className="font-semibold text-maroon-deep text-base mb-1">
                {isHi ? siteConfig.organization.nameHi : siteConfig.organization.nameEn}
              </p>
              <p>{siteConfig.address.fullHi}</p>
              <p className="text-xs text-stone-600 font-sans mt-2">
                {siteConfig.address.fullEn}
              </p>
            </div>
          </div>

          {/* Official Telephones Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sandstone-300 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-sandstone-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">
                  {isHi ? "फोन / दूरभाष" : "Official Telephones"}
                </h2>
                <span className="text-xs text-mutedText">
                  {isHi ? "सीधे संपर्क हेतु (Click to Call)" : "Click to Call"}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              {siteConfig.contact.phones.map((phone, idx) => (
                <a
                  key={phone}
                  href={`tel:${phone.replace(/[^0-9+]/g, "")}`}
                  className="flex items-center justify-between p-3 rounded-xl bg-sandstone-50 hover:bg-gold-soft/15 border border-sandstone-200 text-maroon-deep font-mono font-semibold text-sm sm:text-base transition-colors group"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-xs font-serif font-bold text-stone-500 bg-sandstone-200 px-2 py-0.5 rounded">
                      लाइन {idx + 1}
                    </span>
                    <span>{phone}</span>
                  </span>
                  <span className="text-xs font-sans text-emerald-700 group-hover:underline">
                    {isHi ? "कॉल करें" : "Call"}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Official Email Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sandstone-300 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-sandstone-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-maroon-50 border border-maroon-200 flex items-center justify-center text-maroon-deep">
                <Mail className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">
                  {isHi ? "ईमेल संपर्क" : "Official Email"}
                </h2>
                <span className="text-xs text-mutedText">
                  {isHi ? "लिखित पत्राचार व अभिलेख" : "Official Correspondence"}
                </span>
              </div>
            </div>

            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="flex items-center justify-between p-3.5 rounded-xl bg-sandstone-50 hover:bg-maroon-50 border border-sandstone-200 text-maroon-deep font-mono font-semibold text-sm sm:text-base transition-colors group"
            >
              <span>{siteConfig.contact.email}</span>
              <span className="text-xs font-sans text-maroon-primary group-hover:underline">
                {isHi ? "ईमेल भेजें" : "Send Mail"}
              </span>
            </a>
          </div>

          {/* Social Media Card */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sandstone-300 shadow-sm space-y-4">
            <div className="flex items-center gap-3 border-b border-sandstone-200 pb-3">
              <div className="w-10 h-10 rounded-xl bg-saffron-50 border border-saffron-200 flex items-center justify-center text-saffron-700">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold font-serif text-stone-900">
                  {isHi ? "सोशल मीडिया" : "Social Media"}
                </h2>
                <span className="text-xs text-mutedText">
                  {isHi ? "धाम की गतिविधियों से जुड़ें" : "Connect with Dham activities"}
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {isHi
                ? "सिद्ध श्री जोरावर धाम सेवा समिति के पावन आयोजनों, नित्य दर्शन एवं आरती प्रसारण से जुड़ने हेतु आधिकारिक माध्यम।"
                : "Official updates, daily darshan, and religious festival announcements."}
            </p>

            <div className="flex flex-wrap gap-2.5 pt-1">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sandstone-100 rounded-lg text-xs font-serif font-medium text-stone-700 border border-sandstone-200">
                YouTube: सिद्ध श्री जोरावर धाम
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sandstone-100 rounded-lg text-xs font-serif font-medium text-stone-700 border border-sandstone-200">
                Facebook: सिद्ध श्री जोरावर धाम
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Devotee Inquiry Form + Map & Verification Notice */}
        <div className="lg:col-span-7 space-y-6">
          {/* सन्देश भेजें Form */}
          <div className="bg-sandstone-100/90 p-8 sm:p-10 rounded-2xl border border-sandstone-300 space-y-6 shadow-sm">
            <div className="space-y-1 border-b border-sandstone-300 pb-4">
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                {isHi ? "सन्देश भेजें" : "Send a Message"}
              </h2>
              <p className="text-xs sm:text-sm text-stone-600">
                {isHi
                  ? "यदि आपके पास दर्शन, दान, यात्रा अथवा सेवा से संबंधित कोई प्रश्न है, तो कृपया नीचे विवरण दर्ज करें।"
                  : "For inquiries regarding darshan, transit, donations, or seva offerings, submit your message below."}
              </p>
            </div>

            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {isHi ? "श्रद्धालु का पूरा नाम *" : "Full Name *"}
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                  placeholder={isHi ? "उदा. रमेश शर्मा" : "e.g. Ramesh Sharma"}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    {isHi ? "मोबाइल नंबर *" : "Mobile Phone *"}
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    placeholder="+91-9530106218"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    {isHi ? "ईमेल (वैकल्पिक)" : "Email (Optional)"}
                  </label>
                  <input
                    type="email"
                    className="w-full px-4 py-2.5 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                    placeholder="devotee@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {isHi ? "विषय" : "Subject"}
                </label>
                <select className="w-full px-4 py-2.5 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none">
                  <option value="darshan">
                    {isHi ? "दर्शन एवं पूजा पूछताछ" : "Darshan & Pooja Inquiry"}
                  </option>
                  <option value="donation">
                    {isHi ? "दान एवं मंदिर निर्माण सहयोग" : "Donation & Temple Support"}
                  </option>
                  <option value="reach">
                    {isHi ? "आगमन एवं मार्ग सहायता" : "How to Reach / Transit"}
                  </option>
                  <option value="other">{isHi ? "अन्य विषय" : "General Query"}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  {isHi ? "संदेश अथवा जिज्ञासा *" : "Message / Inquiry *"}
                </label>
                <textarea
                  rows={4}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-gold-royal focus:outline-none"
                  placeholder={
                    isHi
                      ? "अपना प्रश्न या संदेश यहाँ विस्तार से लिखें..."
                      : "Type your query or message here..."
                  }
                />
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory font-serif font-bold py-3 px-6 rounded-xl transition-colors shadow-sacred-sm text-sm"
              >
                <Send className="w-4 h-4" />
                <span>{isHi ? "संदेश प्रेषित करें" : "Submit Inquiry"}</span>
              </button>
            </form>
          </div>

          {/* Section 21: मानचित्र & Location Verification Notice */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-sandstone-300 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-sandstone-200 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gold-royal/10 border border-gold-royal/30 flex items-center justify-center text-maroon-deep">
                  <Navigation className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold font-serif text-stone-900">
                    {isHi ? "मानचित्र एवं मार्ग मार्गदर्शन" : "Map & Geographic Location"}
                  </h2>
                  <span className="text-xs text-mutedText">
                    {isHi ? "चितौरा, धौलपुर (राजस्थान)" : "Chitaura, Dholpur (Rajasthan)"}
                  </span>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-xs font-medium border border-amber-200">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>{isHi ? "सत्यापन सूचना" : "Verification Notice"}</span>
              </span>
            </div>

            {/* Verification Alert conforming to Section 21 of migration spec */}
            <div className="bg-amber-50/70 border border-amber-300 p-4 rounded-xl space-y-2 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>
                  {isHi
                    ? "भौगोलिक अवस्थिति एवं मानचित्र स्पष्टीकरण"
                    : "Geographic Location & Map Clarification"}
                </span>
              </div>
              <p className="leading-relaxed">
                {isHi
                  ? "पुरानी वेबसाइट में एम्बेड किए गए मानचित्र में गोवर्धन (उ.प्र.) का संदर्भ था, जो समिति के वास्तविक अधिकृत पते (चितौरा, तहसील सैंपऊ, जिला धौलपुर, राजस्थान) से भिन्न था। शून्य-भ्रामकता नीति के तहत हमने भ्रामक नक्शा नहीं लगाया है। कृपया नीचे दिए गए अधिकृत पते के अनुसार ही यात्रा योजना बनाएं।"
                  : "The legacy website contained an embedded map iframe referencing Govardhan, UP, which conflicted with the official registered address in Chitaura, Tehsil Saipau, District Dholpur, Rajasthan. Adhering to zero-fabrication guidelines, travel should follow the official Dholpur address below."}
              </p>
            </div>

            {/* Official Coordinates / Search Action */}
            <div className="bg-sandstone-50 p-5 rounded-xl border border-sandstone-200 space-y-3">
              <div className="space-y-1">
                <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider block">
                  {isHi ? "सत्यापित अधिकृत गंतव्य" : "Verified Destination"}
                </span>
                <p className="font-serif font-bold text-maroon-deep text-base">
                  {siteConfig.organization.nameHi}
                </p>
                <p className="text-xs text-stone-700">{siteConfig.address.fullHi}</p>
                <p className="text-xs text-stone-500">{siteConfig.address.fullEn}</p>
              </div>

              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    "सिद्ध श्री जोरावर धाम ग्राम चितौरा तहसील सैंपऊ धौलपुर राजस्थान 328027"
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep font-serif font-bold px-5 py-2.5 rounded-xl text-xs shadow-sacred-sm transition-all border border-gold-royal/40"
                >
                  <Navigation className="w-4 h-4 text-maroon-deep" />
                  <span>{isHi ? "गूगल मैप्स पर अधिकृत मार्ग देखें" : "Open in Google Maps"}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
