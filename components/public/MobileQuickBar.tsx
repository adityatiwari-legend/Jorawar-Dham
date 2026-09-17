"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clock, Flame, HeartHandshake, Gift, Compass } from "lucide-react";
import { Locale } from "@/lib/utils/i18n";

interface MobileQuickBarProps {
  locale: Locale;
}

export default function MobileQuickBar({ locale }: MobileQuickBarProps) {
  const pathname = usePathname();
  const isHi = locale === "hi";

  const quickActions = [
    {
      href: `/${locale}/darshan`,
      label: isHi ? "दर्शन" : "Darshan",
      icon: Clock,
    },
    {
      href: `/${locale}/aarti`,
      label: isHi ? "आरती" : "Aarti",
      icon: Flame,
    },
    {
      href: `/${locale}/seva`,
      label: isHi ? "पूजा/सेवा" : "Seva",
      icon: HeartHandshake,
    },
    {
      href: `/${locale}/donation`,
      label: isHi ? "दान" : "Donation",
      icon: Gift,
    },
    {
      href: `/${locale}/visitor-info`,
      label: isHi ? "मार्ग" : "Guide",
      icon: Compass,
    },
  ];

  return (
    <nav
      aria-label="Mobile devotee quick actions"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-sandstone-50/95 backdrop-blur-md border-t border-sandstone-300 shadow-[0_-4px_12px_rgba(0,0,0,0.06)] pb-safe"
    >
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {quickActions.map((action) => {
          const isActive = pathname === action.href;
          const Icon = action.icon;

          return (
            <Link
              key={action.href}
              href={action.href}
              className={`flex flex-col items-center justify-center w-full h-full py-1 text-center transition-colors focus:outline-none ${
                isActive
                  ? "text-maroon-900 font-bold"
                  : "text-stone-600 hover:text-maroon-800"
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive ? "bg-maroon-100 text-maroon-900" : ""
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-medium tracking-tight mt-0.5 line-clamp-1">
                {action.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
