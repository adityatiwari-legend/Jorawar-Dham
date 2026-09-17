"use client";

import { useState, useMemo } from "react";
import { ChevronDown, Search, HelpCircle } from "lucide-react";
import type { Faq } from "@prisma/client";
import { Locale } from "@/lib/utils/i18n";

interface FaqAccordionProps {
  faqs: Faq[];
  locale: Locale;
}

export default function FaqAccordion({ faqs, locale }: FaqAccordionProps) {
  const isHi = locale === "hi";
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(faqs[0]?.id || null);

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    faqs.forEach((f) => {
      if (f.category) set.add(f.category);
    });
    return Array.from(set);
  }, [faqs]);

  // Filtered FAQs
  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesCategory = activeCategory === "ALL" || faq.category === activeCategory;
      const q = (isHi ? faq.questionHi : faq.questionEn).toLowerCase();
      const a = (isHi ? faq.answerHi : faq.answerEn).toLowerCase();
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch = !query || q.includes(query) || a.includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [faqs, activeCategory, searchQuery, isHi]);

  const categoryLabels: Record<string, { hi: string; en: string }> = {
    ALL: { hi: "सभी प्रश्न", en: "All Questions" },
    DARSHAN: { hi: "दर्शन व आरती", en: "Darshan & Aarti" },
    STAY: { hi: "धर्मशाला व आवास", en: "Accommodation" },
    SEVA: { hi: "पूजा व सेवा", en: "Pooja & Seva" },
    GENERAL: { hi: "सामान्य जानकारी", en: "General" },
  };

  const getCategoryLabel = (cat: string) => {
    if (categoryLabels[cat]) {
      return isHi ? categoryLabels[cat].hi : categoryLabels[cat].en;
    }
    return cat;
  };

  const toggleAccordion = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      {/* Search & Category Filter Bar */}
      <div className="space-y-4">
        {/* Search input */}
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isHi ? "प्रश्नों में खोजें (उदा. समय, धर्मशाला, दान)..." : "Search questions (e.g. timings, stay, donation)..."}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-sandstone-300 bg-white text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-saffron-500 shadow-sm text-sm"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveCategory("ALL")}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
              activeCategory === "ALL"
                ? "bg-maroon-900 text-white shadow-sm"
                : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
            }`}
          >
            {getCategoryLabel("ALL")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                activeCategory === cat
                  ? "bg-maroon-900 text-white shadow-sm"
                  : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
              }`}
            >
              {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      {filteredFaqs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-sandstone-300 p-12 text-center text-stone-500 space-y-2">
          <HelpCircle className="w-8 h-8 mx-auto text-sandstone-400" />
          <p className="text-base font-medium">
            {isHi ? "आपकी खोज के अनुसार कोई प्रश्न नहीं मिला।" : "No questions matched your search query."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFaqs.map((faq) => {
            const isOpen = expandedId === faq.id;
            const question = isHi ? faq.questionHi : faq.questionEn;
            const answer = isHi ? faq.answerHi : faq.answerEn;

            return (
              <div
                key={faq.id}
                className="bg-white rounded-2xl border border-sandstone-200 shadow-sm overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(faq.id)}
                  aria-expanded={isOpen}
                  className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left hover:bg-sandstone-50 transition-colors focus:outline-none focus:ring-2 focus:ring-inset focus:ring-saffron-500"
                >
                  <span className="font-serif font-bold text-stone-900 text-base sm:text-lg pr-2 leading-snug">
                    {question}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      isOpen ? "bg-maroon-900 text-white rotate-180" : "bg-sandstone-100 text-stone-600"
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 pt-1 text-stone-700 text-sm sm:text-base leading-relaxed border-t border-sandstone-100">
                    <p className="whitespace-pre-line">{answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
