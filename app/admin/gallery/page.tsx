"use client";

import { useState, useEffect } from "react";
import { Upload, Trash2, Loader2, Image as ImageIcon, CheckCircle, AlertTriangle } from "lucide-react";

interface GalleryItem {
  id: string;
  categoryId: string;
  titleHi?: string | null;
  titleEn?: string | null;
  fileUrl: string;
  fileKey: string;
  mimeType: string;
  sizeBytes: number;
}

interface GalleryCategory {
  id: string;
  slug: string;
  nameHi: string;
  nameEn: string;
  items: GalleryItem[];
}

export default function AdminGalleryPage() {
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [titleHi, setTitleHi] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchGallery = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/gallery");
      const data = await res.json();
      if (data.success) {
        setCategories(data.data);
        if (data.data.length > 0 && !selectedCategoryId) {
          setSelectedCategoryId(data.data[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !selectedCategoryId) {
      setError("Please select both a file and a destination category.");
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      // 1. Upload file to /api/media/upload
      const formData = new FormData();
      formData.append("file", selectedFile);

      const uploadRes = await fetch("/api/media/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || "File upload rejected.");
      }

      const media = uploadData.data;

      // 2. Attach uploaded file to GalleryItem
      const itemRes = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categoryId: selectedCategoryId,
          titleHi: titleHi || selectedFile.name,
          titleEn: titleEn || selectedFile.name,
          fileUrl: media.fileUrl,
          fileKey: media.fileKey,
          mimeType: media.mimeType,
          sizeBytes: media.sizeBytes,
        }),
      });

      const itemData = await itemRes.json();
      if (!itemRes.ok || !itemData.success) {
        throw new Error(itemData.error || "Failed to record gallery item.");
      }

      setSuccess("Media uploaded and cataloged securely!");
      setSelectedFile(null);
      setTitleHi("");
      setTitleEn("");
      fetchGallery();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failure.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this media file?")) return;

    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchGallery();
      }
    } catch {
      alert("Error deleting item.");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
          Sacred Photo Gallery & Media Storage
        </h1>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          Upload and organize temple photographs. Files are validated via magic bytes and stored outside the public web root.
        </p>
      </div>

      {/* Upload Box */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-stone-900 font-serif flex items-center gap-2">
          <Upload className="w-5 h-5 text-saffron-600" />
          <span>Upload New Temple Photograph</span>
        </h2>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Category *
              </label>
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nameEn} ({c.nameHi})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Hindi Caption / Title
              </label>
              <input
                type="text"
                value={titleHi}
                onChange={(e) => setTitleHi(e.target.value)}
                placeholder="उदा. गर्भगृह आरती दर्शन"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                English Caption / Title
              </label>
              <input
                type="text"
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="e.g. Sanctum Morning Aarti"
                className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1">
              Select Image File * (JPG, PNG, WEBP — Max 5MB)
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
              className="w-full text-xs text-stone-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-saffron-50 file:text-saffron-700 hover:file:bg-saffron-100 cursor-pointer"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={uploading || !selectedFile}
              className="inline-flex items-center gap-2 bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>Upload to Storage</span>
            </button>
          </div>
        </form>
      </div>

      {/* Categories & Items Grid */}
      {loading ? (
        <div className="p-12 text-center text-stone-500 flex items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading media catalog...</span>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => (
            <div key={cat.id} className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-stone-900 font-serif border-b border-stone-200 pb-2 flex items-center justify-between">
                <span>
                  {cat.nameEn} ({cat.nameHi})
                </span>
                <span className="text-xs font-normal text-stone-500">
                  {cat.items.length} photo(s)
                </span>
              </h3>

              {cat.items.length === 0 ? (
                <div className="p-6 text-center text-xs text-stone-400">
                  No images in this category yet.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {cat.items.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-xl border border-stone-200 overflow-hidden bg-stone-50"
                    >
                      <div className="aspect-square flex items-center justify-center overflow-hidden">
                        <img
                          src={item.fileUrl}
                          alt={item.titleEn || "Gallery Item"}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="p-2 text-[11px] bg-white border-t border-stone-100 flex items-center justify-between">
                        <span className="truncate text-stone-700 font-medium" title={item.titleEn || ""}>
                          {item.titleEn || item.titleHi || "Photo"}
                        </span>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="text-stone-400 hover:text-red-600 p-1 shrink-0"
                          title="Delete photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
