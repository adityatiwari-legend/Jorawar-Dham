import { Locale } from "@/lib/utils/i18n";

interface JsonLdProps {
  locale: Locale;
}

export default function JsonLd({ locale }: JsonLdProps) {
  const isHi = locale === "hi";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://jorawar.adityatiwaridev.xyz";

  const templeSchema = {
    "@context": "https://schema.org",
    "@type": ["PlaceOfWorship", "HinduTemple"],
    name: isHi ? "सिद्ध श्री जोरावर धाम" : "Siddh Shri Jorawar Dham",
    alternateName: "सिद्ध श्री जोरावर धाम सेवा समिति",
    description: isHi
      ? "राजस्थान के पावन अंचल में स्थित परम पूज्य भगवान जोरावर जी महाराज का पावन तीर्थ एवं साधना स्थली।"
      : "Sacred pilgrimage shrine and spiritual sanctuary of Param Pujya Bhagwan Jorawar Ji Maharaj in Rajasthan.",
    url: `${baseUrl}/${locale}`,
    logo: `${baseUrl}/branding/jorawar-dham-logo.png`,
    image: `${baseUrl}/branding/jorawar-dham-logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "Shri Jorawar Dham",
      addressLocality: "Churu",
      addressRegion: "Rajasthan",
      postalCode: "331001",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "28.293",
      longitude: "74.965",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "05:00",
        closes: "12:30",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "16:00",
        closes: "22:00",
      },
    ],
    isAccessibleForFree: true,
    publicAccess: true,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(templeSchema) }}
    />
  );
}
