import Link from "next/link";
import { Phone, Mail, MapPin, Heart, ShieldCheck, Sparkles } from "lucide-react";
import { Locale, getDictionary } from "@/lib/utils/i18n";

interface FooterProps {
  locale: Locale;
}

export default function Footer({ locale }: FooterProps) {
  const dict = getDictionary(locale);
  const isHi = locale === "hi";

  return (
    <footer className="bg-maroon-950 text-sandstone-200 border-t-4 border-gold-500 mt-auto pb-16 lg:pb-0">
      {/* Devotional Arch Strip */}
      <div className="bg-maroon-900/60 py-3.5 px-4 text-center border-b border-maroon-800/60">
        <p className="text-gold-400 font-serif text-xs sm:text-sm tracking-widest uppercase">
          {isHi
            ? "॥ ॐ श्री जोरावर देवाय नमः • सर्वे भवन्तु सुखिनः सर्वे सन्तु निरामयाः ॥"
            : "|| Om Shri Jorawar Devaya Namah • Sarve Bhavantu Sukhinah ||"}
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Trust Overview */}
          <div className="space-y-4">
            <Link href={`/${locale}`} className="inline-block">
              <img
                src="/branding/jorawar-dham-logo.png"
                alt="सिद्ध श्री जोरावर धाम सेवा समिति"
                className="h-14 sm:h-16 w-auto object-contain rounded-lg border border-gold-500/30 shadow-md bg-blue-950/40 p-1"
              />
            </Link>
            <p className="text-xs sm:text-sm text-sandstone-300 leading-relaxed font-light">
              {dict.site.description}
            </p>
            <div className="pt-1">
              <span className="inline-block bg-maroon-900 border border-gold-500/40 text-gold-300 text-xs px-3.5 py-1.5 rounded-full font-medium shadow-sm">
                {dict.footer.trustName}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-stone-300 pt-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{isHi ? "धारा 80G आयकर छूट पंजीकृत" : "80G Tax Exemption Registered"}</span>
            </div>
          </div>

          {/* Sacred Darshan & Offerings */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 font-serif">
              {isHi ? "दर्शन व पावन अनुष्ठान" : "Darshan & Rituals"}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-sandstone-300">
              <li>
                <Link href={`/${locale}/bhagwan-jorawar`} className="hover:text-gold-400 transition-colors">
                  {isHi ? "भगवान जोरावर लीला" : "Bhagwan Jorawar"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/darshan`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.darshan}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/aarti`} className="hover:text-gold-400 transition-colors">
                  {isHi ? "दैनिक महाआरती" : "Daily Maha Aarti"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/seva`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.seva}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/events`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.events}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/gallery`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.gallery}
                </Link>
              </li>
            </ul>
          </div>

          {/* Pilgrim Logistics & Support */}
          <div>
            <h4 className="text-xs sm:text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 font-serif">
              {isHi ? "तीर्थयात्री संदर्शिका" : "Pilgrim Information"}
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm text-sandstone-300">
              <li>
                <Link href={`/${locale}/visitor-info`} className="hover:text-gold-400 transition-colors">
                  {isHi ? "यात्री मार्गदर्शिका व आवास" : "Visitor Logistics & Stay"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/dham`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.dham}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/history`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.history}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/donation`} className="hover:text-gold-400 transition-colors">
                  {isHi ? "अधिकृत दान व सहयोग (80G)" : "Donations & 80G Tax Exemption"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/about`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="hover:text-gold-400 transition-colors">
                  {isHi ? "प्रश्नोत्तरी (FAQ)" : "Frequently Asked Questions"}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-gold-400 transition-colors">
                  {dict.nav.contact}
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3.5">
            <h4 className="text-xs sm:text-sm font-semibold text-gold-400 uppercase tracking-wider mb-4 font-serif">
              {dict.nav.contact}
            </h4>
            <div className="flex items-start gap-3 text-xs sm:text-sm text-sandstone-300">
              <MapPin className="w-4 h-4 text-saffron-400 shrink-0 mt-0.5" />
              <span>{dict.footer.address}</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-sandstone-300">
              <Phone className="w-4 h-4 text-saffron-400 shrink-0" />
              <span>+91-141-2345678</span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-sandstone-300">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white">{dict.footer.emergencyContact}:</strong> +91-98765-43210
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs sm:text-sm text-sandstone-300">
              <Mail className="w-4 h-4 text-saffron-400 shrink-0" />
              <span>trust@jorawardham.org</span>
            </div>

            <div className="pt-2">
              <Link
                href="/admin/login"
                className="inline-block text-stone-400 hover:text-gold-400 text-xs underline decoration-stone-600 transition-colors"
              >
                {dict.nav.admin}
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-maroon-900 flex flex-col sm:flex-row items-center justify-between text-xs text-sandstone-400 gap-4">
          <p>{dict.footer.copyright}</p>
          <div className="flex items-center gap-2">
            <span>{isHi ? "श्रद्धा और समर्पण के साथ निर्मित" : "Crafted with devotion & reverence"}</span>
            <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 inline" />
          </div>
        </div>
      </div>
    </footer>
  );
}
