import Link from "next/link";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale, getDictionary, localize, formatLocalizedDate } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import DevotionalHero from "@/components/public/DevotionalHero";
import LiveNoticeTicker from "@/components/public/LiveNoticeTicker";
import DarshanTimingsCard from "@/components/public/DarshanTimingsCard";
import EventCard from "@/components/public/EventCard";
import QuickActionCard from "@/components/public/QuickActionCard";
import SectionHeader from "@/components/public/SectionHeader";
import SacredDivider from "@/components/public/SacredDivider";
import {
  Calendar,
  Flame,
  Compass,
  HeartHandshake,
  Sparkles,
  Camera,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Award,
  ArrowRight,
  Sun,
  Home as HomeIcon,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { siteConfig } from "@/lib/content/site";

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

  // Parallel database query
  const [notices, services, events, galleryItems] = await Promise.all([
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
  ]);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. Announcement Bar */}
      <LiveNoticeTicker notices={notices} locale={locale as Locale} />

      {/* 2. Cinematic Devotional Hero */}
      <DevotionalHero locale={locale as Locale} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 sm:space-y-28">
        {/* 3. Darshan & Aarti Timings Section */}
        <section id="darshan-timings" className="scroll-mt-28">
          <DarshanTimingsCard services={services} locale={locale as Locale} />
        </section>

        {/* 4. Quick Actions Grid (6 Sacred Cards) */}
        <section className="space-y-8">
          <SectionHeader
            eyebrow={isHi ? "तीर्थ सेवाएं" : "Sacred Facilities"}
            title={isHi ? "तीर्थयात्री त्वरित सेवाएं" : "Pilgrim Quick Access"}
            subtitle={
              isHi
                ? "दर्शन, पूजा, आवास एवं दान हेतु त्वरित सुविधाएं"
                : "Fast access to darshan booking, rituals, dharamshala, and charitable contributions"
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <QuickActionCard
              href={`/${locale}/darshan`}
              icon={Calendar}
              title={isHi ? "दर्शन व्यवस्था" : "Darshan Timings"}
              description={
                isHi
                  ? "नित्य प्रातः एवं सायं कालीन दर्शन समय एवं नियमों की जानकारी"
                  : "Daily morning and evening darshan schedule, guidelines, and access"
              }
              badge={isHi ? "निःशुल्क" : "Free"}
            />
            <QuickActionCard
              href={`/${locale}/seva`}
              icon={Flame}
              title={isHi ? "पूजा एवं सेवा" : "Pooja & Seva"}
              description={
                isHi
                  ? "अखंड धूणा, विशेष अनुष्ठान एवं भोग अर्पण सेवा विवरण"
                  : "Akhand Dhoona rituals, special havan, and sacred offerings"
              }
            />
            <QuickActionCard
              href={`/${locale}/visitor-info`}
              icon={Compass}
              title={isHi ? "यात्री सूचना व आवास" : "Visitor Logistics"}
              description={
                isHi
                  ? "धर्मशाला आवास, सुगम रेल/सड़क मार्ग एवं भोजन व्यवस्था"
                  : "Trust dharamshala stay, transport connectivity, and pilgrim amenities"
              }
            />
            <QuickActionCard
              href={`/${locale}/donation`}
              icon={HeartHandshake}
              title={isHi ? "दान एवं 80G छूट" : "Donation & 80G"}
              description={
                isHi
                  ? "अन्नक्षेत्र, गोसेवा एवं धर्मार्थ ट्रस्ट के आधिकारिक बैंक खाते"
                  : "Support daily meals, cow welfare, and tax-exempt charitable initiatives"
              }
              badge="80G"
            />
            <QuickActionCard
              href={`/${locale}/events`}
              icon={Sparkles}
              title={isHi ? "उत्सव व मेले" : "Festivals & Melas"}
              description={
                isHi
                  ? "वार्षिक पाटोत्सव, पूर्णिमा मेला एवं आगामी धार्मिक आयोजन"
                  : "Annual Patotsav, Purnima congregations, and festive schedule"
              }
            />
            <QuickActionCard
              href={`/${locale}/gallery`}
              icon={Camera}
              title={isHi ? "चित्र दीर्घा" : "Sacred Gallery"}
              description={
                isHi
                  ? "धाम के भव्य स्वरूप, गर्भगृह व पावन आयोजनों की अलौकिक छवियां"
                  : "Visual glimpses of the sanctum, temple architecture, and celebrations"
              }
            />
          </div>
        </section>

        {/* 5. About / Spiritual Experience (Official Section 6: परिचय) */}
        <section className="bg-cream-ivory rounded-3xl border border-sandstone-200/90 p-8 sm:p-12 lg:p-16 shadow-sacred-sm relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left: Temple Architecture Imagery */}
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden shadow-sacred-md border border-gold-royal/30 aspect-[4/3] group">
              <img
                src="/images/temple-courtyard.jpg"
                alt="सिद्ध श्री जोरावर धाम प्रांगण"
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/70 via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-cream-ivory">
                <span className="font-serif font-semibold text-xs drop-shadow">
                  {isHi ? "सिद्ध श्री जोरावर धाम पावन प्रांगण" : "Shri Jorawar Dham Sanctum"}
                </span>
                <span className="text-[10px] text-gold-soft bg-maroon-deep/80 px-2.5 py-1 rounded-full border border-gold-royal/40">
                  {isHi ? "चितौरा, धौलपुर (राजस्थान)" : "Chitaura, Dholpur (Raj.)"}
                </span>
              </div>
            </div>

            {/* Right: Editorial Narrative & Official Parichay */}
            <div className="lg:col-span-7 space-y-6">
              <div className="space-y-2">
                <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal block">
                  {isHi ? "धाम परिचय" : "Sanctuary Introduction"}
                </span>
                <h2 className="text-2xl sm:text-4xl font-serif font-bold text-maroon-deep leading-tight">
                  {isHi
                    ? "भगवान जोरावर धाम — आस्था, शक्ति और शांति का पावन तीर्थ"
                    : "Shri Jorawar Dham — Sacred Sanctuary of Faith, Power & Peace"}
                </h2>
              </div>

              <div className="space-y-3 text-stone-700 text-sm sm:text-base leading-relaxed font-light">
                <p>
                  {isHi
                    ? "भगवान जोरावर धाम आस्था, शक्ति और शांति का एक ऐसा पवित्र केंद्र है जहाँ भगवान जोरावर के प्रति श्रद्धालुओं की अटूट आस्था जुड़ी है। राजस्थान के ऐतिहासिक धौलपुर जिले के अंतर्गत चितौरा गांव में स्थित यह पावन धाम आध्यात्मिक ऊर्जा और प्राकृतिक सौंदर्य से परिपूर्ण है।"
                    : "Shri Jorawar Dham is a sacred epicenter of divine faith, spiritual power, and serene tranquility. Located in Chitaura village within the historic Dholpur district of Rajasthan, this sanctuary resonates with profound spiritual energy and peaceful rural beauty."}
                </p>
                <p className="text-xs sm:text-sm text-stone-600">
                  {isHi
                    ? "करीब 130 वर्ष पूर्व अवतरित भगवान जोरावर जी ने गृहस्थ जीवन में रहते हुए भी त्याग, कठोर साधना और जन-कल्याण का अनुपम आदर्श स्थापित किया। धाम का संचालन 'सिद्ध श्री जोरावर धाम सेवा समिति' (पंजी. COOP/2023/DHOLPUR/201054) द्वारा पूर्ण निष्ठा व पारदर्शी सेवा भाव से किया जाता है।"
                    : "Incarnated approximately 130 years ago, Bhagwan Jorawar demonstrated how spiritual attainment and dedicated community welfare harmonize within daily life. The sanctuary is lovingly administered by Siddh Shri Jorawar Dham Seva Samiti."}
                </p>
              </div>

              {/* 3 Trust Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
                <div className="bg-cream-warm p-4 rounded-xl border border-sandstone-200 text-center">
                  <span className="block text-2xl font-serif font-bold text-maroon-deep">100%</span>
                  <span className="text-xs text-mutedText font-medium">
                    {isHi ? "निःशुल्क सार्वजनिक दर्शन" : "Free Public Darshan"}
                  </span>
                </div>
                <div className="bg-cream-warm p-4 rounded-xl border border-sandstone-200 text-center">
                  <span className="block text-2xl font-serif font-bold text-maroon-primary">~130 {isHi ? "वर्ष" : "Years"}</span>
                  <span className="text-xs text-mutedText font-medium">
                    {isHi ? "प्राचीन पावन परंपरा" : "Sacred Spiritual Legacy"}
                  </span>
                </div>
                <div className="bg-cream-warm p-4 rounded-xl border border-sandstone-200 text-center">
                  <span className="block text-2xl font-serif font-bold text-emerald-800">COOP</span>
                  <span className="text-xs text-mutedText font-medium">
                    {isHi ? "धौलपुर पंजीकृत समिति" : "Registered Samiti"}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link
                  href={`/${locale}/about`}
                  className="inline-flex items-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory px-5 py-2.5 rounded-xl font-serif font-semibold text-xs sm:text-sm transition-colors shadow-sacred-sm"
                >
                  <span>{isHi ? "विस्तृत परिचय एवं उद्देश्य पढ़ें" : "Read Full About & Purpose"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href={`/${locale}/history`}
                  className="inline-flex items-center gap-2 text-maroon-deep font-serif font-bold hover:text-gold-royal transition-colors text-xs sm:text-sm group"
                >
                  <span>{isHi ? "धाम का संपूर्ण इतिहास" : "Explore Dham History"}</span>
                  <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Section 14: मुख्य आकर्षण (Main Attractions Showcase) */}
        <section className="space-y-8">
          <SectionHeader
            eyebrow={isHi ? "दिव्य अनुभव" : "Divine Highlights"}
            title={isHi ? "धाम के मुख्य आकर्षण" : "Main Attractions of the Dham"}
            subtitle={
              isHi
                ? "भव्य मंदिर परिसर, सुरम्य प्राकृतिक वातावरण, नित्य पावन अनुष्ठान एवं वार्षिक तीज मेला"
                : "Explore the proposed grand temple, peaceful rural surroundings, devotional rituals, and the annual Holi-Teej fair"
            }
            actionHref={`/${locale}/attraction-point`}
            actionText={isHi ? "समस्त मुख्य आकर्षण देखें" : "View All Attractions"}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {siteConfig.attractionPoints.map((point) => (
              <Link
                key={point.id}
                href={`/${locale}/attraction-point`}
                className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-gold-royal/10 border border-gold-royal/30 flex items-center justify-center text-maroon-deep font-serif font-bold text-sm">
                    {point.id === "mandir-parisar" && "🏛️"}
                    {point.id === "prakritik-vatavaran" && "🌿"}
                    {point.id === "vishesh-puja" && "🪔"}
                    {point.id === "varshik-mela" && "🎪"}
                  </div>
                  <h3 className="font-serif font-bold text-maroon-deep text-lg group-hover:text-gold-royal transition-colors">
                    {isHi ? point.titleHi : point.titleEn}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed font-light line-clamp-3">
                    {point.descHi}
                  </p>
                </div>
                <div className="pt-4 mt-2 border-t border-sandstone-100 flex items-center text-xs font-serif font-semibold text-gold-royal group-hover:text-maroon-deep">
                  <span>{isHi ? "विस्तार से जानें" : "Learn More"}</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 6B. Bhagwan Jorawar Story & Samadhi (Section 11 & 12) */}
        <section className="sacred-gradient-card rounded-3xl text-cream-ivory p-8 sm:p-12 lg:p-16 shadow-devotional-lg relative overflow-hidden border border-gold-royal/30">
          <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#D4A72C_1px,transparent_1px)] [background-size:24px_24px]" />
          
          <div className="relative max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 bg-gold-royal/20 text-gold-soft px-3.5 py-1.5 rounded-full text-xs font-serif font-semibold uppercase tracking-wider border border-gold-royal/40">
              <Flame className="w-3.5 h-3.5 text-gold-royal" />
              <span>{isHi ? "पावन अवतरण एवं महासमाधि" : "Sacred Incarnation & Mahasamadhi"}</span>
            </span>

            <h2 className="text-2xl sm:text-4xl font-serif font-bold leading-snug text-cream-ivory">
              {isHi
                ? "भगवान जोरावर जी महाराज का पावन जीवन एवं महासमाधि"
                : "The Divine Life & Mahasamadhi of Bhagwan Jorawar"}
            </h2>

            <div className="text-sandstone-200/95 text-sm sm:text-base leading-relaxed font-light space-y-3">
              <p>
                {isHi
                  ? "चितौरा की पवित्र धरा पर करीब 130 वर्ष पूर्व अवतरित भगवान जोरावर जी ने जन-कल्याण और लोक-कल्याण हेतु अपना संपूर्ण जीवन समर्पित किया। अपने लौकिक दायित्वों को पूर्ण कर महाराज श्री ने 24 मार्च 1962 को दोपहर ठीक 12:00 बजे सप्तदीप के साक्षी में महासमाधि ली।"
                  : "Incarnated approximately 130 years ago in Chitaura, Bhagwan Jorawar dedicated his entire worldly life to spiritual elevation and welfare. He attained Mahasamadhi on 24 March 1962 at precisely 12:00 PM in the presence of Saptdeep."}
              </p>
              <p className="text-xs sm:text-sm text-sandstone-300">
                {isHi
                  ? "आज भी धाम में आने वाले श्रद्धालुओं को अलौकिक मानसिक शांति और कष्ट-निवारण की अनुभूति होती है। प्रतिवर्ष होली के पश्चात तृतीया (तीज) को धाम में विशाल मेला आयोजित होता है।"
                  : "To this day, devotees experience divine inner tranquility and solace here. The grand annual fair is held every year on the Tritiya (Teej) following Holi."}
              </p>
            </div>

            <SacredDivider variant="gold" className="my-2" />

            <div className="pt-2 flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/history`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep font-serif font-bold px-6 py-3 rounded-xl shadow-sacred-sm transition-all text-xs sm:text-sm border border-gold-royal/40"
              >
                <BookOpen className="w-4 h-4 text-maroon-deep" />
                <span>{isHi ? "संपूर्ण 8 अध्यायों का इतिहास पढ़ें" : "Read Full 8 Chapters"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/how-to-reach`}
                className="inline-flex items-center gap-2 bg-cream-ivory/10 hover:bg-cream-ivory/20 text-cream-ivory font-serif font-semibold px-6 py-3 rounded-xl border border-cream-ivory/20 backdrop-blur-sm transition-all text-xs sm:text-sm"
              >
                <Compass className="w-4 h-4 text-gold-soft" />
                <span>{isHi ? "धाम कैसे पहुंचे एवं दूरियां" : "How to Reach & Distances"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 7. Services (Pooja & Seva Offerings from Database) */}
        <section className="space-y-8">
          <SectionHeader
            eyebrow={isHi ? "पूजा व सेवा प्रकल्प" : "Pooja & Seva"}
            title={isHi ? "धाम में संचालित प्रमुख सेवा प्रकल्प" : "Sacred Offerings & Community Seva"}
            subtitle={
              isHi
                ? "श्रद्धालुओं की सुविधा हेतु नित्य पूजा, अनुष्ठान एवं अन्नदान सेवा"
                : "Devotional rituals, specialized havan, and community meal sponsorships"
            }
            actionHref={`/${locale}/seva`}
            actionText={isHi ? "समस्त सेवा प्रकल्प देखें" : "View All Offerings"}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {services.slice(0, 3).map((service) => (
              <div
                key={service.id}
                className="bg-cream-ivory rounded-2xl border border-sandstone-200 overflow-hidden shadow-sacred-sm hover:shadow-sacred-md transition-shadow flex flex-col justify-between subtle-lift"
              >
                <div className="relative aspect-[16/9] bg-gradient-to-br from-maroon-deep to-maroon-wine overflow-hidden flex items-center justify-center">
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
                        className="w-14 h-14 rounded-full object-contain border border-gold-royal/50 shadow-md mb-1.5 bg-maroon-deep p-1"
                      />
                      <span className="text-[11px] text-gold-soft font-serif font-semibold">सिद्ध श्री जोरावर धाम</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {service.price !== null && service.price > 0 ? (
                      <span className="text-xs font-bold bg-maroon-deep text-gold-soft px-3 py-1 rounded-full shadow border border-gold-royal/30 font-mono">
                        ₹{service.price}
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-emerald-800 text-cream-ivory px-3 py-1 rounded-full shadow">
                        {isHi ? "निःशुल्क" : "Complimentary"}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="text-lg font-serif font-bold text-maroon-deep line-clamp-1">
                      {service.titleHi}
                    </h3>
                    <p className="text-xs text-maroon-primary font-medium line-clamp-1 mb-2">
                      {service.titleEn}
                    </p>
                    <p className="text-xs text-mutedText line-clamp-2 leading-relaxed font-light">
                      {isHi ? service.descriptionHi : service.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-sandstone-100 flex items-center justify-between text-xs">
                    <span className="text-stone-500 font-medium">
                      {isHi ? service.availabilityHi || "नित्य उपलब्ध" : service.availabilityEn || "Daily Open"}
                    </span>
                    <Link
                      href={`/${locale}/seva`}
                      className="text-gold-royal hover:text-maroon-deep font-serif font-bold inline-flex items-center gap-1"
                    >
                      <span>{isHi ? "विवरण व बुकिंग" : "Details & Book"}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 8. Conversion Banner (Darshan / Booking CTA) */}
        <section className="bg-cream-warm rounded-3xl border border-gold-royal/40 p-8 sm:p-12 shadow-sacred-md relative overflow-hidden text-center space-y-5">
          <div className="max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-serif font-bold uppercase tracking-widest text-gold-royal block">
              {isHi ? "तीर्थयात्रा नियोजन" : "Pilgrimage Planning"}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
              {isHi ? "आपकी यात्रा, आपकी श्रद्धा, आपका अनुभव" : "Your Journey, Your Faith, Your Divine Experience"}
            </h2>
            <p className="text-xs sm:text-sm text-mutedText leading-relaxed">
              {isHi
                ? "दर्शन एवं विशेष सेवा हेतु अपनी यात्रा की अग्रिम योजना बनाएं। समस्त दर्शन पूर्णतः निःशुल्क हैं।"
                : "Plan your sacred visit for darshan, aarti, and seva. Public darshan is open and free to all."}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href={`/${locale}/darshan`}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory px-7 py-3 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm transition-all subtle-lift border border-gold-royal/30"
            >
              <Calendar className="w-4 h-4 text-gold-soft" />
              <span>{isHi ? "दर्शन समय व नियम" : "View Darshan Guidelines"}</span>
            </Link>
            <Link
              href={`/${locale}/auth/login`}
              className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep px-7 py-3 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm transition-all subtle-lift border border-gold-royal/30"
            >
              <Sparkles className="w-4 h-4 text-maroon-deep" />
              <span>{isHi ? "श्रद्धालु सेवा पोर्टल" : "Devotee Portal"}</span>
            </Link>
          </div>
        </section>

        {/* 9. Upcoming Events & Festivals */}
        {events.length > 0 && (
          <section className="space-y-8">
            <SectionHeader
              eyebrow={isHi ? "उत्सव एवं पर्व" : "Festivals"}
              title={dict.events.subtitle}
              subtitle={
                isHi
                  ? "धाम में आगामी धार्मिक अनुष्ठान, मेले एवं पाटोत्सव"
                  : "Upcoming religious celebrations, congregations, and special rituals"
              }
              actionHref={`/${locale}/events`}
              actionText={dict.events.viewAll}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {events.map((event) => (
                <EventCard key={event.id} event={event} locale={locale as Locale} />
              ))}
            </div>
          </section>
        )}

        {/* 10. Gallery (Editorial Masonry-Style Layout) */}
        {galleryItems.length > 0 && (
          <section className="space-y-8">
            <SectionHeader
              eyebrow={isHi ? "चित्र दीर्घा" : "Sacred Gallery"}
              title={isHi ? "धाम के दिव्य स्वरूप एवं मनोरम दर्शन" : "Visual Darshan of Shri Jorawar Dham"}
              subtitle={
                isHi
                  ? "धाम की पवित्र वास्तुकला, गर्भगृह दर्शन एवं पावन धार्मिक आयोजनों की झलकियां"
                  : "Sanctum aesthetics, temple architecture, and festival celebrations"
              }
              actionHref={`/${locale}/gallery`}
              actionText={isHi ? "सभी चित्र देखें" : "View All Photos"}
            />

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
              {galleryItems.map((photo, index) => {
                // Editorial layout: first item spans 2 rows on medium screens
                const isFeatured = index === 0;
                return (
                  <Link
                    key={photo.id}
                    href={`/${locale}/gallery`}
                    className={`group relative ${
                      isFeatured ? "col-span-2 row-span-2 aspect-[4/3] md:aspect-auto" : "aspect-square"
                    } bg-sandstone-100 rounded-2xl overflow-hidden border border-sandstone-200/90 shadow-sacred-sm hover:shadow-sacred-md transition-all subtle-lift`}
                  >
                    <img
                      src={photo.fileUrl}
                      alt={isHi ? photo.titleHi || "श्री जोरावर धाम" : photo.titleEn || "Shri Jorawar Dham"}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-maroon-deep/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4 text-cream-ivory text-xs font-serif font-semibold">
                      <span className="line-clamp-1">{isHi ? photo.titleHi : photo.titleEn}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* 11. Donation & Institutional Trust Section */}
        <section className="bg-cream-ivory rounded-3xl border-2 border-gold-royal/30 p-8 sm:p-12 lg:p-14 shadow-sacred-sm space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-800 text-xs px-3.5 py-1 rounded-full font-serif font-bold border border-emerald-200">
                <Award className="w-3.5 h-3.5 text-emerald-600" />
                <span>{isHi ? "80G आयकर छूट पंजीकृत धर्मार्थ ट्रस्ट" : "Section 80G Tax Exemption Registered"}</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-maroon-deep">
                {isHi ? "अन्नदान एवं गोसेवा में भागीदार बनें" : "Support Our Annakshetra & Gaushala Seva"}
              </h2>
              <p className="text-mutedText text-xs sm:text-sm leading-relaxed font-light">
                {isHi
                  ? "श्री जोरावर धाम में संचालित नित्य अन्नक्षेत्र, कामधेनु गोशाला एवं निःशुल्क चिकित्सा प्रकल्पों हेतु आपका स्वैच्छिक सहयोग सादर प्रार्थनीय है। सभी दान आधिकारिक ट्रस्ट बैंक खातों (SBI / PNB) में ही स्वीकार किए जाते हैं।"
                  : "Your voluntary contributions directly support free daily meals for hundreds of pilgrims, gaushala cow sanctuary, and public welfare. Official donations are accepted strictly via registered Trust bank accounts."}
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <Link
                href={`/${locale}/donation`}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft text-maroon-deep px-7 py-3 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm transition-all subtle-lift border border-gold-royal/40"
              >
                <HeartHandshake className="w-4 h-4 text-maroon-deep" />
                <span>{isHi ? "अधिकृत बैंक विवरण देखें" : "View Bank Details"}</span>
              </Link>
              <Link
                href={`/${locale}/faq`}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-cream-warm hover:bg-sandstone-200 text-maroon-deep px-6 py-3 rounded-xl font-serif font-semibold text-xs sm:text-sm border border-sandstone-300 transition-colors"
              >
                <span>{isHi ? "दान संबंधी प्रश्न (FAQ)" : "Donation FAQ"}</span>
              </Link>
            </div>
          </div>
        </section>

        {/* 12. Pilgrim Logistics Highlights (Official Section 18: यहाँ कैसे पहुंचे) */}
        <section className="bg-cream-warm rounded-3xl p-8 sm:p-12 border border-sandstone-200 space-y-8">
          <SectionHeader
            eyebrow={isHi ? "यात्री संदर्शिका" : "Visitor Logistics"}
            title={isHi ? "धाम आगमन एवं प्रमुख शहरों से दूरियां" : "How to Reach & Regional Connectivity"}
            subtitle={
              isHi
                ? "धौलपुर, खरोगढ़, आगरा, ग्वालियर एवं भरतपुर से सुगम सड़क व रेल संपर्क।"
                : "Smooth highway & rail connectivity from Dholpur, Kheragarh, Agra, Gwalior, and Bharatpur."
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200/80 space-y-2.5 shadow-sacred-sm">
              <div className="w-10 h-10 rounded-xl bg-gold-royal/10 border border-gold-royal/30 flex items-center justify-center text-gold-royal">
                <Compass className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-maroon-deep text-base">
                {isHi ? "समीपवर्ती प्रमुख केंद्र" : "Nearby City Distances"}
              </h3>
              <p className="text-xs text-mutedText leading-relaxed">
                {isHi
                  ? "धौलपुर (25 कि.मी.), खरोगढ़ (17 कि.मी.), आगरा (60 कि.मी.), ग्वालियर (90 कि.मी.), भरतपुर (75 कि.मी.) एवं करौली (105 कि.मी.)।"
                  : "Dholpur (25 km), Kheragarh (17 km), Agra (60 km), Gwalior (90 km), Bharatpur (75 km), and Karauli (105 km)."}
              </p>
            </div>

            <div className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200/80 space-y-2.5 shadow-sacred-sm">
              <div className="w-10 h-10 rounded-xl bg-maroon-deep/10 border border-maroon-deep/30 flex items-center justify-center text-maroon-deep">
                <HomeIcon className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-maroon-deep text-base">
                {isHi ? "दर्शन व विश्राम व्यवस्था" : "Darshan & Amenities"}
              </h3>
              <p className="text-xs text-mutedText leading-relaxed">
                {isHi
                  ? "भक्तों के लिए दर्शन कक्ष, विश्राम स्थल, ध्यान-साधना कक्ष और सुव्यवस्थित स्वच्छता व्यवस्था।"
                  : "Dedicated darshan halls, resting quarters, meditation spaces, and clean pilgrim amenities."}
              </p>
            </div>

            <div className="bg-cream-ivory p-6 rounded-2xl border border-sandstone-200/80 space-y-2.5 shadow-sacred-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif font-bold text-maroon-deep text-base">
                {isHi ? "श्रद्धालु मार्गदर्शन" : "Devotee Assistance"}
              </h3>
              <p className="text-xs text-mutedText leading-relaxed">
                {isHi
                  ? "ग्राम चितौरा (सैंपऊ, धौलपुर) स्थित धाम तक पहुंचने हेतु समिति द्वारा सतत मार्गदर्शन उपलब्ध।"
                  : "Continuous route guidance provided by the committee for reaching Village Chitaura, Saipau, Dholpur."}
              </p>
            </div>
          </div>

          <div>
            <Link
              href={`/${locale}/how-to-reach`}
              className="inline-flex items-center gap-2 bg-maroon-deep hover:bg-maroon-primary text-cream-ivory px-6 py-3 rounded-xl font-serif font-semibold text-xs sm:text-sm transition-colors shadow-sacred-sm border border-gold-royal/30"
            >
              <span>{isHi ? "संपूर्ण मार्ग एवं दर्शन समय देखें" : "View Route & Darshan Timetable"}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>

        {/* 13. Official Contact & Helpline Section */}
        <section className="bg-maroon-deep text-cream-ivory rounded-3xl p-8 sm:p-12 shadow-sacred-lg space-y-8 border border-gold-royal/30">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4">
              <span className="text-xs font-serif font-bold text-gold-royal uppercase tracking-widest block">
                {isHi ? "समिति संपर्क सूत्र" : "Official Contact Channels"}
              </span>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-cream-ivory">
                {isHi ? "सिद्ध श्री जोरावर धाम सेवा समिति" : "Siddh Shri Jorawar Dham Seva Samiti"}
              </h2>
              <p className="text-sandstone-300 text-xs sm:text-sm leading-relaxed max-w-xl font-light">
                {isHi
                  ? "तीर्थ यात्रा, दर्शन व्यवस्था, पूजा अथवा मंदिर निर्माण में सहयोग हेतु समिति के आधिकारिक दूरभाष व पते पर संपर्क करें।"
                  : "For pilgrimage, darshan arrangements, or temple construction support, reach out to our official numbers."}
              </p>

              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-sandstone-200">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-gold-soft shrink-0 mt-0.5" />
                  <span>{siteConfig.address.fullHi}</span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                    <a href="tel:+919530106218" className="hover:underline font-mono">
                      +91-9530106218
                    </a>
                    <span className="text-stone-400">/</span>
                    <a href="tel:+919530106219" className="hover:underline font-mono">
                      6219
                    </a>
                  </div>
                  <div className="flex items-center gap-2 text-stone-300">
                    <Mail className="w-4 h-4 text-gold-soft shrink-0" />
                    <a href="mailto:info@jorawardham.in" className="hover:underline font-mono">
                      info@jorawardham.in
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 flex flex-col sm:flex-row gap-3 justify-lg-end">
              <Link
                href={`/${locale}/contact`}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-cream-ivory hover:bg-cream-warm text-maroon-deep px-6 py-3 rounded-xl font-serif font-bold text-xs sm:text-sm shadow-sacred-sm transition-all text-center"
              >
                <span>{isHi ? "संपर्क पृष्ठ एवं संदेश भेजें" : "Contact & Message"}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href={`/${locale}/donation`}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 bg-maroon-primary hover:bg-maroon-wine text-cream-ivory px-6 py-3 rounded-xl font-serif font-semibold text-xs sm:text-sm border border-gold-royal/30 transition-all text-center"
              >
                <span>{isHi ? "मंदिर निर्माण में सहयोग" : "Support Construction"}</span>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
