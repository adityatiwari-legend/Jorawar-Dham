"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Globe } from "lucide-react";
import { Locale } from "@/lib/utils/i18n";

interface LanguageSwitcherProps {
  currentLocale: Locale;
}

export default function LanguageSwitcher({ currentLocale }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const switchLocale = (targetLocale: Locale) => {
    if (targetLocale === currentLocale) return;

    // Set cookie to persist user preference for 1 year
    document.cookie = `app_locale=${targetLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Swap the leading locale slug in pathname: /hi/darshan -> /en/darshan
    const segments = pathname.split("/");
    if (segments.length > 1 && (segments[1] === "hi" || segments[1] === "en")) {
      segments[1] = targetLocale;
    } else {
      segments.splice(1, 0, targetLocale);
    }

    const newPath = segments.join("/") || `/${targetLocale}`;
    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${newPath}?${queryString}` : newPath;

    router.push(finalUrl);
  };

  return (
    <div className="flex items-center bg-stone-100/90 border border-sandstone-300/90 rounded-full p-0.5 text-xs shadow-sm backdrop-blur-sm shrink-0">
      <div className="hidden sm:flex items-center pl-1.5 pr-0.5 text-stone-500">
        <Globe className="w-3 h-3 text-maroon-deep/70" aria-hidden="true" />
      </div>
      <button
        type="button"
        onClick={() => switchLocale("hi")}
        className={`px-2 sm:px-2.5 py-1 rounded-full font-semibold transition-all duration-200 text-[11px] sm:text-xs leading-none ${
          currentLocale === "hi"
            ? "bg-maroon-deep text-cream-ivory shadow-xs"
            : "text-stone-700 hover:text-maroon-deep hover:bg-stone-200/50"
        }`}
        aria-label="हिंदी में देखें"
      >
        हिन्दी
      </button>
      <button
        type="button"
        onClick={() => switchLocale("en")}
        className={`px-2 sm:px-2.5 py-1 rounded-full font-semibold transition-all duration-200 text-[11px] sm:text-xs leading-none ${
          currentLocale === "en"
            ? "bg-maroon-deep text-cream-ivory shadow-xs"
            : "text-stone-700 hover:text-maroon-deep hover:bg-stone-200/50"
        }`}
        aria-label="View in English"
      >
        English
      </button>
    </div>
  );
}
