import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import EventCard from "@/components/public/EventCard";
import { Calendar, Sparkles } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "वार्षिक उत्सव व धार्मिक मेले - नवरात्र, गुरु पूर्णिमा, पाटोत्सव | श्री जोरावर धाम"
      : "Festivals & Religious Melas - Navratri, Guru Purnima, Patotsav | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम में आयोजित होने वाले प्रमुख वार्षिक धार्मिक उत्सवों, मेलों एवं पदयात्राओं की समय सारिणी व विवरण।"
      : "Complete schedule and program details for annual religious festivals, fairs, and devotional celebrations at Shri Jorawar Dham.",
    alternates: {
      canonical: `/${locale}/events`,
      languages: {
        hi: "/hi/events",
        en: "/en/events",
      },
    },
  };
}

export default async function EventsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  const events = await prisma.event.findMany({
    orderBy: { startDate: "asc" },
  });

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <Calendar className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "वार्षिक उत्सव एवं धार्मिक मेले" : "Festivals & Sacred Celebrations"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "श्री जोरावर धाम उत्सव एवं महापर्व" : "Sacred Events & Melas"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "नवरात्र, जन्माष्टमी, गुरु पूर्णिमा एवं धाम पाटोत्सव की तिथियाँ एवं कार्यक्रम विवरण।"
            : "Dates and devotional programs for Navratri, Janmashtami, Guru Purnima, and Annual Patotsav."}
        </p>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-16 text-stone-500 bg-white rounded-3xl border border-dashed border-sandstone-300">
          <Calendar className="w-10 h-10 mx-auto text-stone-300 mb-3" />
          <p className="text-base font-medium">
            {isHi ? "वर्तमान में कोई आगामी उत्सव पंजीकृत नहीं है।" : "No upcoming events scheduled at this moment."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {events.map((e) => (
            <EventCard key={e.id} event={e} locale={locale as Locale} />
          ))}
        </div>
      )}
    </div>
  );
}
