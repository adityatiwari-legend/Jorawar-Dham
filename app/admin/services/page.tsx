"use client";

import { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  Save,
  Clock,
  Trash2,
  Eye,
  X,
} from "lucide-react";

interface AdminService {
  id: string;
  slug: string;
  titleHi: string;
  titleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  timingHi?: string | null;
  timingEn?: string | null;
  guidelinesHi?: string | null;
  guidelinesEn?: string | null;
  capacity?: number | null;
  price?: number | null;
  imageUrl?: string | null;
  isActive: boolean;
  sortOrder: number;
  _count?: {
    slots: number;
    bookings: number;
  };
}

export default function AdminServicesPage() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [formSlug, setFormSlug] = useState("");
  const [formTitleHi, setFormTitleHi] = useState("");
  const [formTitleEn, setFormTitleEn] = useState("");
  const [formDescHi, setFormDescHi] = useState("");
  const [formDescEn, setFormDescEn] = useState("");
  const [formTimingHi, setFormTimingHi] = useState("");
  const [formTimingEn, setFormTimingEn] = useState("");
  const [formGuidelinesHi, setFormGuidelinesHi] = useState("");
  const [formGuidelinesEn, setFormGuidelinesEn] = useState("");
  const [formCapacity, setFormCapacity] = useState(50);
  const [formPrice, setFormPrice] = useState(0);
  const [formImageUrl, setFormImageUrl] = useState("");
  const [formIsActive, setFormIsActive] = useState(true);
  const [formSortOrder, setFormSortOrder] = useState(0);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services");
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingServiceId(null);
    setFormSlug("");
    setFormTitleHi("");
    setFormTitleEn("");
    setFormDescHi("");
    setFormDescEn("");
    setFormTimingHi("");
    setFormTimingEn("");
    setFormGuidelinesHi("");
    setFormGuidelinesEn("");
    setFormCapacity(50);
    setFormPrice(0);
    setFormImageUrl("");
    setFormIsActive(true);
    setFormSortOrder(services.length + 1);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (service: AdminService) => {
    setEditingServiceId(service.id);
    setFormSlug(service.slug);
    setFormTitleHi(service.titleHi);
    setFormTitleEn(service.titleEn);
    setFormDescHi(service.descriptionHi);
    setFormDescEn(service.descriptionEn);
    setFormTimingHi(service.timingHi || "");
    setFormTimingEn(service.timingEn || "");
    setFormGuidelinesHi(service.guidelinesHi || "");
    setFormGuidelinesEn(service.guidelinesEn || "");
    setFormCapacity(service.capacity || 50);
    setFormPrice(service.price || 0);
    setFormImageUrl(service.imageUrl || "");
    setFormIsActive(service.isActive);
    setFormSortOrder(service.sortOrder);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleToggleStatus = async (service: AdminService) => {
    try {
      const res = await fetch(`/api/admin/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !service.isActive }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchServices();
      }
    } catch (err) {
      console.error("Toggle error:", err);
    }
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const payload = {
        slug: formSlug.trim().toLowerCase().replace(/\s+/g, "-"),
        titleHi: formTitleHi.trim(),
        titleEn: formTitleEn.trim(),
        descriptionHi: formDescHi.trim(),
        descriptionEn: formDescEn.trim(),
        timingHi: formTimingHi.trim() || null,
        timingEn: formTimingEn.trim() || null,
        guidelinesHi: formGuidelinesHi.trim() || null,
        guidelinesEn: formGuidelinesEn.trim() || null,
        capacity: Number(formCapacity),
        price: Number(formPrice),
        imageUrl: formImageUrl.trim() || null,
        isActive: formIsActive,
        sortOrder: Number(formSortOrder),
      };

      let res;
      if (editingServiceId) {
        res = await fetch(`/api/admin/services/${editingServiceId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch("/api/admin/services", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.error || "सेवा सुरक्षित करने में त्रुटि");
        return;
      }

      setModalOpen(false);
      await fetchServices();
    } catch {
      setErrorMsg("सर्वर से संपर्क विफल");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-saffron-600" />
            दर्शन एवं सेवा प्रबंधन (Service Management)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            दैनिक दर्शन, महाआरती, अनुष्ठान एवं विशेष सेवा प्रसादम का पूर्ण नियंत्रण व मूल्य निर्धारण
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchServices}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 bg-maroon-800 hover:bg-maroon-900 text-white rounded-xl text-xs font-semibold shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>नई सेवा जोड़ें (Add Service)</span>
          </button>
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">सेवा नाम (Title)</th>
                <th className="py-3.5 px-4">स्लग (Slug)</th>
                <th className="py-3.5 px-4 text-center">मूल्य (Price)</th>
                <th className="py-3.5 px-4 text-center">क्षमता (Capacity)</th>
                <th className="py-3.5 px-4 text-center">स्लॉट्स (Slots)</th>
                <th className="py-3.5 px-4 text-center">कुल बुकिंग्स</th>
                <th className="py-3.5 px-4 text-center">स्थिति (Status)</th>
                <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                    <span>सेवाएं लोड हो रही हैं...</span>
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    कोई सेवा उपलब्ध नहीं है। कृपया नई सेवा जोड़ें।
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-4 px-4">
                      <strong className="block text-stone-900 font-serif text-sm font-bold">
                        {service.titleHi}
                      </strong>
                      <span className="text-stone-500 text-[11px] block">{service.titleEn}</span>
                      {service.timingHi && (
                        <span className="text-amber-800 text-[10px] block mt-0.5">
                          ⏰ {service.timingHi}
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 font-mono text-stone-600 text-[11px]">
                      {service.slug}
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-bold">
                      {service.price === 0 || !service.price ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                          निःशुल्क
                        </span>
                      ) : (
                        <span className="text-stone-900">₹{service.price}</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center font-mono text-stone-800">
                      {service.capacity || "असीमित"}
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-bold text-stone-800">
                      {service._count?.slots || 0}
                    </td>

                    <td className="py-4 px-4 text-center font-mono font-bold text-maroon-800">
                      {service._count?.bookings || 0}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(service)}
                        className={`px-3 py-1 rounded-full text-[10px] font-bold transition ${
                          service.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                        }`}
                      >
                        {service.isActive ? "सक्रिय (ACTIVE)" : "निष्क्रिय (OFF)"}
                      </button>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(service)}
                        className="p-1.5 rounded-lg text-stone-600 hover:text-maroon-800 hover:bg-stone-100 transition"
                        title="Edit Service"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <h3 className="font-bold text-lg text-stone-900">
                {editingServiceId ? "सेवा संपादित करें (Edit Service)" : "नई सेवा जोड़ें (Add New Service)"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveService} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">सेवा नाम (हिंदी): *</label>
                  <input
                    type="text"
                    required
                    value={formTitleHi}
                    onChange={(e) => setFormTitleHi(e.target.value)}
                    placeholder="e.g. महाआरती एवं दिव्य दर्शन"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Service Title (English): *</label>
                  <input
                    type="text"
                    required
                    value={formTitleEn}
                    onChange={(e) => setFormTitleEn(e.target.value)}
                    placeholder="e.g. Maha Aarti & Darshan"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">स्लग (Slug / URL Identifier): *</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingServiceId}
                    value={formSlug}
                    onChange={(e) => setFormSlug(e.target.value)}
                    placeholder="e.g. maha-aarti"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none disabled:bg-stone-100"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">शुल्क (Price in INR - 0 for Free): *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">प्रति स्लॉट क्षमता (Capacity): *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={formCapacity}
                    onChange={(e) => setFormCapacity(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">क्रम संख्या (Sort Order):</label>
                  <input
                    type="number"
                    value={formSortOrder}
                    onChange={(e) => setFormSortOrder(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">विवरण (हिंदी): *</label>
                <textarea
                  required
                  rows={2}
                  value={formDescHi}
                  onChange={(e) => setFormDescHi(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">Description (English): *</label>
                <textarea
                  required
                  rows={2}
                  value={formDescEn}
                  onChange={(e) => setFormDescEn(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">समय निर्देश (हिंदी - Timing):</label>
                  <input
                    type="text"
                    value={formTimingHi}
                    onChange={(e) => setFormTimingHi(e.target.value)}
                    placeholder="e.g. प्रातः 06:00 से 07:00 बजे तक"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">Timing Description (English):</label>
                  <input
                    type="text"
                    value={formTimingEn}
                    onChange={(e) => setFormTimingEn(e.target.value)}
                    placeholder="e.g. 06:00 AM to 07:00 AM"
                    className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">दिशानिर्देश व नियम (हिंदी - Guidelines):</label>
                <input
                  type="text"
                  value={formGuidelinesHi}
                  onChange={(e) => setFormGuidelinesHi(e.target.value)}
                  placeholder="e.g. पारंपरिक परिधान अनिवार्य है"
                  className="w-full p-2.5 rounded-xl border border-stone-300 focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="form-active-check"
                  checked={formIsActive}
                  onChange={(e) => setFormIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-maroon-800 focus:ring-saffron-500"
                />
                <label htmlFor="form-active-check" className="font-medium text-stone-800 cursor-pointer">
                  यह सेवा श्रद्धालुओं हेतु तत्काल बुकिंग के लिए सक्रिय रखें (Active for booking)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  रद्द करें
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold shadow flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? "सुरक्षित हो रहा है..." : "सुरक्षित करें (Save Service)"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
