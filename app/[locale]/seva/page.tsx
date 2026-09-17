import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale, localize } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import { HeartHandshake, Sparkles, Clock, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "पूजा व सेवा प्रकल्प - नित्य अन्नक्षेत्र, गौशाला एवं अनुष्ठान | श्री जोरावर धाम"
      : "Pooja & Seva Offerings - Annakshetra, Gaushala & Sacred Rituals | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम में संचालित नित्य अन्नक्षेत्र महाप्रसाद, कामधेनु गौशाला, अखंड धूणा दीपदान एवं विशेष पूजा सेवा की विस्तृत जानकारी।"
      : "Explore community dining (Annakshetra), Kamadhenu cow sanctuary seva, eternal flame deepdan, and devotional rituals at Shri Jorawar Dham.",
    alternates: {
      canonical: `/${locale}/seva`,
      languages: {
        hi: "/hi/seva",
        en: "/en/seva",
      },
    },
  };
}

export default async function SevaPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  // Fetch dynamic services from database
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "AVAILABLE":
        return {
          text: isHi ? "उपलब्ध" : "Available",
          cls: "bg-emerald-100 text-emerald-800 border-emerald-300",
        };
      case "SLOTS_FULL":
        return {
          text: isHi ? "स्थान पूर्ण" : "Slots Full",
          cls: "bg-stone-200 text-stone-700 border-stone-300",
        };
      case "ADVANCE_REQUIRED":
        return {
          text: isHi ? "अग्रिम संपर्क आवश्यक" : "Advance Required",
          cls: "bg-amber-100 text-amber-800 border-amber-300",
        };
      default:
        return {
          text: isHi ? "नियमित उपलब्ध" : "Daily Open",
          cls: "bg-saffron-100 text-saffron-800 border-saffron-300",
        };
    }
  };

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <HeartHandshake className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "पावन सेवा एवं पूजा प्रकल्प" : "Devotional Seva & Pooja Offerings"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "श्री जोरावर धाम पूजा व सेवा परंपरा" : "Pooja & Seva Offerings"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "परम पूज्य महाराज श्री के सानिध्य में जनकल्याण, अन्नदान, गोसेवा एवं पूजा अनुष्ठान के पावन प्रकल्प।"
            : "Participate in holy offerings of community dining, cow welfare, eternal flame incense, and temple rituals."}
        </p>
      </div>

      {/* Services Grid (Database-Driven) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {services.map((service) => {
          const status = getStatusBadge(service.bookingStatus);
          const availability = isHi ? service.availabilityHi : service.availabilityEn;
          const timing = isHi ? service.timingHi : service.timingEn;

          return (
            <div
              key={service.id}
              className="bg-white rounded-3xl border border-sandstone-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col"
            >
              {/* Image & Badges */}
              <div className="relative aspect-[16/9] bg-gradient-to-br from-maroon-950 via-maroon-900 to-saffron-950 overflow-hidden flex items-center justify-center">
                {service.imageUrl ? (
                  <img
                    src={service.imageUrl}
                    alt={isHi ? service.titleHi : service.titleEn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <img
                      src="/branding/jorawar-dham-icon.png"
                      alt="सिद्ध श्री जोरावर धाम"
                      className="w-14 h-14 rounded-full object-contain border border-gold-400/50 shadow-md mb-1.5 bg-blue-950/80 p-1"
                    />
                    <span className="text-[11px] text-gold-300 font-serif font-semibold">सिद्ध श्री जोरावर धाम</span>
                  </div>
                )}
                <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-sm ${status.cls}`}>
                    {status.text}
                  </span>
                  {service.price !== null && service.price > 0 ? (
                    <span className="text-xs font-bold bg-maroon-900 text-gold-300 px-3 py-1 rounded-full shadow-sm">
                      ₹{service.price}
                    </span>
                  ) : (
                    <span className="text-xs font-bold bg-emerald-700 text-white px-3 py-1 rounded-full shadow-sm">
                      {isHi ? "निःशुल्क सेवा" : "Complimentary"}
                    </span>
                  )}
                </div>
              </div>

              {/* Service Details */}
              <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  {/* Bilingual Title Display */}
                  <div className="space-y-0.5">
                    <h2 className="text-xl sm:text-2xl font-bold text-maroon-950 font-serif">
                      {service.titleHi}
                    </h2>
                    <p className="text-xs sm:text-sm text-saffron-700 font-medium">
                      {service.titleEn}
                    </p>
                  </div>

                  <p className="text-stone-600 text-sm leading-relaxed pt-1">
                    {isHi ? service.descriptionHi : service.descriptionEn}
                  </p>
                </div>

                {/* Additional Info Box */}
                <div className="pt-4 border-t border-sandstone-100 space-y-2 text-xs text-stone-600">
                  {timing && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                      <span><strong>{isHi ? "समय:" : "Timings:"}</strong> {timing}</span>
                    </div>
                  )}
                  {availability && (
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span><strong>{isHi ? "उपलब्धता:" : "Availability:"}</strong> {availability}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Devotee Assistance Notice */}
      <div className="bg-sandstone-100/90 rounded-2xl p-6 border border-sandstone-300 flex items-start gap-4">
        <ShieldCheck className="w-6 h-6 text-saffron-700 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-stone-700 space-y-1">
          <strong className="block text-maroon-950 font-serif font-bold text-base">
            {isHi ? "सेवा संकल्प के संबंध में आवश्यक जानकारी" : "Important Note on Devotional Offerings"}
          </strong>
          <p>
            {isHi
              ? "सभी पूजा एवं सेवा संकल्प श्री जोरावर धाम कार्यालय काउंटर पर सीधे उपस्थित होकर अथवा अधिकृत संपर्क द्वारा ही स्वीकार किए जाते हैं। किसी भी बिचौलिए अथवा अनधिकृत व्यक्ति को दान न दें।"
              : "All religious pooja resolutions and seva intentions are booked directly via the Trust office or authorized helpline. Never engage with unauthorized agents."}
          </p>
        </div>
      </div>
    </div>
  );
}
