"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { X, ChevronLeft, ChevronRight, Eye, ImageIcon } from "lucide-react";
import { Locale } from "@/lib/utils/i18n";

export interface GalleryPhoto {
  id: string;
  categoryId: string;
  categoryNameHi: string;
  categoryNameEn: string;
  titleHi: string | null;
  titleEn: string | null;
  fileUrl: string;
}

interface GalleryCategoryItem {
  id: string;
  slug: string;
  nameHi: string;
  nameEn: string;
}

interface GalleryViewProps {
  categories: GalleryCategoryItem[];
  photos: GalleryPhoto[];
  locale: Locale;
}

export default function GalleryView({ categories, photos, locale }: GalleryViewProps) {
  const isHi = locale === "hi";
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Filter photos by category
  const filteredPhotos = useMemo(() => {
    if (selectedCategory === "ALL") return photos;
    return photos.filter((p) => p.categoryId === selectedCategory);
  }, [photos, selectedCategory]);

  const activePhoto = lightboxIndex !== null ? filteredPhotos[lightboxIndex] : null;

  // Handle keyboard navigation for Lightbox
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (lightboxIndex === null) return;

      if (e.key === "Escape") {
        setLightboxIndex(null);
      } else if (e.key === "ArrowLeft") {
        setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1));
      } else if (e.key === "ArrowRight") {
        setLightboxIndex((prev) => (prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0));
      }
    },
    [lightboxIndex, filteredPhotos.length]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="space-y-8">
      {/* Category Filter Tabs */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setSelectedCategory("ALL")}
          className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
            selectedCategory === "ALL"
              ? "bg-maroon-900 text-white shadow-md"
              : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
          }`}
        >
          {isHi ? "समस्त छायाचित्र" : "All Photos"}
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all ${
              selectedCategory === cat.id
                ? "bg-maroon-900 text-white shadow-md"
                : "bg-sandstone-100 text-stone-700 hover:bg-sandstone-200"
            }`}
          >
            {isHi ? cat.nameHi : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      {filteredPhotos.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-sandstone-300 p-12 text-center text-stone-500 space-y-2">
          <ImageIcon className="w-8 h-8 mx-auto text-sandstone-400" />
          <p className="text-sm">
            {isHi ? "इस श्रेणी में शीघ्र ही छायाचित्र जोड़े जाएंगे।" : "Photos for this category will be uploaded shortly."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredPhotos.map((photo, idx) => {
            const title = isHi ? photo.titleHi || photo.titleEn : photo.titleEn || photo.titleHi;
            const categoryName = isHi ? photo.categoryNameHi : photo.categoryNameEn;

            return (
              <div
                key={photo.id}
                role="button"
                tabIndex={0}
                onClick={() => setLightboxIndex(idx)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightboxIndex(idx);
                  }
                }}
                className="group relative bg-white rounded-2xl border border-sandstone-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer focus:outline-none focus:ring-2 focus:ring-saffron-500"
                aria-label={title || "View sacred photo"}
              >
                <div className="aspect-[4/3] bg-sandstone-100 overflow-hidden">
                  <img
                    src={photo.fileUrl}
                    alt={title || "Shri Jorawar Dham Sacred Visual"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>

                {/* Overlay hover effect */}
                <div className="absolute inset-0 bg-gradient-to-t from-maroon-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4 text-white">
                  <span className="text-[11px] font-semibold text-gold-300 uppercase tracking-wider">
                    {categoryName}
                  </span>
                  <p className="text-sm font-serif font-bold line-clamp-1">{title}</p>
                </div>

                {/* Subtitle bar for mobile accessibility */}
                <div className="p-3 bg-white border-t border-sandstone-100 sm:hidden">
                  <p className="text-xs font-medium text-stone-800 line-clamp-1">{title}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Accessible Lightbox Modal */}
      {lightboxIndex !== null && activePhoto && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={isHi ? "छायाचित्र विस्तार" : "Photo Lightbox"}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-4 sm:p-8 animate-in fade-in"
        >
          {/* Top Bar */}
          <div className="flex items-center justify-between text-white pb-4 max-w-6xl mx-auto w-full">
            <div>
              <span className="text-xs font-medium text-gold-400 block">
                {isHi ? activePhoto.categoryNameHi : activePhoto.categoryNameEn}
              </span>
              <h3 className="text-base sm:text-xl font-serif font-bold text-white line-clamp-1">
                {isHi ? activePhoto.titleHi || activePhoto.titleEn : activePhoto.titleEn || activePhoto.titleHi}
              </h3>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-400 font-mono">
                {lightboxIndex + 1} / {filteredPhotos.length}
              </span>
              <button
                type="button"
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                aria-label="Close Lightbox"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Center Image with Navigation Buttons */}
          <div className="relative flex-1 flex items-center justify-center max-w-5xl mx-auto w-full my-auto">
            {/* Prev Button */}
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredPhotos.length - 1))
              }
              className="absolute left-2 sm:-left-12 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 z-10"
              aria-label="Previous Photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            {/* Image */}
            <div className="max-h-[75vh] max-w-full flex items-center justify-center overflow-hidden rounded-2xl shadow-2xl border border-white/10">
              <img
                src={activePhoto.fileUrl}
                alt={
                  isHi
                    ? activePhoto.titleHi || "श्री जोरावर धाम छायाचित्र"
                    : activePhoto.titleEn || "Shri Jorawar Dham Photo"
                }
                className="max-h-[75vh] w-auto object-contain select-none"
              />
            </div>

            {/* Next Button */}
            <button
              type="button"
              onClick={() =>
                setLightboxIndex((prev) =>
                  prev !== null && prev < filteredPhotos.length - 1 ? prev + 1 : 0
                )
              }
              className="absolute right-2 sm:-right-12 p-3 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 z-10"
              aria-label="Next Photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Caption Bar */}
          <div className="text-center text-xs text-stone-400 pt-3">
            <span>
              {isHi
                ? "कुंजीपटल सहायता: कीबोर्ड पर Esc दबाकर बंद करें, ← या → दबाकर अगले चित्र पर जाएँ।"
                : "Keyboard shortcuts: Press Esc to close, ← or → to navigate."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
