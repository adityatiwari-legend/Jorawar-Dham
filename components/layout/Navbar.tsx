"use client";

import { useState, Suspense, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Clock,
  MapPin,
  Sparkles,
  ChevronDown,
  BookOpen,
  Compass,
  Info,
  HelpCircle,
  ShieldCheck,
  User,
  Phone,
  Calendar,
  Flame,
  Camera,
  HeartHandshake,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale, getDictionary } from "@/lib/utils/i18n";
import { siteConfig } from "@/lib/content/site";

interface NavbarProps {
  locale: Locale;
}

export default function Navbar({ locale }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const isHi = locale === "hi";

  // Primary navigation links matching the official source requirements
  const primaryNavLinks = [
    { href: `/${locale}`, label: isHi ? "होम" : "Home" },
    { href: `/${locale}/about`, label: isHi ? "हमारे बारे में" : "About" },
    { href: `/${locale}/history`, label: isHi ? "इतिहास" : "History" },
    { href: `/${locale}/attraction-point`, label: isHi ? "मुख्य आकर्षण" : "Attractions" },
    { href: `/${locale}/donation`, label: isHi ? "सहयोग / दान" : "Donation" },
    { href: `/${locale}/how-to-reach`, label: isHi ? "कैसे पहुंचे" : "How to Reach" },
    { href: `/${locale}/contact`, label: isHi ? "संपर्क" : "Contact" },
  ];

  // Secondary links in "More" dropdown for darshan, aarti, seva, events, gallery, FAQ
  const secondaryNavLinks = [
    { href: `/${locale}/darshan`, label: isHi ? "दर्शन" : "Darshan", icon: Calendar },
    { href: `/${locale}/aarti`, label: isHi ? "महाआरती" : "Maha Aarti", icon: Flame },
    { href: `/${locale}/seva`, label: isHi ? "पूजा व सेवा" : "Pooja & Seva", icon: Sparkles },
    { href: `/${locale}/events`, label: isHi ? "उत्सव व मेले" : "Events & Melas", icon: Sparkles },
    { href: `/${locale}/gallery`, label: isHi ? "चित्र दीर्घा" : "Gallery", icon: Camera },
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
    <header className="sticky top-0 z-40 bg-cream-warm/95 backdrop-blur-md border-b border-sandstone-200/80 shadow-sacred-sm">
      {/* 1. Top Utility Devotional Bar with Official Mantra & Dholpur Address */}
      <div className="bg-maroon-deep text-cream-ivory text-[11px] sm:text-xs py-1.5 px-4 border-b border-gold-royal/20">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          {/* Official Source Mantra & Dholpur Location */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-gold-royal font-serif font-semibold tracking-wider">
              <Sparkles className="w-3 h-3 text-gold-soft" />
              <span>{siteConfig.mantra}</span>
            </span>
            <span className="hidden sm:inline-block text-gold-royal/40">|</span>
            <span className="hidden sm:flex items-center gap-1 text-sandstone-200/90 font-light">
              <MapPin className="w-3 h-3 text-gold-soft" />
              <span>{isHi ? "चितौरा, सैंपऊ, धौलपुर (राज.)" : "Chitaura, Saipau, Dholpur (Raj.)"}</span>
            </span>
            <span className="hidden lg:inline-block text-gold-royal/40">|</span>
            <a
              href={`tel:${siteConfig.contact.phones[0].replace(/\D/g, "")}`}
              className="hidden lg:flex items-center gap-1 text-sandstone-200/90 hover:text-gold-soft transition-colors"
            >
              <Phone className="w-3 h-3 text-emerald-400" />
              <span>{siteConfig.contact.phones[0]}</span>
            </a>
          </div>

          {/* Timings, Devotee Portal & Admin Access */}
          <div className="flex items-center gap-3 sm:gap-4 text-sandstone-200/90">
            <span className="hidden md:flex items-center gap-1.5 text-cream-ivory/80">
              <Clock className="w-3 h-3 text-gold-soft" />
              <span>
                {isHi
                  ? "मंगला दर्शन: 04:00 AM | रात्रि दर्शन: 10:00 PM तक"
                  : "Mangala: 04:00 AM | Night: Until 10:00 PM"}
              </span>
            </span>
            <span className="hidden md:inline-block text-gold-royal/40">|</span>
            <Link
              href={`/${locale}/auth/login`}
              className="text-cream-ivory/90 hover:text-gold-soft transition-colors flex items-center gap-1 font-medium"
            >
              <User className="w-3 h-3 text-gold-soft" />
              <span>{isHi ? "श्रद्धालु लॉगिन" : "Devotee Login"}</span>
            </Link>
            <span className="text-gold-royal/40">|</span>
            <Link
              href="/admin/login"
              className="text-sandstone-300 hover:text-gold-soft transition-colors underline decoration-gold-royal/30 hover:decoration-gold-soft"
            >
              {isHi ? "प्रशासन" : "Admin"}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Official Full Brand Logo */}
          <Link href={`/${locale}`} className="hidden sm:flex items-center group shrink-0 py-1">
            <img
              src="/branding/jorawar-dham-logo.png"
              alt="सिद्ध श्री जोरावर धाम सेवा समिति"
              className="h-12 md:h-14 w-auto object-contain transition-transform duration-200 group-hover:scale-[1.01]"
            />
          </Link>

          {/* Official Icon + Name (Mobile) */}
          <Link href={`/${locale}`} className="flex sm:hidden items-center gap-2.5 group shrink-0">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="h-10 w-10 object-contain rounded-full border border-gold-royal/40 shadow-sm p-0.5 bg-maroon-deep"
            />
            <div>
              <span className="block font-serif font-bold text-xs text-maroon-deep leading-tight">
                सिद्ध श्री जोरावर धाम
              </span>
              <span className="block text-[10px] text-maroon-primary font-medium">
                {isHi ? "चितौरा, धौलपुर (राज.)" : "Chitaura, Dholpur"}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-0.5">
            {primaryNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-3 py-2 text-xs font-semibold tracking-wide transition-all ${
                    isActive
                      ? "text-maroon-deep font-bold"
                      : "text-stone-700 hover:text-maroon-primary"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-gold-soft via-gold-royal to-gold-soft rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* "More" Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-stone-700 hover:text-maroon-primary transition-all"
                aria-expanded={moreDropdownOpen}
              >
                <span>{isHi ? "अन्य सेवाएं" : "More"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-cream-ivory rounded-2xl shadow-sacred-lg border border-sandstone-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3 py-1.5 border-b border-sandstone-100 text-[10px] font-serif font-bold text-gold-royal uppercase tracking-wider">
                    {isHi ? "दर्शन व अनुष्ठान" : "Darshan & Seva"}
                  </div>
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
                            ? "bg-cream-warm text-maroon-deep font-bold"
                            : "text-stone-700 hover:bg-cream-warm hover:text-maroon-deep"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5 text-gold-royal shrink-0" />
                        <span>{sub.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </nav>

          {/* Right Controls: Language Switcher, Devotee CTA, Mobile Hamburger */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Suspense fallback={<div className="w-16 h-7 bg-stone-200/50 rounded-lg animate-pulse" />}>
              <LanguageSwitcher currentLocale={locale} />
            </Suspense>

            <Link
              href={`/${locale}/auth/login`}
              className="hidden lg:inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-maroon-deep bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft shadow-sm hover:shadow-sacred-sm transition-all subtle-lift border border-gold-royal/30"
            >
              <Sparkles className="w-3.5 h-3.5 text-maroon-deep" />
              <span>{isHi ? "श्रद्धालु सेवा" : "Devotee Portal"}</span>
            </Link>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-stone-800 hover:text-maroon-deep hover:bg-sandstone-200/60 focus:outline-none focus:ring-2 focus:ring-gold-royal"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-cream-ivory border-b border-sandstone-300/70 px-4 pt-3 pb-6 space-y-3 shadow-sacred-lg animate-in slide-in-from-top-2 max-h-[85vh] overflow-y-auto">
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream-warm border border-gold-royal/30 shadow-sacred-sm">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="h-11 w-11 object-contain rounded-full border border-gold-royal/50 shadow-sm shrink-0 bg-maroon-deep p-0.5"
            />
            <div className="min-w-0">
              <div className="font-serif font-bold text-xs sm:text-sm text-maroon-deep leading-tight truncate">
                {siteConfig.organization.nameHi}
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5 truncate">
                {siteConfig.organization.registrationNumber}
              </div>
              <div className="text-[10px] text-gold-royal font-serif mt-0.5">
                {siteConfig.mantra}
              </div>
            </div>
          </div>

          <Link
            href={`/${locale}/auth/login`}
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-bold bg-maroon-deep text-cream-ivory shadow-sm text-center border border-gold-royal/30"
          >
            <User className="w-4 h-4 text-gold-soft" />
            <span>{isHi ? "श्रद्धालु लॉगिन / पंजीकरण" : "Devotee Portal Sign In"}</span>
          </Link>

          <div className="pt-1 space-y-1">
            {allNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center min-h-[44px] px-4 py-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-maroon-deep text-cream-ivory font-bold shadow-sm"
                      : "text-stone-800 hover:bg-cream-warm"
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
