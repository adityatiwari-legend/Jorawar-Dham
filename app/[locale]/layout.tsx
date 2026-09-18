import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileQuickBar from "@/components/public/MobileQuickBar";
import JsonLd from "@/components/public/JsonLd";
import { Locale, LOCALES, isValidLocale, getDictionary } from "@/lib/utils/i18n";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const dict = getDictionary(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://jorawar.adityatiwaridev.xyz";

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: `${dict.site.name} | ${dict.site.subtitle}`,
      template: `%s | ${dict.site.name}`,
    },
    description: dict.site.description,
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages: {
        hi: `${baseUrl}/hi`,
        en: `${baseUrl}/en`,
      },
    },
    icons: {
      icon: [
        { url: "/branding/jorawar-dham-icon.png", type: "image/png" },
        { url: "/icon.png", type: "image/png" },
        { url: "/favicon.ico" },
      ],
      apple: [
        { url: "/branding/jorawar-dham-icon.png", type: "image/png" },
      ],
      shortcut: "/branding/jorawar-dham-icon.png",
    },
    openGraph: {
      title: `${dict.site.name} - आस्था • शक्ति • शांति`,
      description: dict.site.description,
      url: `${baseUrl}/${locale}`,
      siteName: "सिद्ध श्री जोरावर धाम सेवा समिति",
      locale: locale === "hi" ? "hi_IN" : "en_US",
      type: "website",
      images: [
        {
          url: "/branding/jorawar-dham-logo.png",
          width: 1024,
          height: 202,
          alt: "सिद्ध श्री जोरावर धाम सेवा समिति",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${dict.site.name} - आस्था • शक्ति • शांति`,
      description: dict.site.description,
      images: ["/branding/jorawar-dham-logo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isValidLocale(locale)) {
    notFound();
  }

  return (
    <div lang={locale} className="min-h-screen flex flex-col">
      <JsonLd locale={locale} />
      <Navbar locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
      <MobileQuickBar locale={locale} />
    </div>
  );
}
