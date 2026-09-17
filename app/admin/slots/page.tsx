"use client";

import { useState, useEffect } from "react";
import {
  Clock,
  Plus,
  Edit2,
  CheckCircle2,
  XCircle,
  Users,
  IndianRupee,
  RefreshCw,
  AlertCircle,
  Save,
} from "lucide-react";

interface Slot {
  id: string;
  serviceId: string;
  startTime: string;
  endTime: string;
  capacity: number;
  priceInPaise: number;
  isActive: boolean;
  sortOrder: number;
}

interface ServiceWithSlots {
  id: string;
  titleHi: string;
  titleEn: string;
  slug: string;
  slots: Slot[];
}

export default function AdminSlotsPage() {
  const [services, setServices] = useState<ServiceWithSlots[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedServiceId, setSelectedServiceId] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Form State
  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formServiceId, setFormServiceId] = useState("");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("07:00");
  const [capacity, setCapacity] = useState(100);
  const [priceInRupees, setPriceInRupees] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/slots");
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
        if (!selectedServiceId && data.services?.length > 0) {
          setSelectedServiceId(data.services[0].id);
        }
      }
    } catch (err) {
      console.error("Error fetching slots:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = (serviceId: string) => {
    setEditingSlotId(null);
    setFormServiceId(serviceId);
    setStartTime("06:00");
    setEndTime("07:00");
    setCapacity(100);
    setPriceInRupees(0);
    setIsActive(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (serviceId: string, slot: Slot) => {
    setEditingSlotId(slot.id);
    setFormServiceId(serviceId);
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setCapacity(slot.capacity);
    setPriceInRupees(slot.priceInPaise / 100);
    setIsActive(slot.isActive);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");

    try {
      const payload: any = {
        serviceId: formServiceId,
        startTime,
        endTime,
        capacity: Number(capacity),
        priceInPaise: Math.round(Number(priceInRupees) * 100),
        isActive,
      };

      if (editingSlotId) {
        payload.id = editingSlotId;
      }

      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "स्लॉट सहेजने में विफल");
      }

      setModalOpen(false);
      fetchServices();
    } catch (err: any) {
      setErrorMsg(err.message || "त्रुटि उत्पन्न हुई");
    } finally {
      setSaving(false);
    }
  };

  const activeService = services.find((s) => s.id === selectedServiceId) || services[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-saffron-600" />
            समय स्लॉट एवं क्षमता प्रबंधन (Slots & Capacity)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            प्रत्येक सेवा, दर्शन एवं आरती के दैनिक समय स्लॉट, अधिकतम क्षमता एवं शुल्क निर्धारण
          </p>
        </div>
        <button
          onClick={fetchServices}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          रिफ्रेश (Refresh)
        </button>
      </div>

      {/* Service Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        {services.map((srv) => (
          <button
            key={srv.id}
            onClick={() => setSelectedServiceId(srv.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedServiceId === srv.id
                ? "bg-saffron-600 text-white shadow-md shadow-saffron-600/20"
                : "bg-white text-stone-600 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            {srv.titleHi} ({srv.slots.length} स्लॉट)
          </button>
        ))}
      </div>

      {/* Slot Management Card */}
      {activeService && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-stone-900">{activeService.titleHi}</h2>
              <span className="text-xs text-stone-400">{activeService.titleEn} (Slug: {activeService.slug})</span>
            </div>
            <button
              onClick={() => openCreateModal(activeService.id)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> नया स्लॉट जोड़ें (Add Slot)
            </button>
          </div>

          {activeService.slots.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Clock className="w-10 h-10 mx-auto mb-2 text-stone-300" />
              <p className="font-semibold text-stone-600">इस सेवा के लिए कोई स्लॉट सक्रिय नहीं है</p>
              <p className="text-xs text-stone-400 mt-1">नया स्लॉट जोड़ने के लिए ऊपर दिए गए बटन पर क्लिक करें।</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeService.slots.map((slot) => (
                <div
                  key={slot.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    slot.isActive
                      ? "border-stone-200 bg-stone-50/50 hover:border-saffron-300 hover:bg-saffron-50/20"
                      : "border-stone-200 bg-stone-100/60 opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-base font-bold text-stone-900 font-mono">
                      {slot.startTime} - {slot.endTime}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        slot.isActive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                          : "bg-stone-200 text-stone-600"
                      }`}
                    >
                      {slot.isActive ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                      {slot.isActive ? "सक्रिय" : "निष्क्रिय"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-stone-600">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <Users className="w-3.5 h-3.5 text-stone-400" /> कुल क्षमता (Capacity):
                      </span>
                      <span className="font-bold text-stone-800">{slot.capacity} श्रद्धालु / स्लॉट</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-stone-500">
                        <IndianRupee className="w-3.5 h-3.5 text-stone-400" /> शुल्क (Fee):
                      </span>
                      <span className="font-bold text-stone-900">
                        {slot.priceInPaise === 0 ? "निःशुल्क" : `₹${slot.priceInPaise / 100}`}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-stone-200/80 flex justify-end">
                    <button
                      onClick={() => openEditModal(activeService.id, slot)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-stone-100 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 transition"
                    >
                      <Edit2 className="w-3 h-3 text-stone-500" /> संशोधित करें (Edit)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-lg text-stone-900">
                {editingSlotId ? "स्लॉट संशोधित करें (Edit Slot)" : "नया स्लॉट जोड़ें (Add Slot)"}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    प्रारंभ समय (Start Time)
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-saffron-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1">
                    समाप्ति समय (End Time)
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 border border-stone-300 rounded-xl font-mono text-sm focus:ring-2 focus:ring-saffron-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  प्रति स्लॉट क्षमता (Max Capacity)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  इस समय अंतराल में अधिकतम अनुमत श्रद्धालुओं की संख्या
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">
                  शुल्क ₹ (Price in INR - 0 for Free)
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={priceInRupees}
                  onChange={(e) => setPriceInRupees(Number(e.target.value))}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500"
                />
                <span className="text-[11px] text-stone-400 mt-0.5 block">
                  निःशुल्क दर्शन हेतु 0 दर्ज करें। राशि स्वतः पैसों में रूपांतरित होगी।
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-saffron-600 rounded focus:ring-saffron-500"
                />
                <label htmlFor="isActive" className="text-xs font-semibold text-stone-800">
                  यह स्लॉट बुकिंग हेतु सक्रिय (Active) रखें
                </label>
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-700 rounded-xl text-xs font-semibold hover:bg-stone-100"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-bold disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {saving ? "सहेज रहे हैं..." : "स्लॉट सहेजें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
