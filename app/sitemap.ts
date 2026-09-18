import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://jorawar.adityatiwaridev.xyz";

  const publicRoutes = [
    { path: "", priority: 1.0, changeFrequency: "daily" as const },
    { path: "/bhagwan-jorawar", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/darshan", priority: 0.95, changeFrequency: "daily" as const },
    { path: "/aarti", priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/seva", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/events", priority: 0.85, changeFrequency: "daily" as const },
    { path: "/gallery", priority: 0.8, changeFrequency: "weekly" as const },
    { path: "/donation", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/visitor-info", priority: 0.85, changeFrequency: "weekly" as const },
    { path: "/history", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/dham", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/about", priority: 0.75, changeFrequency: "monthly" as const },
    { path: "/contact", priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/faq", priority: 0.75, changeFrequency: "weekly" as const },
  ];

  const sitemapEntries: MetadataRoute.Sitemap = [];

  for (const route of publicRoutes) {
    for (const locale of ["hi", "en"]) {
      const url = `${baseUrl}/${locale}${route.path}`;
      sitemapEntries.push({
        url,
        lastModified: new Date(),
        changeFrequency: route.changeFrequency,
        priority: route.priority,
        alternates: {
          languages: {
            hi: `${baseUrl}/hi${route.path}`,
            en: `${baseUrl}/en${route.path}`,
          },
        },
      });
    }
  }

  return sitemapEntries;
}
