import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileQuickBar from "@/components/public/MobileQuickBar";
import JsonLd from "@/components/public/JsonLd";
import { Locale, LOCALES, isValidLocale, getDictionary } from "@/lib/utils/i18n";

export async function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isValidLocale(locale)) return {};

  const dict = getDictionary(locale);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://jorawardham.org";

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
    openGraph: {
      title: `${dict.site.name} - आस्था • शक्ति • शांति`,
      description: dict.site.description,
      url: `${baseUrl}/${locale}`,
      siteName: dict.site.name,
      locale: locale === "hi" ? "hi_IN" : "en_US",
      type: "website",
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
