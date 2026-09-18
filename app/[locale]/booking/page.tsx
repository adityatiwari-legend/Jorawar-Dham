import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Calendar,
  Clock,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Info,
  Users,
  CheckCircle2,
  HeartHandshake,
} from "lucide-react";
import SacredDivider from "@/components/public/SacredDivider";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "दर्शन एवं सेवा बुकिंग | सिद्ध श्री जोरावर धाम"
      : "Darshan & Seva Booking | Siddh Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम में दैनिक दर्शन, महाआरती एवं विशेष अनुष्ठान हेतु आधिकारिक स्लॉट व पास बुकिंग।"
      : "Official slot and pass booking for daily darshan, maha aarti, and sacred rituals at Shri Jorawar Dham.",
  };
}

export default async function BookingServicesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();
  const isHi = locale === "hi";

  // Authoritative database query for all active services and their configured slots
  const services = await prisma.service.findMany({
    where: { isActive: true },
    include: {
      slots: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return (
    <div className="py-10 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* 1. Sacred Header & Step Indicator */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        {/* Step Indicator Pill */}
        <div className="inline-flex items-center gap-2 bg-cream-warm border border-gold-royal/40 px-4 py-1.5 rounded-full shadow-sacred-sm text-xs font-serif font-bold text-gold-soft">
          <Sparkles className="w-3.5 h-3.5 text-gold-royal" />
          <span>{isHi ? "चरण 01: सेवा चयन (Step 01: Select Service)" : "Step 01: Select Seva / Darshan"}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-maroon-deep tracking-tight">
          {isHi ? "दिव्य दर्शन एवं सेवा बुकिंग" : "Divine Darshan & Seva Booking"}
        </h1>

        <p className="text-sm sm:text-base text-stone-600 leading-relaxed">
          {isHi
            ? "राजस्थान के पावन तीर्थ सिद्ध श्री जोरावर धाम में दर्शन, आरती एवं विशेष अनुष्ठानों हेतु सुगम, पारदर्शी एवं डिजिटल पास बुकिंग।"
            : "Effortless and transparent digital booking for sacred darshan, maha aarti, and Vedic rituals at Siddh Shri Jorawar Dham."}
        </p>

        <SacredDivider variant="gold" className="my-3" />
      </div>

      {/* 2. Key Pilgrim Guarantees */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <div className="bg-cream-ivory border border-gold-royal/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-sacred-sm">
          <ShieldCheck className="w-6 h-6 text-gold-royal shrink-0" />
          <div>
            <span className="block text-xs font-serif font-bold text-maroon-deep">
              {isHi ? "निशुल्क एवं पारदर्शी" : "Free & Transparent"}
            </span>
            <span className="text-[11px] text-stone-500">
              {isHi ? "सामान्य दर्शन पूर्णतः निःशुल्क" : "General Darshan is 100% Free"}
            </span>
          </div>
        </div>

        <div className="bg-cream-ivory border border-gold-royal/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-sacred-sm">
          <Clock className="w-6 h-6 text-gold-royal shrink-0" />
          <div>
            <span className="block text-xs font-serif font-bold text-maroon-deep">
              {isHi ? "निश्चित समय स्लॉट" : "Guaranteed Time Slots"}
            </span>
            <span className="text-[11px] text-stone-500">
              {isHi ? "भीड़ नियंत्रण एवं सुगम दर्शन" : "Capacity controlled queues"}
            </span>
          </div>
        </div>

        <div className="bg-cream-ivory border border-gold-royal/30 rounded-2xl p-4 flex items-center gap-3.5 shadow-sacred-sm">
          <CheckCircle2 className="w-6 h-6 text-gold-royal shrink-0" />
          <div>
            <span className="block text-xs font-serif font-bold text-maroon-deep">
              {isHi ? "डिजिटल क्यूआर पास" : "Digital QR Pass"}
            </span>
            <span className="text-[11px] text-stone-500">
              {isHi ? "मोबाइल पर तत्काल डिजिटल टिकट" : "Instant e-ticket on mobile"}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Services Grid from Authoritative Database */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const isFree = !service.price || service.price === 0;
          const slotsCount = service.slots.length;

          return (
            <div
              key={service.id}
              className="bg-cream-ivory border border-sandstone-300 rounded-3xl overflow-hidden shadow-sacred-sm hover:shadow-sacred-md hover:border-gold-royal/60 transition-all flex flex-col justify-between group"
            >
              {/* Service Card Top Banner */}
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-gold-royal font-bold bg-cream-warm px-2.5 py-0.5 rounded-full border border-gold-royal/20">
                      {service.slug.replace("-", " ")}
                    </span>
                    <h2 className="text-xl font-serif font-bold text-maroon-deep group-hover:text-maroon-primary transition-colors">
                      {isHi ? service.titleHi : service.titleEn}
                    </h2>
                  </div>

                  {/* Price Tag Badge */}
                  <div className="shrink-0 text-right">
                    {isFree ? (
                      <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-300">
                        {isHi ? "निःशुल्क" : "FREE"}
                      </span>
                    ) : (
                      <div className="bg-amber-100 text-amber-900 px-3 py-1 rounded-2xl border border-amber-300 text-center">
                        <span className="text-xs font-mono font-bold block">₹{service.price}</span>
                        <span className="text-[9px] text-stone-500 block">{isHi ? "प्रति व्यक्ति" : "per person"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-stone-600 line-clamp-3 leading-relaxed">
                  {isHi ? service.descriptionHi : service.descriptionEn}
                </p>

                {/* Timings & Slots Metadata */}
                <div className="pt-2 border-t border-sandstone-200/80 space-y-1.5 text-xs text-stone-600">
                  {(service.timingHi || service.timingEn) && (
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gold-royal shrink-0" />
                      <span className="font-medium text-stone-800">
                        {isHi ? service.timingHi : service.timingEn}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-gold-royal shrink-0" />
                    <span>
                      {isHi
                        ? `${slotsCount} दैनिक समय स्लॉट उपलब्ध`
                        : `${slotsCount} daily slots configured`}
                    </span>
                  </div>

                  {service.capacity && service.capacity > 0 && (
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-gold-soft shrink-0" />
                      <span>
                        {isHi ? `प्रति स्लॉट क्षमता: ${service.capacity}` : `Slot Capacity: ${service.capacity}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Guidelines note */}
                {(service.guidelinesHi || service.guidelinesEn) && (
                  <div className="bg-cream-warm/70 p-2.5 rounded-xl text-[11px] text-stone-600 flex items-start gap-2 border border-sandstone-200/60">
                    <Info className="w-3.5 h-3.5 text-maroon-primary shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {isHi ? service.guidelinesHi : service.guidelinesEn}
                    </span>
                  </div>
                )}
              </div>

              {/* Card Action Footer */}
              <div className="p-6 pt-0">
                <Link
                  href={`/${locale}/booking/${service.slug}`}
                  className="w-full min-h-[46px] inline-flex items-center justify-center gap-2 rounded-xl text-xs sm:text-sm font-bold bg-maroon-deep hover:bg-maroon-primary text-cream-ivory shadow-sacred-sm hover:shadow-sacred-md transition-all group-hover:scale-[1.01]"
                >
                  <Calendar className="w-4 h-4 text-gold-soft" />
                  <span>{isHi ? "तारीख व समय स्लॉट चुनें" : "Select Date & Slot"}</span>
                  <ArrowRight className="w-4 h-4 text-gold-soft transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* 4. Need Assistance Box */}
      <div className="bg-gradient-to-r from-maroon-deep via-maroon-primary to-maroon-deep text-cream-ivory rounded-3xl p-6 sm:p-8 shadow-sacred-md border border-gold-royal/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center md:text-left">
          <h3 className="font-serif font-bold text-lg text-cream-ivory">
            {isHi ? "बुकिंग में सहायता अथवा समूह दर्शन?" : "Need Assistance with Group Bookings?"}
          </h3>
          <p className="text-xs text-sandstone-300">
            {isHi
              ? "श्री जोरावर धाम कार्यालय हेल्पडेस्क: प्रतिदिन प्रातः 06:00 बजे से रात्रि 09:00 बजे तक उपलब्ध"
              : "Shri Jorawar Dham Helpdesk: Available daily from 06:00 AM to 09:00 PM"}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href={`/${locale}/contact`}
            className="px-5 py-2.5 rounded-xl bg-gold-royal hover:bg-gold-soft text-maroon-deep text-xs font-bold font-serif shadow transition-all"
          >
            {isHi ? "संपर्क करें" : "Contact Helpdesk"}
          </Link>
          <Link
            href={`/${locale}/user`}
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-cream-ivory text-xs font-semibold border border-white/20 transition-all"
          >
            {isHi ? "मेरी बुकिंग्स देखें" : "View My Bookings"}
          </Link>
        </div>
      </div>
    </div>
  );
}
