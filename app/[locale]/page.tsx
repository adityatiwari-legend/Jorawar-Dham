import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale, getDictionary, localize, formatLocalizedDate } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import DevotionalHero from "@/components/public/DevotionalHero";
import LiveNoticeTicker from "@/components/public/LiveNoticeTicker";
import DarshanTimingsCard from "@/components/public/DarshanTimingsCard";
import EventCard from "@/components/public/EventCard";
import {
  BookOpen,
  Compass,
  ArrowRight,
  ShieldCheck,
  HeartHandshake,
  Flame,
  Sun,
  Camera,
  MapPin,
  Phone,
  Building2,
  Award,
  CheckCircle2,
  Clock,
  Home as HomeIcon,
} from "lucide-react";

export const revalidate = 60; // ISR 60 seconds

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";
  const dict = getDictionary(locale as Locale);

  // Parallel data fetching from PostgreSQL database
  const [notices, services, events, galleryItems, homePage] = await Promise.all([
    prisma.notice.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: [{ isPinned: "desc" }, { publishedAt: "desc" }],
      take: 5,
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: "asc" },
    }),
    prisma.event.findMany({
      where: { status: { in: ["UPCOMING", "ONGOING"] } },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.galleryItem.findMany({
      orderBy: { sortOrder: "asc" },
      take: 4,
      include: { category: true },
    }),
    prisma.page.findUnique({
      where: { slug: "home" },
      include: { sections: true },
    }),
  ]);

  const historySection = homePage?.sections.find((s) => s.sectionKey === "history_intro");

  return (
    <div className="space-y-12 sm:space-y-16 pb-20">
      {/* 1. Announcement Bar */}
      <LiveNoticeTicker notices={notices} locale={locale as Locale} />

      {/* 2 & 3. Hero (Communicates Jorawar Dham & आस्था • शक्ति • शांति) */}
      <DevotionalHero locale={locale as Locale} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20">
        {/* 4. Darshan & Aarti Timings Section (with Darshan CTA) */}
        <section id="darshan-timings" className="scroll-mt-24">
          <DarshanTimingsCard services={services} locale={locale as Locale} />
        </section>

        {/* 5. About Jorawar Dham */}
        <section className="bg-white rounded-3xl border border-sandstone-200 p-8 sm:p-12 shadow-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-3.5 py-1 rounded-full">
                <Sun className="w-3.5 h-3.5 text-saffron-600" />
                <span>{isHi ? "तीर्थ परिचय" : "Sanctuary Overview"}</span>
              </span>

              <h2 className="text-2xl sm:text-4xl font-bold text-maroon-950 font-serif leading-tight">
                {isHi ? "श्री जोरावर धाम तीर्थ — साधना और जन-कल्याण की तपोभूमि" : "Shri Jorawar Dham — Sanctuary of Penance & Seva"}
              </h2>

              <p className="text-stone-700 text-base sm:text-lg leading-relaxed">
                {isHi
                  ? "राजस्थान के पावन शेखावाटी अंचल में स्थित श्री जोरावर धाम एक अलौकिक आध्यात्मिक तीर्थ है। यहाँ आने वाले प्रत्येक श्रद्धालु को अद्भुत आत्मिक शांति और दिव्य ऊर्जा की अनुभूति होती है। धाम का संचालन पंजीकृत धर्मार्थ ट्रस्ट द्वारा निष्काम भाव से किया जाता है जहाँ जाति, वर्ण अथवा वर्ग के किसी भी भेदभाव के बिना सभी भक्तों के लिए प्रवेश व दर्शन पूर्णतः निःशुल्क हैं।"
                  : "Located in the sacred Shekhawati region of Rajasthan, Shri Jorawar Dham is a revered spiritual pilgrimage sanctuary. Administered by a registered charitable trust, it offers unconditional refuge and free public darshan to all pilgrims transcending social barriers."}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200 text-center">
                  <span className="block text-xl sm:text-2xl font-bold font-serif text-maroon-900">100%</span>
                  <span className="text-xs text-stone-600 font-medium">{isHi ? "निःशुल्क दर्शन" : "Free Public Darshan"}</span>
                </div>
                <div className="bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200 text-center">
                  <span className="block text-xl sm:text-2xl font-bold font-serif text-saffron-700">365 {isHi ? "दिन" : "Days"}</span>
                  <span className="text-xs text-stone-600 font-medium">{isHi ? "नित्य अन्नक्षेत्र सेवा" : "Daily Free Meals"}</span>
                </div>
                <div className="bg-sandstone-50 p-4 rounded-2xl border border-sandstone-200 text-center">
                  <span className="block text-xl sm:text-2xl font-bold font-serif text-emerald-800">80G</span>
                  <span className="text-xs text-stone-600 font-medium">{isHi ? "आयकर छूट पंजीकृत" : "Tax Exempt Registered"}</span>
                </div>
              </div>

              <div className="pt-2">
                <Link
                  href={`/${locale}/about`}
                  className="inline-flex items-center gap-2 text-maroon-900 font-bold hover:text-saffron-700 transition-colors text-sm sm:text-base group"
                >
                  <span>{isHi ? "धाम का संपूर्ण परिचय पढ़ें" : "Learn More About Jorawar Dham"}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>

            <div className="lg:col-span-5 bg-sandstone-100/80 rounded-2xl p-6 border border-sandstone-300 space-y-4">
              <div className="aspect-[4/3] rounded-xl overflow-hidden shadow-inner bg-sandstone-200">
                <img
                  src="/images/temple-mandap.jpg"
                  alt="Shri Jorawar Dham Mandap"
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-bold text-saffron-800 uppercase tracking-wider block">
                  {isHi ? "तीर्थ स्थल" : "Pilgrimage Sanctum"}
                </span>
                <p className="text-xs text-stone-600">
                  {isHi ? "चूरू ज़िला, शेखावाटी, राजस्थान (भारत)" : "Churu District, Shekhawati, Rajasthan (India)"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Bhagwan Jorawar Story */}
        <section className="bg-gradient-to-br from-maroon-950 via-maroon-900 to-saffron-950 rounded-3xl text-white p-8 sm:p-12 shadow-devotional-lg relative overflow-hidden border border-gold-500/30">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />
          <div className="relative max-w-4xl space-y-6">
            <span className="inline-flex items-center gap-2 bg-gold-500/20 text-gold-300 px-3.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-gold-500/30">
              <Flame className="w-3.5 h-3.5 text-gold-400" />
              <span>{isHi ? "पावन प्राकट्य एवं तपोगाथा" : "Sacred Descent & Penance"}</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-bold font-serif leading-snug text-gold-200">
              {isHi
                ? "भगवान जोरावर जी महाराज का दिव्य जीवन एवं अखंड धूणा"
                : "The Divine Narrative of Bhagwan Jorawar & Akhand Dhoona"}
            </h2>

            <p className="text-sandstone-200 text-base sm:text-lg leading-relaxed font-light">
              {isHi
                ? "मरुभूमि की तप्त धरा पर कठोर तपस्या कर परम पूज्य महाराज श्री ने लोक-कल्याण और आत्म-साक्षात्कार का अमर मार्ग प्रशस्त किया। धाम में युगों से अहर्निश प्रज्वलित 'अखंड धूणा' उसी असीम तपोबल का जीवंत प्रमाण है। इस पवित्र धूणे की भस्म (विभूति) को श्रद्धालु समस्त व्याधियों और कष्टों से मुक्ति का कवच मानते हैं।"
                : "Through intense spiritual penance amidst Rajasthan's arid desert, Param Pujya Maharaj consecrated this ground for universal welfare. The eternal flame (Akhand Dhoona) lit by him burns continuously to this day, whose sanctified ash (Vibhuti) brings peace, relief, and divine protection to countless devotees."}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/bhagwan-jorawar`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md transition-all text-sm"
              >
                <span>{isHi ? "महाराज श्री का संपूर्ण जीवन चरित्र" : "Read Full Divine Life Story"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/history`}
                className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-xl border border-white/20 backdrop-blur-sm transition-all text-sm"
              >
                <BookOpen className="w-4 h-4 text-gold-400" />
                <span>{isHi ? "धाम का इतिहास" : "Dham History"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Services (Database-Driven) */}
        <section className="space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 block mb-1">
                {isHi ? "पूजा व सेवा प्रकल्प" : "Pooja & Seva Offerings"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                {isHi ? "धाम में संचालित प्रमुख सेवा प्रकल्प" : "Sacred Offerings & Community Seva"}
              </h2>
            </div>
            <Link
              href={`/${locale}/seva`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-900 hover:text-saffron-700 transition-colors shrink-0"
            >
              <span>{isHi ? "समस्त सेवा प्रकल्प देखें" : "View All Offerings"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.slice(0, 3).map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-2xl border border-sandstone-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div className="relative aspect-[16/9] bg-sandstone-100 overflow-hidden">
                  <img
                    src={service.imageUrl || "/images/temple-placeholder.jpg"}
                    alt={isHi ? service.titleHi : service.titleEn}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    {service.price !== null && service.price > 0 ? (
                      <span className="text-xs font-bold bg-maroon-900 text-gold-300 px-2.5 py-1 rounded-full shadow">
                        ₹{service.price}
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-emerald-700 text-white px-2.5 py-1 rounded-full shadow">
                        {isHi ? "निःशुल्क" : "Complimentary"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="text-lg font-bold text-maroon-950 font-serif line-clamp-1">
                      {service.titleHi}
                    </h3>
                    <p className="text-xs text-saffron-700 font-medium line-clamp-1 mb-2">
                      {service.titleEn}
                    </p>
                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {isHi ? service.descriptionHi : service.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-sandstone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">
                      {isHi ? service.availabilityHi || "नित्य उपलब्ध" : service.availabilityEn || "Daily Open"}
                    </span>
                    <Link
                      href={`/${locale}/seva`}
                      className="text-saffron-700 hover:text-saffron-800 font-semibold inline-flex items-center gap-1"
                    >
                      <span>{isHi ? "विवरण" : "Details"}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Upcoming Events (Dynamic from Database) */}
        {events.length > 0 && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 block mb-1">
                  {dict.events.title}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                  {dict.events.subtitle}
                </h2>
              </div>
              <Link
                href={`/${locale}/events`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-900 hover:text-saffron-700 transition-colors shrink-0"
              >
                <span>{dict.events.viewAll}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} locale={locale as Locale} />
              ))}
            </div>
          </section>
        )}

        {/* 9. Gallery Preview (Database-Driven) */}
        {galleryItems.length > 0 && (
          <section className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-saffron-700 block mb-1">
                  {isHi ? "चित्र दीर्घा" : "Sacred Gallery"}
                </span>
                <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
                  {isHi ? "धाम के दिव्य स्वरूप एवं मनोरम दर्शन" : "Visual Darshan of Shri Jorawar Dham"}
                </h2>
              </div>
              <Link
                href={`/${locale}/gallery`}
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-maroon-900 hover:text-saffron-700 transition-colors shrink-0"
              >
                <Camera className="w-4 h-4 text-saffron-600" />
                <span>{isHi ? "समस्त चित्र देखें" : "View All Photos"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {galleryItems.map((photo) => (
                <Link
                  key={photo.id}
                  href={`/${locale}/gallery`}
                  className="group relative aspect-square bg-sandstone-100 rounded-2xl overflow-hidden border border-sandstone-200 shadow-sm hover:shadow-md transition-shadow"
                >
                  <img
                    src={photo.fileUrl}
                    alt={isHi ? photo.titleHi || "श्री जोरावर धाम" : photo.titleEn || "Shri Jorawar Dham"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3 text-white text-xs font-medium">
                    <span className="line-clamp-1">{isHi ? photo.titleHi : photo.titleEn}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 10. Visit Information Highlights */}
        <section className="bg-sandstone-100/80 rounded-3xl p-8 sm:p-12 border border-sandstone-300 space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700">
              <Compass className="w-4 h-4" />
              <span>{isHi ? "तीर्थयात्रा नियोजन" : "Pilgrim Logistics"}</span>
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-maroon-950 font-serif">
              {isHi ? "धाम आगमन, आवास (धर्मशाला) एवं सुगम मार्ग" : "Plan Your Visit: Transit, Dharamshala & Facilities"}
            </h2>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              {isHi
                ? "चूरू रेलवे स्टेशन एवं राष्ट्रीय राजमार्गों से सुगम संपर्क, 150+ कक्षों की स्वच्छ धर्मशाला, निःशुल्क वाहन पार्किंग एवं अन्नक्षेत्र भोजन व्यवस्था।"
                : "Seamless connectivity via Churu railway junction and national highways, clean 150+ room Dharamshala, and complimentary community meals."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-sandstone-200 space-y-2">
              <Compass className="w-6 h-6 text-saffron-600" />
              <h3 className="font-bold text-stone-900 font-serif">{isHi ? "सुगम रेल व सड़क मार्ग" : "By Rail & Road"}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isHi
                  ? "चूरू जंक्शन एवं सादुलपुर रेलवे स्टेशन से नियमित टैक्सियाँ उपलब्ध। NH-52 एवं NH-11 से सीधा सड़क मार्ग।"
                  : "Frequent taxis from Churu and Sadulpur junctions; direct national highway routes from Jaipur and Delhi."}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-sandstone-200 space-y-2">
              <HomeIcon className="w-6 h-6 text-amber-600" />
              <h3 className="font-bold text-stone-900 font-serif">{isHi ? "धर्मशाला आवास" : "Trust Dharamshala"}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isHi
                  ? "पारिवारिक एसी व गैर-एसी कक्ष मात्र नाममात्र रख-रखाव सहयोग राशि पर आगमन पर उपलब्ध।"
                  : "Clean AC and Non-AC family rooms allocated on arrival at nominal maintenance charges."}
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-sandstone-200 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600" />
              <h3 className="font-bold text-stone-900 font-serif">{isHi ? "दिव्यांग व वरिष्ठ सहायता" : "Senior & Accessibility"}</h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isHi
                  ? "गर्भगृह तक व्हीलचेयर रैंप, वरिष्ठ नागरिकों के लिए प्राथमिकता कतार एवं 24 घंटे प्राथमिक स्वास्थ्य केंद्र।"
                  : "Wheelchair access ramps, priority queues for seniors (65+), and 24-hour first aid dispensary."}
              </p>
            </div>
          </div>

          <div>
            <Link
              href={`/${locale}/visitor-info`}
              className="inline-flex items-center gap-2 bg-maroon-900 hover:bg-maroon-800 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors shadow-sm"
            >
              <span>{isHi ? "संपूर्ण यात्री संदर्शिका पढ़ें" : "Read Complete Visitor Guide"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 11. Donation CTA Section (Trust Transparency & 80G Tax Exemption) */}
        <section className="bg-white rounded-3xl border-2 border-sandstone-200 p-8 sm:p-12 shadow-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3.5 py-1 rounded-full font-semibold border border-emerald-200">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isHi ? "80G आयकर छूट पंजीकृत धर्मार्थ ट्रस्ट" : "Section 80G Tax Exemption Registered"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-maroon-950 font-serif">
                {isHi ? "अन्नदान एवं गोसेवा में भागीदार बनें" : "Support Our Annakshetra & Gaushala Seva"}
              </h2>
              <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
                {isHi
                  ? "श्री जोरावर धाम में संचालित नित्य अन्नक्षेत्र, कामधेनु गोशाला एवं निःशुल्क चिकित्सा प्रकल्पों हेतु आपका स्वैच्छिक सहयोग सादर प्रार्थनीय है। सभी दान आधिकारिक ट्रस्ट बैंक खातों (SBI / PNB) में ही स्वीकार किए जाते हैं।"
                  : "Your voluntary contributions support free daily meals for hundreds of pilgrims, cow sanctuary welfare, and free medical dispensaries. Official donations are accepted strictly via registered Trust bank accounts."}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${locale}/donation`}
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-saffron-500 to-amber-600 hover:from-saffron-600 hover:to-amber-700 text-white px-7 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all"
              >
                <HeartHandshake className="w-4 h-4" />
                <span>{isHi ? "अधिकृत बैंक विवरण देखें" : "View Bank Account Details"}</span>
              </Link>
              <Link
                href={`/${locale}/faq`}
                className="inline-flex items-center justify-center gap-2 bg-sandstone-100 hover:bg-sandstone-200 text-stone-800 px-6 py-3.5 rounded-xl font-semibold text-sm border border-sandstone-300 transition-colors"
              >
                <span>{isHi ? "दान संबंधी प्रश्न (FAQ)" : "Donation FAQ"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 12. Contact / Location Section */}
        <section className="bg-maroon-950 text-white rounded-3xl p-8 sm:p-12 shadow-lg space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs text-gold-300 font-semibold uppercase tracking-wider block">
                {isHi ? "तीर्थ ट्रस्ट कार्यालय" : "Official Trust Contact"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold font-serif text-white">
                {isHi ? "श्री जोरावर धाम संपर्क एवं सहायता केंद्र" : "Get in Touch with Shri Jorawar Dham Trust"}
              </h2>
              <p className="text-sandstone-300 text-sm leading-relaxed max-w-xl">
                {isHi
                  ? "तीर्थ यात्रा, धर्मशाला पूछताछ अथवा दर्शन व्यवस्था से संबंधित किसी भी जानकारी हेतु हमारे 24 घंटे सक्रिय सहायता केंद्र से संपर्क करें।"
                  : "For inquiries regarding pilgrimage planning, dharamshala booking queries, or seva arrangements, contact our 24/7 helpline."}
              </p>

              <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-sandstone-200">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-saffron-400 shrink-0 mt-0.5" />
                  <span>{dict.footer.address}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span><strong>{isHi ? "24x7 हेल्पलाइन:" : "24/7 Helpline:"}</strong> +91-98765-43210</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-4 justify-lg-end">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex items-center justify-center gap-2 bg-white hover:bg-sandstone-100 text-maroon-950 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all text-center"
              >
                <span>{isHi ? "संपर्क पृष्ठ एवं संदेश प्रेषण" : "Contact Page & Inquiry"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/faq`}
                className="inline-flex items-center justify-center gap-2 bg-maroon-900 hover:bg-maroon-800 text-white px-6 py-3.5 rounded-xl font-semibold text-sm border border-maroon-700 transition-all text-center"
              >
                <span>{isHi ? "प्रश्नोत्तरी (FAQ)" : "View FAQ"}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
