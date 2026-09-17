import type { Metadata } from "next";
import { prisma } from "@/lib/db/client";
import { Locale, isValidLocale } from "@/lib/utils/i18n";
import { notFound } from "next/navigation";
import GalleryView, { GalleryPhoto } from "@/components/public/GalleryView";
import { Camera } from "lucide-react";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHi = locale === "hi";

  return {
    title: isHi
      ? "दिव्य चित्र दीर्घा - गर्भगृह, उत्सव एवं मनोरम स्वरूप | श्री जोरावर धाम"
      : "Sacred Gallery - Sanctum, Deities & Festive Darshan | Shri Jorawar Dham",
    description: isHi
      ? "श्री जोरावर धाम मंदिर गर्भगृह, अखंड धूणा, वार्षिक मेलों एवं सेवा भंडारे के मनोरम पावन छायाचित्र।"
      : "Explore sacred photographs of the holy sanctum, deity adornment, annual religious fairs, and seva at Shri Jorawar Dham.",
    alternates: {
      canonical: `/${locale}/gallery`,
      languages: {
        hi: "/hi/gallery",
        en: "/en/gallery",
      },
    },
  };
}

export default async function GalleryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isValidLocale(locale)) notFound();

  const isHi = locale === "hi";

  // Fetch categories and items from PostgreSQL database
  const categories = await prisma.galleryCategory.findMany({
    include: {
      items: {
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Flatten items with category meta
  const photos: GalleryPhoto[] = [];
  categories.forEach((cat) => {
    cat.items.forEach((item) => {
      photos.push({
        id: item.id,
        categoryId: cat.id,
        categoryNameHi: cat.nameHi,
        categoryNameEn: cat.nameEn,
        titleHi: item.titleHi,
        titleEn: item.titleEn,
        fileUrl: item.fileUrl,
      });
    });
  });

  const categoryList = categories.map((c) => ({
    id: c.id,
    slug: c.slug,
    nameHi: c.nameHi,
    nameEn: c.nameEn,
  }));

  return (
    <div className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center space-y-4 border-b border-sandstone-300 pb-10">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-saffron-700 bg-saffron-50 border border-saffron-200 px-4 py-1 rounded-full">
          <Camera className="w-3.5 h-3.5 text-saffron-600" />
          <span>{isHi ? "दिव्य चित्र दीर्घा" : "Sacred Visuals"}</span>
        </span>
        <h1 className="text-3xl sm:text-5xl font-bold font-serif text-maroon-950">
          {isHi ? "श्री जोरावर धाम पावन दर्शन" : "Sacred Gallery & Darshan"}
        </h1>
        <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
          {isHi
            ? "मंदिर गर्भगृह, दिव्य विग्रह, वार्षिक उत्सव एवं सेवा कार्यों के पावन छायाचित्र।"
            : "Photographs capturing the holy sanctum, festive processions, architecture, and bhandara seva."}
        </p>
      </div>

      {/* Interactive Gallery Component */}
      <GalleryView categories={categoryList} photos={photos} locale={locale as Locale} />
    </div>
  );
}
