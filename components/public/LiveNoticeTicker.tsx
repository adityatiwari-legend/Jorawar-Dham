"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Bell, Pin, ChevronLeft, ChevronRight, Pause, Play, Sparkles } from "lucide-react";
import type { Notice } from "@prisma/client";
import { Locale, localize, formatLocalizedDate } from "@/lib/utils/i18n";

interface LiveNoticeTickerProps {
  notices: Notice[];
  locale: Locale;
}

export default function LiveNoticeTicker({ notices, locale }: LiveNoticeTickerProps) {
  if (!notices || notices.length === 0) return null;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const isHi = locale === "hi";

  useEffect(() => {
    if (isPaused || notices.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % notices.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isPaused, notices.length]);

  const activeNotice = notices[currentIndex];
  const title = localize(activeNotice, locale, "title");
  const body = localize(activeNotice, locale, "body");
  const isUrgent = activeNotice.priority === "URGENT";

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? notices.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % notices.length);
  };

  return (
    <div className="bg-cream-ivory border-y border-gold-royal/20 py-2.5 px-4 sm:px-6 shadow-sacred-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Left: Badge / Icon */}
        <div className="flex items-center gap-2 text-xs font-serif font-bold text-maroon-deep shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-gold-royal animate-pulse" />
          <span className="uppercase tracking-wider hidden sm:inline">
            {isHi ? "नवीनतम सूचना" : "Notice Board"}
          </span>
          <span className="text-gold-royal/50 hidden sm:inline">|</span>
        </div>

        {/* Center: Current Announcement Content */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5 text-xs text-stone-800">
          {activeNotice.isPinned && (
            <span className="inline-flex items-center gap-1 bg-sandstone-200/80 text-maroon-deep px-2 py-0.5 rounded text-[10px] font-semibold tracking-wide shrink-0">
              <Pin className="w-2.5 h-2.5 text-gold-royal" />
              <span>{isHi ? "स्थायी" : "Pinned"}</span>
            </span>
          )}

          {isUrgent && (
            <span className="inline-flex items-center gap-1 bg-red-700 text-white px-2 py-0.5 rounded text-[10px] font-bold tracking-wider shrink-0 animate-pulse">
              <AlertTriangle className="w-2.5 h-2.5" />
              <span>{isHi ? "अति आवश्यक" : "URGENT"}</span>
            </span>
          )}

          <p className="truncate font-medium text-stone-900">
            <span className="font-semibold text-maroon-deep">{title}</span>
            {body && <span className="text-stone-600 font-normal ml-1.5">— {body}</span>}
          </p>

          <span className="text-[11px] text-stone-400 font-mono shrink-0 hidden lg:inline-block">
            {formatLocalizedDate(activeNotice.publishedAt, locale)}
          </span>
        </div>

        {/* Right: Controls (Prev, Pause/Play, Next) */}
        {notices.length > 1 && (
          <div className="flex items-center gap-1 shrink-0 text-stone-500">
            <button
              type="button"
              onClick={handlePrev}
              className="p-1 rounded-lg hover:bg-cream-warm hover:text-maroon-deep transition-colors"
              aria-label="Previous Notice"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="p-1 rounded-lg hover:bg-cream-warm hover:text-maroon-deep transition-colors"
              aria-label={isPaused ? "Play Notices" : "Pause Notices"}
            >
              {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-1 rounded-lg hover:bg-cream-warm hover:text-maroon-deep transition-colors"
              aria-label="Next Notice"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
