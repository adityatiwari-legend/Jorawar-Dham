"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, FileText } from "lucide-react";

interface PageSection {
  id: string;
  pageId: string;
  sectionKey: string;
  titleHi?: string | null;
  titleEn?: string | null;
  subtitleHi?: string | null;
  subtitleEn?: string | null;
  contentHi?: string | null;
  contentEn?: string | null;
  mediaUrl?: string | null;
  sortOrder: number;
}

interface PageData {
  id: string;
  slug: string;
  sections: PageSection[];
}

export default function AdminContentPagesPage() {
  const [pages, setPages] = useState<PageData[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("home");
  const [loading, setLoading] = useState(true);
  const [savingSectionId, setSavingSectionId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchPages = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/content");
      const data = await res.json();
      if (data.success) {
        setPages(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  const activePage = pages.find((p) => p.slug === selectedSlug);

  const handleUpdateSection = async (section: PageSection) => {
    setSavingSectionId(section.id);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(section),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Section '${section.sectionKey}' updated successfully!`);
        setTimeout(() => setSuccessMsg(null), 3000);
      } else {
        alert(data.error || "Save failed");
      }
    } catch {
      alert("Network error updating section");
    } finally {
      setSavingSectionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
            Dynamic Page Editor (CMS)
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Edit text, headings, and narratives in Hindi & English across all public pages.
          </p>
        </div>

        {/* Page Selector Tabs */}
        <div className="flex flex-wrap gap-1.5 bg-white p-1 rounded-xl border border-stone-200 shadow-sm">
          {pages.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedSlug(p.slug)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors ${
                selectedSlug === p.slug
                  ? "bg-saffron-600 text-white shadow-sm"
                  : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
              }`}
            >
              {p.slug}
            </button>
          ))}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-stone-500 flex items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading page content...</span>
        </div>
      ) : !activePage || activePage.sections.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500 space-y-2">
          <FileText className="w-8 h-8 text-stone-400 mx-auto" />
          <p>No editable sections configured for "{selectedSlug}" yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {activePage.sections.map((section) => (
            <div
              key={section.id}
              className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 space-y-6 shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div>
                  <span className="text-xs font-bold text-saffron-700 uppercase tracking-wider block">
                    Section Key: {section.sectionKey}
                  </span>
                  <h3 className="text-lg font-bold text-stone-900 font-serif">
                    {section.titleEn || section.titleHi || "Section Content"}
                  </h3>
                </div>
                <button
                  onClick={() => handleUpdateSection(section)}
                  disabled={savingSectionId === section.id}
                  className="inline-flex items-center gap-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
                >
                  {savingSectionId === section.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Save Changes</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Hindi Column */}
                <div className="space-y-4 bg-sandstone-50/60 p-4 rounded-xl border border-sandstone-200">
                  <span className="text-xs font-bold text-maroon-900 uppercase tracking-wider block border-b border-sandstone-200 pb-1">
                    हिन्दी (Hindi Content)
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      शीर्षक (Hindi Title)
                    </label>
                    <input
                      type="text"
                      value={section.titleHi || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((pg) =>
                            pg.slug === selectedSlug
                              ? {
                                  ...pg,
                                  sections: pg.sections.map((s) =>
                                    s.id === section.id ? { ...s, titleHi: val } : s
                                  ),
                                }
                              : pg
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      उप-शीर्षक (Hindi Subtitle)
                    </label>
                    <input
                      type="text"
                      value={section.subtitleHi || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((pg) =>
                            pg.slug === selectedSlug
                              ? {
                                  ...pg,
                                  sections: pg.sections.map((s) =>
                                    s.id === section.id ? { ...s, subtitleHi: val } : s
                                  ),
                                }
                              : pg
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      मुख्य विवरण (Hindi Content)
                    </label>
                    <textarea
                      rows={4}
                      value={section.contentHi || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((pg) =>
                            pg.slug === selectedSlug
                              ? {
                                  ...pg,
                                  sections: pg.sections.map((s) =>
                                    s.id === section.id ? { ...s, contentHi: val } : s
                                  ),
                                }
                              : pg
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* English Column */}
                <div className="space-y-4 bg-stone-50/60 p-4 rounded-xl border border-stone-200">
                  <span className="text-xs font-bold text-stone-800 uppercase tracking-wider block border-b border-stone-200 pb-1">
                    English Content
                  </span>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      English Title
                    </label>
                    <input
                      type="text"
                      value={section.titleEn || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((pg) =>
                            pg.slug === selectedSlug
                              ? {
                                  ...pg,
                                  sections: pg.sections.map((s) =>
                                    s.id === section.id ? { ...s, titleEn: val } : s
                                  ),
                                }
                              : pg
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      English Subtitle
                    </label>
                    <input
                      type="text"
                      value={section.subtitleEn || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((pg) =>
                            pg.slug === selectedSlug
                              ? {
                                  ...pg,
                                  sections: pg.sections.map((s) =>
                                    s.id === section.id ? { ...s, subtitleEn: val } : s
                                  ),
                                }
                              : pg
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      English Content
                    </label>
                    <textarea
                      rows={4}
                      value={section.contentEn || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setPages((prev) =>
                          prev.map((pg) =>
                            pg.slug === selectedSlug
                              ? {
                                  ...pg,
                                  sections: pg.sections.map((s) =>
                                    s.id === section.id ? { ...s, contentEn: val } : s
                                  ),
                                }
                              : pg
                          )
                        );
                      }}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
