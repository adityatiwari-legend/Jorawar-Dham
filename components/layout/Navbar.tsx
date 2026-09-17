"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Clock, MapPin, Sparkles, ChevronDown, Flame, HeartHandshake, BookOpen, Compass, Info, HelpCircle } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale, getDictionary } from "@/lib/utils/i18n";

interface NavbarProps {
  locale: Locale;
}

export default function Navbar({ locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const dict = getDictionary(locale);
  const isHi = locale === "hi";

  // Primary desktop navigation links
  const primaryNavLinks = [
    { href: `/${locale}`, label: dict.nav.home },
    { href: `/${locale}/bhagwan-jorawar`, label: isHi ? "भगवान जोरावर" : "Bhagwan Jorawar" },
    { href: `/${locale}/darshan`, label: dict.nav.darshan },
    { href: `/${locale}/aarti`, label: isHi ? "आरती" : "Aarti" },
    { href: `/${locale}/seva`, label: dict.nav.seva },
    { href: `/${locale}/events`, label: dict.nav.events },
    { href: `/${locale}/gallery`, label: dict.nav.gallery },
    { href: `/${locale}/donation`, label: isHi ? "दान" : "Donation" },
    { href: `/${locale}/visitor-info`, label: isHi ? "यात्री सूचना" : "Visitor Info" },
  ];

  // Secondary links in "More" dropdown
  const secondaryNavLinks = [
    { href: `/${locale}/history`, label: dict.nav.history, icon: BookOpen },
    { href: `/${locale}/dham`, label: dict.nav.dham, icon: Compass },
    { href: `/${locale}/about`, label: dict.nav.about, icon: Info },
    { href: `/${locale}/contact`, label: dict.nav.contact, icon: MapPin },
    { href: `/${locale}/faq`, label: isHi ? "प्रश्नोत्तरी (FAQ)" : "FAQ", icon: HelpCircle },
  ];

  // All links for mobile drawer
  const allNavLinks = [
    ...primaryNavLinks,
    ...secondaryNavLinks.map((s) => ({ href: s.href, label: s.label })),
  ];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setMoreDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-40 bg-sandstone-50/95 backdrop-blur-md border-b border-sandstone-200 shadow-sm">
      {/* Top Devotional Ticker Strip */}
      <div className="bg-maroon-950 text-sandstone-200 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 text-gold-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHi ? "॥ ॐ श्री जोरावर देवाय नमः ॥" : "|| Om Shri Jorawar Devaya Namah ||"}</span>
            </span>
            <span className="hidden sm:inline-block text-stone-500">|</span>
            <span className="hidden sm:flex items-center gap-1 text-stone-300">
              <MapPin className="w-3 h-3 text-saffron-400" />
              <span>{isHi ? "चूरू, राजस्थान" : "Churu, Rajasthan"}</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-stone-300">
            <span className="hidden md:flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gold-400" />
              <span>{isHi ? "दर्शन: प्रातः 5:00 - दोपहर 12:30 | सायं 4:00 - रात्रि 10:00" : "Darshan: 5:00 AM - 12:30 PM | 4:00 PM - 10:00 PM"}</span>
            </span>
            <Link
              href={`/${locale}/auth/login`}
              className="text-stone-300 hover:text-gold-400 transition-colors text-xs"
            >
              {isHi ? "दर्शनार्थी पोर्टल" : "Devotee Portal"}
            </Link>
            <span className="text-stone-600">|</span>
            <Link
              href="/admin/login"
              className="text-stone-300 hover:text-gold-400 transition-colors text-xs underline decoration-stone-600"
            >
              {dict.nav.admin}
            </Link>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Brand Identity */}
          {/* Desktop & Tablet: Full Logo */}
          <Link href={`/${locale}`} className="hidden sm:flex items-center group shrink-0">
            <img
              src="/branding/jorawar-dham-logo.png"
              alt="सिद्ध श्री जोरावर धाम सेवा समिति"
              className="h-12 md:h-14 w-auto object-contain rounded-md"
            />
          </Link>

          {/* Mobile: Sacred Icon + Trust Heading */}
          <Link href={`/${locale}`} className="flex sm:hidden items-center gap-2.5 group shrink-0">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="h-10 w-10 object-contain rounded-full border border-gold-400/40 shadow-sm"
            />
            <div>
              <span className="block font-serif font-bold text-sm text-maroon-950 leading-tight">
                सिद्ध श्री जोरावर धाम
              </span>
              <span className="block text-[10px] text-saffron-700 font-medium">
                {isHi ? "सेवा समिति" : "Seva Samiti"}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {primaryNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? "text-maroon-900 bg-sandstone-200/90 shadow-sm"
                      : "text-stone-700 hover:text-maroon-900 hover:bg-sandstone-100"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* "More" Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-stone-700 hover:text-maroon-900 hover:bg-sandstone-100 transition-all"
                aria-expanded={moreDropdownOpen}
              >
                <span>{isHi ? "अन्य पृष्ठ" : "More"}</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-sandstone-200 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  {secondaryNavLinks.map((sub) => {
                    const Icon = sub.icon;
                    const isActive = pathname === sub.href;
                    return (
                      <Link
                        key={sub.href}
                        href={sub.href}
                        onClick={() => setMoreDropdownOpen(false)}
                        className={`flex items-center gap-2.5 px-4 py-2 text-xs font-medium transition-colors ${
                          isActive
                            ? "bg-sandstone-100 text-maroon-950 font-semibold"
                            : "text-stone-700 hover:bg-sandstone-50 hover:text-maroon-900"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Language Switcher, Devotee CTA & Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href={`/${locale}/auth/login`}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-maroon-950 bg-gradient-to-r from-gold-400 to-amber-500 hover:from-gold-500 hover:to-amber-600 shadow-sm transition-all"
            >
              <span>{isHi ? "श्रद्धालु सेवा" : "Devotee Portal"}</span>
            </Link>

            <Suspense fallback={<div className="w-20 h-8 bg-stone-100 rounded-full animate-pulse" />}>
              <LanguageSwitcher currentLocale={locale} />
            </Suspense>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-stone-700 hover:text-maroon-900 hover:bg-sandstone-200 focus:outline-none focus:ring-2 focus:ring-saffron-500"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-sandstone-50 border-b border-sandstone-300 px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 max-h-[80vh] overflow-y-auto">
          {/* Official Trust Identity Card in Mobile Drawer */}
          <div className="flex items-center gap-3 p-3 mb-2 rounded-2xl bg-white border border-sandstone-300 shadow-sm">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="h-12 w-12 object-contain rounded-full border border-gold-400/50 shadow-sm shrink-0"
            />
            <div>
              <div className="font-serif font-bold text-sm text-maroon-950 leading-tight">
                सिद्ध श्री जोरावर धाम सेवा समिति
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5">
                रजि. नं. COOP/2023/DHOLPUR/201054
              </div>
            </div>
          </div>

          <Link
            href={`/${locale}/auth/login`}
            onClick={() => setMobileMenuOpen(false)}
            className="block w-full px-4 py-2.5 rounded-xl text-sm font-bold bg-saffron-600 text-white shadow-sm text-center"
          >
            {isHi ? "श्रद्धालु लॉगिन / पंजीकरण" : "Devotee Sign In / Register"}
          </Link>

          <div className="pt-1 space-y-1">
            {allNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-maroon-900 text-white font-semibold shadow-sm"
                      : "text-stone-800 hover:bg-sandstone-200"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
