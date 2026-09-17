import { AlertTriangle, Bell, Pin } from "lucide-react";
import type { Notice } from "@prisma/client";
import { Locale, localize, formatLocalizedDate } from "@/lib/utils/i18n";

interface LiveNoticeTickerProps {
  notices: Notice[];
  locale: Locale;
}

export default function LiveNoticeTicker({ notices, locale }: LiveNoticeTickerProps) {
  if (!notices || notices.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-500/10 via-saffron-500/15 to-amber-500/10 border-y border-amber-300/60 py-3 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-saffron-900 font-semibold text-sm shrink-0">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-saffron-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-saffron-600"></span>
          </span>
          <Bell className="w-4 h-4 text-saffron-700" />
          <span>{locale === "hi" ? "नवीनतम सूचना:" : "Notice Board:"}</span>
        </div>

        <div className="flex-1 space-y-2 md:space-y-0">
          {notices.slice(0, 2).map((notice) => {
            const isUrgent = notice.priority === "URGENT";
            const title = localize(notice, locale, "title");
            const body = localize(notice, locale, "body");

            return (
              <div
                key={notice.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm text-stone-800"
              >
                <div className="flex items-center gap-1.5 shrink-0">
                  {notice.isPinned && (
                    <span className="inline-flex items-center gap-1 bg-stone-200 text-stone-700 px-2 py-0.5 rounded text-[11px] font-medium">
                      <Pin className="w-2.5 h-2.5" />
                      {locale === "hi" ? "स्थायी" : "Pinned"}
                    </span>
                  )}
                  {isUrgent && (
                    <span className="inline-flex items-center gap-1 bg-red-600 text-white px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide">
                      <AlertTriangle className="w-2.5 h-2.5" />
                      {locale === "hi" ? "अति आवश्यक" : "URGENT"}
                    </span>
                  )}
                </div>
                <p className="line-clamp-1 font-medium text-stone-900">
                  {title} <span className="font-normal text-stone-600">— {body}</span>
                </p>
                <span className="text-[11px] text-stone-500 whitespace-nowrap hidden lg:inline-block">
                  ({formatLocalizedDate(notice.publishedAt, locale)})
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
