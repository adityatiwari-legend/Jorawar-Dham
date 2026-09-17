"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Pin, AlertTriangle, Check, X, Loader2 } from "lucide-react";
import type { Notice, NoticePriority } from "@prisma/client";

interface NoticeFormData {
  titleHi: string;
  titleEn: string;
  bodyHi: string;
  bodyEn: string;
  priority: NoticePriority;
  isPinned: boolean;
  isActive: boolean;
}

export default function AdminNoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<NoticeFormData>({
    titleHi: "",
    titleEn: "",
    bodyHi: "",
    bodyEn: "",
    priority: "NORMAL" as NoticePriority,
    isPinned: false,
    isActive: true,
  });

  const fetchNotices = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/notices");
      const data = await res.json();
      if (data.success) {
        setNotices(data.data);
      }
    } catch {
      setError("Failed to load notices.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const openCreateModal = () => {
    setEditingNotice(null);
    setFormData({
      titleHi: "",
      titleEn: "",
      bodyHi: "",
      bodyEn: "",
      priority: "NORMAL" as NoticePriority,
      isPinned: false,
      isActive: true,
    });
    setError(null);
    setModalOpen(true);
  };

  const openEditModal = (notice: Notice) => {
    setEditingNotice(notice);
    setFormData({
      titleHi: notice.titleHi,
      titleEn: notice.titleEn,
      bodyHi: notice.bodyHi,
      bodyEn: notice.bodyEn,
      priority: notice.priority,
      isPinned: notice.isPinned,
      isActive: notice.isActive,
    });
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const url = "/api/admin/notices";
      const method = editingNotice ? "PUT" : "POST";
      const payload = editingNotice ? { ...formData, id: editingNotice.id } : formData;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Operation failed.");
      }

      setModalOpen(false);
      fetchNotices();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you wish to delete this notice? This action is irreversible.")) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/notices?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        fetchNotices();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Network error deleting notice.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
            Notices & Announcements
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage live temple notices, priority warnings, and announcements in Hindi & English.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Publish Notice</span>
        </button>
      </div>

      {/* Notices Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Loading announcements...</span>
          </div>
        ) : notices.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No notices published. Click "Publish Notice" to create one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase text-[11px] font-semibold text-stone-500">
                <tr>
                  <th className="py-3 px-4">Title (Hindi & English)</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Pinned</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Published</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {notices.map((n) => (
                  <tr key={n.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-sm">
                      <span className="block font-bold text-stone-900 truncate">{n.titleHi}</span>
                      <span className="block text-stone-500 truncate">{n.titleEn}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          n.priority === "URGENT"
                            ? "bg-red-100 text-red-800"
                            : n.priority === "LOW"
                            ? "bg-stone-100 text-stone-700"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {n.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {n.isPinned ? (
                        <span className="text-saffron-600 flex items-center gap-1 font-semibold text-[11px]">
                          <Pin className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="text-stone-400">No</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                          n.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-200 text-stone-600"
                        }`}
                      >
                        {n.isActive ? "Active" : "Archived"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(n.publishedAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap space-x-2">
                      <button
                        onClick={() => openEditModal(n)}
                        className="p-1 text-stone-500 hover:text-saffron-600 transition-colors"
                        title="Edit Notice"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(n.id)}
                        className="p-1 text-stone-500 hover:text-red-600 transition-colors"
                        title="Delete Notice"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bilingual Modal Form */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h2 className="text-xl font-bold text-stone-900 font-serif">
                {editingNotice ? "Edit Notice" : "Publish New Notice"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    शीर्षक (Hindi Title) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleHi}
                    onChange={(e) => setFormData({ ...formData, titleHi: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    placeholder="उदा. दर्शन समय में परिवर्तन"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">
                    English Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.titleEn}
                    onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                    placeholder="e.g. Revised Darshan Timings"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  विस्तृत विवरण (Hindi Body) *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.bodyHi}
                  onChange={(e) => setFormData({ ...formData, bodyHi: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  placeholder="हिंदी में सूचना का विवरण यहाँ लिखें..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  English Body *
                </label>
                <textarea
                  rows={3}
                  required
                  value={formData.bodyEn}
                  onChange={(e) => setFormData({ ...formData, bodyEn: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  placeholder="Type notice details in English..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-stone-800 mb-1">Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) =>
                      setFormData({ ...formData, priority: e.target.value as NoticePriority })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none bg-white"
                  >
                    <option value="LOW">Low</option>
                    <option value="NORMAL">Normal</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isPinned"
                    checked={formData.isPinned}
                    onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                    className="w-4 h-4 text-saffron-600 rounded border-stone-300 focus:ring-saffron-500"
                  />
                  <label htmlFor="isPinned" className="text-xs font-semibold text-stone-800">
                    Pin to Top
                  </label>
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-saffron-600 rounded border-stone-300 focus:ring-saffron-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-semibold text-stone-800">
                    Active on Site
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 rounded-xl text-xs font-semibold text-stone-700 hover:bg-stone-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingNotice ? "Update Notice" : "Publish Notice"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
