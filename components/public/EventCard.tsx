import { Calendar, MapPin, Sparkles, Clock, CheckCircle } from "lucide-react";
import type { Event as DhamEvent } from "@prisma/client";
import { Locale, localize, formatLocalizedDate } from "@/lib/utils/i18n";

interface EventCardProps {
  event: DhamEvent;
  locale: Locale;
}

export default function EventCard({ event, locale }: EventCardProps) {
  const isHi = locale === "hi";
  const title = localize(event, locale, "title");
  const description = localize(event, locale, "description");
  const location = localize(event, locale, "location");

  // Format time
  const timeFormatted = new Intl.DateTimeFormat(isHi ? "hi-IN" : "en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(event.startDate));

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "UPCOMING":
        return {
          text: isHi ? "आगामी महापर्व" : "Upcoming",
          cls: "bg-saffron-100 text-saffron-900 border-saffron-300",
        };
      case "ONGOING":
        return {
          text: isHi ? "वर्तमान में जारी" : "Ongoing",
          cls: "bg-emerald-100 text-emerald-900 border-emerald-300 animate-pulse",
        };
      case "COMPLETED":
        return {
          text: isHi ? "संपन्न" : "Concluded",
          cls: "bg-stone-100 text-stone-700 border-stone-300",
        };
      default:
        return {
          text: isHi ? "आयोजन" : "Event",
          cls: "bg-sandstone-100 text-stone-800 border-sandstone-300",
        };
    }
  };

  const statusBadge = getStatusBadge(event.status);

  return (
    <div className="bg-white rounded-3xl border border-sandstone-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col group">
      {/* Event Banner Image */}
      <div className="relative aspect-[16/9] bg-gradient-to-br from-maroon-950 via-maroon-900 to-saffron-950 overflow-hidden flex items-center justify-center">
        {event.bannerImage ? (
          <img
            src={event.bannerImage}
            alt={title || "Jorawar Dham Event"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <img
              src="/branding/jorawar-dham-icon.png"
              alt="सिद्ध श्री जोरावर धाम"
              className="w-16 h-16 rounded-full object-contain border-2 border-gold-400/50 shadow-md mb-2 bg-blue-950/80 p-1"
            />
            <span className="text-xs text-gold-300 font-serif font-semibold">सिद्ध श्री जोरावर धाम</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-2">
          <span className={`text-xs font-semibold px-3 py-1 rounded-full border shadow-sm ${statusBadge.cls}`}>
            {statusBadge.text}
          </span>
          {event.isFeatured && (
            <span className="inline-flex items-center gap-1 bg-maroon-900 text-gold-300 text-xs px-2.5 py-1 rounded-full font-medium shadow-sm">
              <Sparkles className="w-3 h-3 text-gold-400" />
              <span>{isHi ? "प्रमुख उत्सव" : "Featured"}</span>
            </span>
          )}
        </div>
      </div>

      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-3">
          {/* Date & Time Row */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-600">
            <div className="inline-flex items-center gap-1.5 bg-saffron-50 text-saffron-800 px-2.5 py-1 rounded-md font-semibold">
              <Calendar className="w-3.5 h-3.5 text-saffron-600" />
              <span>{formatLocalizedDate(event.startDate, locale)}</span>
            </div>
            <div className="inline-flex items-center gap-1 text-stone-500">
              <Clock className="w-3.5 h-3.5 text-stone-400" />
              <span>{timeFormatted}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-maroon-950 font-serif group-hover:text-maroon-800 transition-colors leading-snug">
            {title}
          </h3>

          {/* Description */}
          <p className="text-sm text-stone-600 line-clamp-3 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Location & Registration Status */}
        <div className="pt-4 border-t border-sandstone-100 flex items-center justify-between gap-2 text-xs text-stone-500">
          {location ? (
            <div className="flex items-center gap-1.5 line-clamp-1">
              <MapPin className="w-3.5 h-3.5 text-saffron-600 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          ) : (
            <span />
          )}

          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium shrink-0">
            <CheckCircle className="w-3 h-3 text-emerald-600" />
            <span>{isHi ? "प्रवेश निःशुल्क" : "Free Entry"}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
