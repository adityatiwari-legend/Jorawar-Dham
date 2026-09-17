import type { Metadata } from "next";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Clock, MessageSquare } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "संपर्क एवं सहायता - श्री जोरावर धाम ट्रस्ट कार्यालय | चूरू, राजस्थान"
      : "Contact & Pilgrim Help - Shri Jorawar Dham Trust | Churu, Rajasthan",
    description: isHi
      ? "श्री जोरावर धाम ट्रस्ट का अधिकृत पता, 24x7 हेल्पलाइन, ईमेल एवं तीर्थयात्री सहायता केंद्र।"
      : "Official contact numbers, 24/7 devotee helpline, email address, and office location of Shri Jorawar Dham Trust.",
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

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto space-y-12">
      <div className="flex flex-col items-center text-center space-y-4 border-b border-sandstone-300 pb-10">
        <div className="p-2 bg-white rounded-2xl border border-sandstone-300 shadow-md">
          <img
            src="/branding/jorawar-dham-logo.png"
            alt="सिद्ध श्री जोरावर धाम सेवा समिति"
            className="h-16 sm:h-20 w-auto object-contain rounded-lg"
          />
        </div>
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-4xl font-bold font-serif text-maroon-950">
            {locale === "hi" ? "सिद्ध श्री जोरावर धाम सेवा समिति" : "Siddh Shri Jorawar Dham Seva Samiti"}
          </h1>
          <p className="text-xs sm:text-sm font-mono text-saffron-800 font-semibold">
            {locale === "hi" ? "पंजीकरण संख्या: COOP/2023/DHOLPUR/201054" : "Registration No.: COOP/2023/DHOLPUR/201054"}
          </p>
        </div>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {locale === "hi"
            ? "तीर्थ यात्रा मार्गदर्शन, दर्शन पूछताछ एवं सामान्य जानकारियों हेतु अधिकृत संपर्क सूत्र।"
            : "Official contact channels for pilgrimage guidance, darshan inquiries, and general assistance."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Contact Info Card */}
        <div className="bg-white p-8 rounded-2xl border border-sandstone-200 shadow-sm space-y-6">
          <h2 className="text-2xl font-bold text-stone-900 font-serif border-b border-sandstone-200 pb-3">
            {locale === "hi" ? "अधिकृत संपर्क सूत्र" : "Official Contact Channels"}
          </h2>

          <div className="space-y-4 text-sm text-stone-700">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-900 font-semibold">{locale === "hi" ? "पता" : "Address"}</strong>
                <span>{locale === "hi" ? "श्री जोरावर धाम, ज़िला चूरू (शेखावाटी), राजस्थान 331001" : "Shri Jorawar Dham, Churu District (Shekhawati), Rajasthan 331001, India"}</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-900 font-semibold">{locale === "hi" ? "कार्यालय दूरभाष" : "Trust Office Phone"}</strong>
                <span>+91-141-2345678</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-900 font-semibold">{locale === "hi" ? "24x7 तीर्थयात्री हेल्पलाइन" : "24x7 Pilgrim Helpline"}</strong>
                <span className="font-semibold text-emerald-800">+91-98765-43210</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-900 font-semibold">{locale === "hi" ? "ईमेल" : "Email"}</strong>
                <span>trust@jorawardham.org</span>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-saffron-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-stone-900 font-semibold">{locale === "hi" ? "कार्यालय समय" : "Office Hours"}</strong>
                <span>{locale === "hi" ? "प्रातः 08:00 से सायं 06:00 (समस्त दिन)" : "08:00 AM - 06:00 PM (All 7 Days)"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Devotee Inquiry Form Box */}
        <div className="bg-sandstone-100/80 p-8 rounded-2xl border border-sandstone-300/80 space-y-6">
          <h2 className="text-2xl font-bold text-stone-900 font-serif border-b border-sandstone-300 pb-3">
            {locale === "hi" ? "संदेश भेजें" : "Send an Inquiry"}
          </h2>
          <p className="text-xs text-stone-600">
            {locale === "hi"
              ? "यदि आपके पास दर्शन, यात्रा अथवा सेवा से संबंधित कोई प्रश्न है, तो कृपया नीचे विवरण दर्ज करें।"
              : "For inquiries regarding darshan, transit, or volunteer offerings, please provide your details."}
          </p>

          <form className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                {locale === "hi" ? "श्रद्धालु का नाम" : "Full Name"}
              </label>
              <input
                type="text"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                placeholder={locale === "hi" ? "उदा. रमेश शर्मा" : "e.g. Ramesh Sharma"}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                {locale === "hi" ? "मोबाइल नंबर" : "Mobile Phone"}
              </label>
              <input
                type="tel"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                placeholder="+91-9876543210"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                {locale === "hi" ? "संदेश अथवा जिज्ञासा" : "Inquiry / Message"}
              </label>
              <textarea
                rows={4}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-sandstone-300 bg-white text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                placeholder={locale === "hi" ? "अपना प्रश्न यहाँ लिखें..." : "Type your query here..."}
              />
            </div>

            <button
              type="submit"
              className="w-full bg-maroon-900 hover:bg-maroon-800 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm text-sm"
            >
              {locale === "hi" ? "संदेश प्रेषित करें" : "Submit Inquiry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
