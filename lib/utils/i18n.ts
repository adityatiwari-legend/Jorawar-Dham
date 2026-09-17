import hiCommon from "@/messages/hi/common.json";
import enCommon from "@/messages/en/common.json";

export type Locale = "hi" | "en";
export const LOCALES: Locale[] = ["hi", "en"];
export const DEFAULT_LOCALE: Locale = "hi";

export const dictionaries = {
  hi: hiCommon,
  en: enCommon,
};

export function isValidLocale(locale: string): locale is Locale {
  return LOCALES.includes(locale as Locale);
}

export function getDictionary(locale: Locale) {
  return dictionaries[locale] || dictionaries[DEFAULT_LOCALE];
}

/**
 * Automatically resolves localized field with graceful fallback
 * Example: localize(notice, "hi", "title") => notice.titleHi || notice.titleEn
 */
export function localize<T extends Record<string, unknown>>(
  item: T | null | undefined,
  locale: Locale,
  field: string
): string {
  if (!item) return "";

  const capField = field.charAt(0).toUpperCase() + field.slice(1);
  const primaryKey = locale === "hi" ? `${field}Hi` : `${field}En`;
  const fallbackKey = locale === "hi" ? `${field}En` : `${field}Hi`;

  const primaryVal = item[primaryKey] ?? item[`${field}_${locale}`];
  if (typeof primaryVal === "string" && primaryVal.trim() !== "") {
    return primaryVal;
  }

  const fallbackVal = item[fallbackKey] ?? item[`${field}_${locale === "hi" ? "en" : "hi"}`];
  if (typeof fallbackVal === "string" && fallbackVal.trim() !== "") {
    return fallbackVal;
  }

  return "";
}

/**
 * Format date in Indian spiritual / administrative format
 */
export function formatLocalizedDate(date: Date | string | number, locale: Locale): string {
  try {
    const d = typeof date === "object" ? date : new Date(date);
    return new Intl.DateTimeFormat(locale === "hi" ? "hi-IN" : "en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(d);
  } catch {
    return String(date);
  }
}
