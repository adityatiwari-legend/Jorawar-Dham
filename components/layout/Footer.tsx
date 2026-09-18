import Link from "next/link";
import { Phone, Mail, MapPin, ShieldCheck, Sparkles, Clock, HeartHandshake, ArrowRight } from "lucide-react";
import { Locale, getDictionary } from "@/lib/utils/i18n";
import SacredDivider from "@/components/public/SacredDivider";
import { siteConfig } from "@/lib/content/site";

interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale);
  const isHi = locale === "hi";

  return (
    <footer className="bg-maroon-deep text-cream-ivory border-t-2 border-gold-royal/40 mt-auto pb-16 lg:pb-0 overflow-hidden w-full max-w-full">
      {/* 1. Official Mantra Arch Strip */}
      <div className="bg-maroon-primary/60 py-3 px-4 text-center border-b border-gold-royal/20">
        <p className="text-gold-royal font-serif text-xs sm:text-sm tracking-widest uppercase font-bold">
          ॥ {siteConfig.mantra} ॥
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Column 1: Official Brand & Trust Overview */}
          <div className="space-y-4">
            <Link href={`/${locale}`} className="inline-block py-1">
              <img
                src="/branding/jorawar-dham-logo.png"
                alt="सिद्ध श्री जोरावर धाम सेवा समिति"
                className="h-14 sm:h-16 w-auto object-contain rounded-md"
              />
            </Link>
            <p className="text-xs text-sandstone-300 leading-relaxed font-light">
              {isHi
                ? "सिद्ध श्री जोरावर धाम, चितौरा (धौलपुर) — परम पूज्य भगवान जोरावर जी की तपोभूमि, जहाँ श्रद्धा, आत्मिक शांति और निष्काम सेवा का पावन संगम होता है।"
                : "Siddh Shri Jorawar Dham, Chitaura (Dholpur) — The revered sanctuary of Param Pujya Bhagwan Jorawar Ji Maharaj in Rajasthan."}
            </p>
            <div className="space-y-1.5 pt-1">
              <span className="inline-block text-[11px] font-mono text-gold-soft bg-maroon-primary/60 px-3 py-1 rounded-md border border-gold-royal/20">
                रजि. नं. {siteConfig.organization.registrationNumber}
              </span>
              <div className="flex items-center gap-2 text-xs text-sandstone-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{isHi ? "धारा 80G आयकर छूट पंजीकृत" : "80G Tax Exemption Registered"}</span>
              </div>
            </div>
          </div>

          {/* Column 2: Key Pages & Navigation */}
          <div>
            <h4 className="text-xs sm:text-sm font-serif font-bold text-gold-royal uppercase tracking-wider mb-4">
              {isHi ? "तीर्थ दर्शन व अनुभाग" : "Sanctuary Sections"}
            </h4>
            <ul className="space-y-2.5 text-xs text-sandstone-300">
              <li>
                <Link href={`/${locale}`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "होम" : "Home"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "हमारे बारे में" : "About Us"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/history`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "इतिहास" : "History"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/attraction-point`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "मुख्य आकर्षण" : "Main Attractions"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/donation`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "सहयोग / दान" : "Donation"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/how-to-reach`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "कैसे पहुंचे" : "How to Reach"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-gold-soft transition-colors">
                  {isHi ? "संपर्क" : "Contact"}
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Construction Objectives Summary & Link */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-serif font-bold text-gold-royal uppercase tracking-wider mb-4">
              {isHi ? "निर्माण के उद्देश्य" : "Construction Objectives"}
            </h4>
            <p className="text-xs text-sandstone-300 leading-relaxed font-light">
              {isHi
                ? "भगवान जोरावर के भक्तों के लिए एक सुदृढ़ व पवित्र साधना स्थल, बेहतर दर्शन व विश्राम सुविधाएं, और हमारी सांस्कृतिक विरासत का संरक्षण।"
                : "Providing a sacred worship ground, improved pilgrim amenities, disaster-safe structures, and cultural heritage preservation."}
            </p>
            <div className="pt-1">
              <Link
                href={`/${locale}/about#construction-objectives`}
                className="inline-flex items-center gap-1.5 text-xs text-gold-soft hover:text-gold-royal transition-colors font-serif font-semibold"
              >
                <span>{isHi ? "सभी 6 निर्माण उद्देश्य देखें" : "View All 6 Objectives"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="pt-2">
              <Link
                href={`/${locale}/donation`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep font-serif font-bold px-4 py-2 rounded-xl text-xs shadow-sm hover:shadow-sacred-sm transition-all"
              >
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{isHi ? "मंदिर निर्माण में सहयोग करें" : "Support Temple Construction"}</span>
              </Link>
            </div>
          </div>

          {/* Column 4: Official Contact & Timings */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-serif font-bold text-gold-royal uppercase tracking-wider mb-4">
              {isHi ? "संपर्क करें" : "Contact Information"}
            </h4>
            <div className="space-y-2.5 text-xs text-sandstone-300">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-gold-soft shrink-0 mt-0.5" />
                <span className="leading-relaxed">{siteConfig.address.fullHi}</span>
              </div>
              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-cream-ivory">{isHi ? "आधिकारिक फोन:" : "Phone:"}</span>
                </div>
                <div className="pl-6 space-y-0.5 font-mono text-[11px]">
                  {siteConfig.contact.phones.map((phone) => (
                    <div key={phone}>
                      <a
                        href={`tel:${phone.replace(/\D/g, "")}`}
                        className="hover:text-gold-soft transition-colors underline decoration-gold-royal/30"
                      >
                        {phone}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <Mail className="w-4 h-4 text-gold-soft shrink-0" />
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="hover:text-gold-soft transition-colors font-mono"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
              <div className="flex items-center gap-2.5 pt-1">
                <Clock className="w-4 h-4 text-gold-soft shrink-0" />
                <span>मंगला: 04:00 AM | रात्रि: 10:00 PM</span>
              </div>
            </div>
          </div>
        </div>

        <SacredDivider variant="gold" className="my-8" />

        {/* Bottom Legal & Copyright */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-sandstone-300">
          <p className="text-center sm:text-left font-serif text-[11px] sm:text-xs">
            © {new Date().getFullYear()} {siteConfig.organization.nameHi} • सर्वाधिकार सुरक्षित
          </p>

          <div className="flex items-center gap-4 text-[11px]">
            <Link href={`/${locale}/about`} className="hover:text-gold-soft transition-colors">
              {isHi ? "हमारे बारे में" : "About"}
            </Link>
            <span>•</span>
            <Link href={`/${locale}/contact`} className="hover:text-gold-soft transition-colors">
              {isHi ? "संपर्क" : "Contact"}
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-gold-soft transition-colors text-sandstone-400">
              {isHi ? "प्रशासन" : "Admin"}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
