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
  User,
  Phone,
  Calendar,
  Flame,
  Camera,
  HeartHandshake,
  HelpCircle,
  Compass,
  BookOpen,
} from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import { Locale } from "@/lib/utils/i18n";
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

  // Core navigation links for desktop
  const primaryNavLinks = [
    { href: `/${locale}`, label: isHi ? "होम" : "Home" },
    { href: `/${locale}/about`, label: isHi ? "परिचय" : "About" },
    { href: `/${locale}/attraction-point`, label: isHi ? "आकर्षण" : "Attractions" },
    { href: `/${locale}/donation`, label: isHi ? "सहयोग / दान" : "Donation" },
    { href: `/${locale}/contact`, label: isHi ? "संपर्क" : "Contact" },
  ];

  // Secondary links in "More" dropdown
  const secondaryNavLinks = [
    { href: `/${locale}/darshan`, label: isHi ? "दर्शन" : "Darshan", icon: Calendar },
    { href: `/${locale}/aarti`, label: isHi ? "महाआरती" : "Maha Aarti", icon: Flame },
    { href: `/${locale}/seva`, label: isHi ? "पूजा व सेवा" : "Pooja & Seva", icon: Sparkles },
    { href: `/${locale}/history`, label: isHi ? "इतिहास" : "History", icon: BookOpen },
    { href: `/${locale}/how-to-reach`, label: isHi ? "कैसे पहुंचे" : "How to Reach", icon: Compass },
    { href: `/${locale}/events`, label: isHi ? "उत्सव व मेले" : "Events & Melas", icon: Calendar },
    { href: `/${locale}/gallery`, label: isHi ? "चित्र दीर्घा" : "Gallery", icon: Camera },
    { href: `/${locale}/faq`, label: isHi ? "प्रश्नोत्तरी (FAQ)" : "FAQ", icon: HelpCircle },
  ];

  // All links for mobile drawer
  const allNavLinks = [
    { href: `/${locale}`, label: isHi ? "होम" : "Home" },
    { href: `/${locale}/about`, label: isHi ? "हमारे बारे में" : "About Us" },
    { href: `/${locale}/history`, label: isHi ? "इतिहास" : "History" },
    { href: `/${locale}/darshan`, label: isHi ? "दर्शन समय" : "Darshan Timings" },
    { href: `/${locale}/aarti`, label: isHi ? "आरती समय" : "Aarti Timings" },
    { href: `/${locale}/seva`, label: isHi ? "पूजा व सेवा" : "Pooja & Seva" },
    { href: `/${locale}/attraction-point`, label: isHi ? "मुख्य आकर्षण" : "Attractions" },
    { href: `/${locale}/donation`, label: isHi ? "सहयोग / दान" : "Donation" },
    { href: `/${locale}/how-to-reach`, label: isHi ? "कैसे पहुंचे" : "How to Reach" },
    { href: `/${locale}/events`, label: isHi ? "उत्सव व मेले" : "Events" },
    { href: `/${locale}/gallery`, label: isHi ? "चित्र दीर्घा" : "Gallery" },
    { href: `/${locale}/contact`, label: isHi ? "संपर्क" : "Contact" },
    { href: `/${locale}/faq`, label: isHi ? "प्रश्नोत्तरी (FAQ)" : "FAQ" },
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
    <header className="sticky top-0 z-40 bg-cream-warm/95 backdrop-blur-md border-b border-sandstone-200/80 shadow-sacred-sm w-full overflow-hidden">
      {/* 1. Top Utility Bar */}
      <div className="bg-maroon-deep text-cream-ivory text-[10px] sm:text-xs py-1 px-3 sm:px-4 border-b border-gold-royal/20 overflow-hidden">
        <div className="max-w-7xl mx-auto flex justify-between items-center gap-2">
          {/* Official Mantra & Dholpur Location */}
          <div className="flex items-center gap-2 sm:gap-3 overflow-hidden whitespace-nowrap text-ellipsis">
            <span className="flex items-center gap-1.5 text-gold-royal font-serif font-semibold tracking-wider truncate">
              <Sparkles className="w-3 h-3 text-gold-soft shrink-0" />
              <span className="truncate">{siteConfig.mantra}</span>
            </span>
            <span className="hidden md:inline-block text-gold-royal/30">|</span>
            <span className="hidden md:flex items-center gap-1 text-sandstone-200/90 font-light truncate">
              <MapPin className="w-3 h-3 text-gold-soft shrink-0" />
              <span className="truncate">{isHi ? "चितौरा, सैंपऊ, धौलपुर (राज.)" : "Chitaura, Saipau, Dholpur"}</span>
            </span>
          </div>

          {/* Timings, Devotee Login & Admin Link */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 text-sandstone-200/90 whitespace-nowrap">
            <span className="hidden lg:flex items-center gap-1 text-cream-ivory/80">
              <Clock className="w-3 h-3 text-gold-soft shrink-0" />
              <span>{isHi ? "दर्शन: 04:00 AM – 10:00 PM" : "04:00 AM – 10:00 PM"}</span>
            </span>
            <span className="hidden lg:inline-block text-gold-royal/30">|</span>
            <Link
              href={`/${locale}/auth/login`}
              className="text-cream-ivory/90 hover:text-gold-soft transition-colors flex items-center gap-1 font-medium"
            >
              <User className="w-3 h-3 text-gold-soft shrink-0" />
              <span>{isHi ? "श्रद्धालु लॉगिन" : "Login"}</span>
            </Link>
            <span className="text-gold-royal/30">|</span>
            <Link
              href="/admin/login"
              className="text-sandstone-300 hover:text-gold-soft transition-colors underline decoration-gold-royal/30 hover:decoration-gold-soft text-[10px] sm:text-xs"
            >
              {isHi ? "प्रशासन" : "Admin"}
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand Logo (Full Banner on Desktop / Tablet, Compact on Mobile) */}
          <Link href={`/${locale}`} className="flex items-center group shrink-0 py-1">
            <img
              src="/branding/jorawar-dham-logo.png"
              alt="सिद्ध श्री जोरावर धाम सेवा समिति"
              className="h-9 sm:h-10 md:h-11 lg:h-12 w-auto max-w-[170px] sm:max-w-[210px] object-contain transition-transform duration-200 group-hover:scale-[1.01]"
            />
          </Link>

          {/* Desktop Navigation Links (Visible on xl / 1280px+) */}
          <nav className="hidden xl:flex items-center gap-1 2xl:gap-2">
            {primaryNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-2.5 2xl:px-3 py-1.5 text-xs 2xl:text-sm font-semibold tracking-wide transition-all whitespace-nowrap ${
                    isActive
                      ? "text-maroon-deep font-bold"
                      : "text-stone-700 hover:text-maroon-primary"
                  }`}
                >
                  <span>{link.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gradient-to-r from-gold-soft via-gold-royal to-gold-soft rounded-full" />
                  )}
                </Link>
              );
            })}

            {/* "More" Dropdown Menu */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setMoreDropdownOpen(!moreDropdownOpen)}
                className="inline-flex items-center gap-1 px-2.5 2xl:px-3 py-1.5 text-xs 2xl:text-sm font-semibold text-stone-700 hover:text-maroon-primary transition-all whitespace-nowrap"
                aria-expanded={moreDropdownOpen}
              >
                <span>{isHi ? "अन्य सेवाएं" : "More"}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
              </button>

              {moreDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-cream-ivory rounded-2xl shadow-sacred-lg border border-sandstone-200/80 py-2 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="px-3.5 py-1.5 border-b border-sandstone-100 text-[10px] font-serif font-bold text-gold-royal uppercase tracking-wider">
                    {isHi ? "दर्शन, सेवा एवं सूचना" : "Darshan & Info"}
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

          {/* Right Controls: Language Switcher, Book Darshan CTA, Devotee Portal, Mobile Hamburger */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <Suspense fallback={<div className="w-12 h-6 bg-stone-200/50 rounded-lg animate-pulse" />}>
              <LanguageSwitcher currentLocale={locale} />
            </Suspense>

            {/* Book Darshan Golden Button */}
            <Link
              href={`/${locale}/booking`}
              id="nav-book-darshan-cta"
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold text-maroon-deep bg-gradient-to-r from-gold-soft to-gold-royal hover:from-gold-royal hover:to-gold-soft shadow-xs hover:shadow-sacred-sm transition-all border border-gold-royal/40 shrink-0 whitespace-nowrap"
            >
              <Calendar className="w-3.5 h-3.5 text-maroon-deep shrink-0" />
              <span>{isHi ? "दर्शन बुक करें" : "Book Darshan"}</span>
            </Link>

            {/* Devotee Portal Button (Desktop) */}
            <Link
              href={`/${locale}/user`}
              className="hidden lg:inline-flex items-center gap-1.5 px-2.5 2xl:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold text-stone-700 hover:text-maroon-primary bg-sandstone-100 hover:bg-sandstone-200/80 transition-all border border-sandstone-200 shrink-0 whitespace-nowrap"
            >
              <User className="w-3.5 h-3.5 text-maroon-primary shrink-0" />
              <span>{isHi ? "श्रद्धालु पोर्टल" : "Devotee Portal"}</span>
            </Link>

            {/* Mobile / Tablet Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-stone-800 hover:text-maroon-deep hover:bg-sandstone-200/60 focus:outline-none focus:ring-2 focus:ring-gold-royal"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3. Mobile / Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-cream-ivory border-b border-sandstone-300/80 px-4 pt-3 pb-6 space-y-3 shadow-sacred-lg animate-in slide-in-from-top-2 max-h-[82vh] overflow-y-auto">
          {/* Trust Banner Header */}
          <div className="flex items-center gap-3 p-3 rounded-2xl bg-cream-warm border border-gold-royal/30 shadow-sacred-sm">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="h-10 w-10 object-contain rounded-full border border-gold-royal/50 shadow-sm shrink-0 bg-maroon-deep p-0.5"
            />
            <div className="min-w-0">
              <div className="font-serif font-bold text-xs sm:text-sm text-maroon-deep leading-tight truncate">
                {siteConfig.organization.nameHi}
              </div>
              <div className="text-[10px] text-stone-500 font-mono mt-0.5 truncate">
                रजि. नं. {siteConfig.organization.registrationNumber}
              </div>
              <div className="text-[10px] text-gold-royal font-serif mt-0.5 truncate">
                {siteConfig.mantra}
              </div>
            </div>
          </div>

          {/* Action Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              href={`/${locale}/booking`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-gold-soft to-gold-royal text-maroon-deep shadow-xs text-center border border-gold-royal/30"
            >
              <Calendar className="w-3.5 h-3.5 text-maroon-deep" />
              <span>{isHi ? "दर्शन बुक करें" : "Book Darshan"}</span>
            </Link>

            <Link
              href={`/${locale}/user`}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 min-h-[42px] px-3 py-2 rounded-xl text-xs font-bold bg-maroon-deep text-cream-ivory shadow-xs text-center border border-gold-royal/30"
            >
              <User className="w-3.5 h-3.5 text-gold-soft" />
              <span>{isHi ? "श्रद्धालु पोर्टल" : "Devotee Portal"}</span>
            </Link>
          </div>

          {/* Links List */}
          <div className="pt-1 space-y-0.5">
            {allNavLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-medium transition-colors ${
                    isActive
                      ? "bg-maroon-deep text-cream-ivory font-bold shadow-xs"
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
