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
  Calendar as CalendarIcon,
  Copy,
  ChevronLeft,
  ChevronRight,
  List,
  Layers,
  X,
} from "lucide-react";

interface Slot {
  id: string;
  serviceId: string;
  date?: string | null;
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
  const [viewMode, setViewMode] = useState<"LIST" | "CALENDAR">("CALENDAR");

  // Calendar State
  const [calendarYear, setCalendarYear] = useState<number>(new Date().getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(new Date().getMonth()); // 0-indexed
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [calendarAvailability, setCalendarAvailability] = useState<Record<string, any>>({});
  const [calendarLoading, setCalendarLoading] = useState(false);

  // Form State
  const [modalOpen, setModalOpen] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [editingSlotId, setEditingSlotId] = useState<string | null>(null);
  const [formServiceId, setFormServiceId] = useState("");
  const [formDate, setFormDate] = useState<string>("");
  const [startTime, setStartTime] = useState("06:00 AM");
  const [endTime, setEndTime] = useState("07:00 AM");
  const [capacity, setCapacity] = useState(100);
  const [priceInRupees, setPriceInRupees] = useState(0);
  const [isActive, setIsActive] = useState(true);

  // Duplicate Form State
  const [duplicateTargetDates, setDuplicateTargetDates] = useState<string>("");

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

  const selectedService = services.find((s) => s.id === selectedServiceId) || services[0];

  // Fetch 30-60 day calendar availability whenever selected service or month changes
  useEffect(() => {
    if (!selectedService) return;

    async function loadCalendar() {
      setCalendarLoading(true);
      try {
        const res = await fetch(`/api/services/${selectedService.slug}/availability?days=60`);
        const data = await res.json();
        if (data.success && data.dates) {
          const map: Record<string, any> = {};
          data.dates.forEach((d: any) => {
            map[d.date] = d;
          });
          setCalendarAvailability(map);
        }
      } catch (err) {
        console.error("Calendar availability load error:", err);
      } finally {
        setCalendarLoading(false);
      }
    }

    loadCalendar();
  }, [selectedService]);

  const openCreateModal = (serviceId: string, specificDate?: string) => {
    setEditingSlotId(null);
    setFormServiceId(serviceId);
    setFormDate(specificDate || "");
    setStartTime("06:00 AM");
    setEndTime("07:00 AM");
    setCapacity(100);
    setPriceInRupees(0);
    setIsActive(true);
    setErrorMsg("");
    setModalOpen(true);
  };

  const openEditModal = (serviceId: string, slot: Slot) => {
    setEditingSlotId(slot.id);
    setFormServiceId(serviceId);
    setFormDate(slot.date || "");
    setStartTime(slot.startTime);
    setEndTime(slot.endTime);
    setCapacity(slot.capacity);
    setPriceInRupees(slot.priceInPaise / 100);
    setIsActive(slot.isActive);
    setErrorMsg("");
    setModalOpen(true);
  };

  const handleToggleSlotStatus = async (slot: Slot) => {
    try {
      const res = await fetch("/api/admin/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: slot.id,
          serviceId: slot.serviceId,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          priceInPaise: slot.priceInPaise,
          isActive: !slot.isActive,
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchServices();
      }
    } catch (err) {
      console.error("Slot toggle error:", err);
    }
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

      if (formDate) {
        payload.date = formDate;
      }

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
      await fetchServices();
    } catch (err: any) {
      setErrorMsg(err.message || "त्रुटि उत्पन्न हुई");
    } finally {
      setSaving(false);
    }
  };

  const handleDuplicateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTargetDates.trim()) return;

    setSaving(true);
    setErrorMsg("");

    try {
      // Target dates comma-separated
      const dates = duplicateTargetDates
        .split(",")
        .map((d) => d.trim())
        .filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d));

      if (dates.length === 0) {
        setErrorMsg("कृपया YYYY-MM-DD प्रारूप में मान्य तिथियां अल्पविराम (,) से अलग करके दर्ज करें");
        setSaving(false);
        return;
      }

      // For each target date, copy all active slots of current service
      const currentSlots = selectedService.slots.filter((s) => s.isActive);
      for (const targetDate of dates) {
        for (const s of currentSlots) {
          await fetch("/api/admin/slots", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              serviceId: selectedService.id,
              date: targetDate,
              startTime: s.startTime,
              endTime: s.endTime,
              capacity: s.capacity,
              priceInPaise: s.priceInPaise,
              isActive: true,
            }),
          });
        }
      }

      setDuplicateModalOpen(false);
      setDuplicateTargetDates("");
      await fetchServices();
    } catch {
      setErrorMsg("डुप्लीकेट स्लॉट निर्माण में त्रुटि");
    } finally {
      setSaving(false);
    }
  };

  // Calendar Day Generation
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0 = Sun
  const monthName = new Date(calendarYear, calendarMonth, 1).toLocaleString("hi-IN", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-saffron-600" />
            स्लॉट व क्षमता प्रबंधन (Slot & Capacity Management)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            दैनिक दर्शन समय सारिणी, अधिकतम श्रद्धालु क्षमता एवं वास्तविक समय उपलब्धता
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-200 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode("CALENDAR")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "CALENDAR"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-saffron-600" />
              <span>कैलेंडर (Calendar)</span>
            </button>

            <button
              type="button"
              onClick={() => setViewMode("LIST")}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                viewMode === "LIST"
                  ? "bg-white text-stone-900 shadow-sm"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <List className="w-3.5 h-3.5 text-saffron-600" />
              <span>सूची (List)</span>
            </button>
          </div>

          <button
            onClick={fetchServices}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Service Selector Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-stone-200">
        {services.map((srv) => (
          <button
            key={srv.id}
            type="button"
            onClick={() => setSelectedServiceId(srv.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap ${
              (selectedService?.id === srv.id)
                ? "bg-maroon-800 text-white shadow-sm"
                : "bg-white text-stone-700 hover:bg-stone-100 border border-stone-200"
            }`}
          >
            <span>{srv.titleHi}</span>
            <span className="ml-2 font-mono text-[10px] opacity-80">({srv.slots.length} स्लॉट)</span>
          </button>
        ))}
      </div>

      {selectedService && (
        <>
          {/* VIEW MODE 1: INTERACTIVE CALENDAR */}
          {viewMode === "CALENDAR" && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Calendar Grid (Col-span 8) */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
                {/* Month Navigator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-saffron-600" />
                    <h2 className="text-base font-bold text-stone-900 capitalize">
                      {monthName}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear((y) => y - 1);
                        } else {
                          setCalendarMonth((m) => m - 1);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear((y) => y + 1);
                        } else {
                          setCalendarMonth((m) => m + 1);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-stone-500 pb-2 border-b border-stone-100">
                  <span>रवि (Sun)</span>
                  <span>सोम (Mon)</span>
                  <span>मंगल (Tue)</span>
                  <span>बुध (Wed)</span>
                  <span>गुरु (Thu)</span>
                  <span>शुक्र (Fri)</span>
                  <span>शनि (Sat)</span>
                </div>

                {/* Date Cells */}
                <div className="grid grid-cols-7 gap-1.5">
                  {/* Empty leading cells */}
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="min-h-[75px] rounded-xl bg-stone-50/50" />
                  ))}

                  {/* Day cells */}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                    const avail = calendarAvailability[dateStr];
                    const isSelected = selectedCalendarDate === dateStr;

                    const isClosed = avail?.status === "CLOSED";
                    const isFull = avail?.status === "FULL";
                    const isLimited = avail?.status === "LIMITED";
                    const isAvailable = avail?.status === "AVAILABLE";

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => setSelectedCalendarDate(dateStr)}
                        className={`min-h-[75px] p-2 rounded-xl border text-left flex flex-col justify-between transition relative ${
                          isSelected
                            ? "bg-maroon-800 text-white border-maroon-900 shadow-md ring-2 ring-saffron-500"
                            : "bg-stone-50 hover:bg-stone-100/80 border-stone-200 text-stone-900"
                        }`}
                      >
                        <span className={`text-xs font-mono font-bold ${isSelected ? "text-white" : "text-stone-700"}`}>
                          {dayNum}
                        </span>

                        <div className="mt-1">
                          {isClosed ? (
                            <span className="text-[9px] bg-stone-200 text-stone-700 px-1.5 py-0.5 rounded font-bold block truncate">
                              OFF
                            </span>
                          ) : isFull ? (
                            <span className="text-[9px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-bold block truncate">
                              FULL
                            </span>
                          ) : isLimited ? (
                            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.5 rounded font-bold block truncate">
                              LIMITED
                            </span>
                          ) : isAvailable ? (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold block truncate ${isSelected ? "bg-emerald-900/50 text-emerald-200" : "bg-emerald-100 text-emerald-800"}`}>
                              OPEN
                            </span>
                          ) : (
                            <span className="text-[9px] text-stone-400 block">•</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 pt-2 border-t border-stone-100">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>OPEN (उपलब्ध)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                    <span>LIMITED (सीमित)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <span>FULL (पूर्ण)</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-stone-400 inline-block" />
                    <span>OFF / CLOSED (अवरुद्ध)</span>
                  </span>
                </div>
              </div>

              {/* Day Management Detail Panel (Col-span 4) */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-5">
                <div className="flex items-start justify-between border-b border-stone-200 pb-3">
                  <div>
                    <span className="text-[10px] font-mono text-saffron-600 font-bold uppercase tracking-wider block">
                      चयनित तिथि (Selected Date)
                    </span>
                    <h3 className="font-bold text-lg text-stone-900 font-mono">
                      {selectedCalendarDate}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedService.id, selectedCalendarDate)}
                    className="p-1.5 rounded-lg bg-maroon-800 text-white hover:bg-maroon-900 text-xs font-semibold flex items-center gap-1 shadow"
                    title="Add Slot for Date"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>स्लॉट जोड़ें</span>
                  </button>
                </div>

                {/* Slot Status List for this Date */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-stone-600 block">
                    सक्रिय समय स्लॉट ({selectedService.slots.length}):
                  </span>

                  {selectedService.slots.length === 0 ? (
                    <p className="text-xs text-stone-500 py-4 text-center">
                      इस सेवा के लिए कोई स्लॉट कॉन्फ़िगर नहीं है।
                    </p>
                  ) : (
                    selectedService.slots.map((slot) => (
                      <div
                        key={slot.id}
                        className="p-3.5 rounded-xl border border-stone-200 bg-stone-50 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <strong className="font-mono text-xs text-stone-900">
                            {slot.startTime} - {slot.endTime}
                          </strong>

                          <button
                            type="button"
                            onClick={() => handleToggleSlotStatus(slot)}
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              slot.isActive
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                            }`}
                          >
                            {slot.isActive ? "ACTIVE" : "DISABLED"}
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-xs text-stone-600">
                          <span>क्षमता: <strong className="font-mono text-stone-900">{slot.capacity} सीटें</strong></span>
                          <span>दर: <strong className="font-mono text-stone-900">₹{slot.priceInPaise / 100}</strong></span>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-stone-200">
                          <button
                            type="button"
                            onClick={() => openEditModal(selectedService.id, slot)}
                            className="text-[11px] text-maroon-800 hover:underline flex items-center gap-1 font-semibold"
                          >
                            <Edit2 className="w-3 h-3" />
                            <span>संपादित करें</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Duplicate Slot Configuration */}
                <div className="pt-3 border-t border-stone-200">
                  <button
                    type="button"
                    onClick={() => setDuplicateModalOpen(true)}
                    className="w-full py-2.5 rounded-xl border border-stone-300 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold flex items-center justify-center gap-2 transition"
                  >
                    <Copy className="w-4 h-4 text-saffron-600" />
                    <span>भविष्य की तिथियों पर स्लॉट कॉपी करें (Duplicate)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE 2: CLASSIC LIST */}
          {viewMode === "LIST" && (
            <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div className="p-4 border-b border-stone-200 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-stone-900 text-sm">
                    {selectedService.titleHi} — समस्त स्लॉट्स सूची
                  </h3>
                  <span className="text-xs text-stone-500 font-mono">
                    कुल {selectedService.slots.length} समय स्लॉट उपलब्ध
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => openCreateModal(selectedService.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-maroon-800 text-white rounded-xl text-xs font-semibold shadow"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>स्लॉट जोड़ें</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider">
                      <th className="py-3 px-4">समय अवधि (Time)</th>
                      <th className="py-3 px-4 text-center">अधिकतम क्षमता</th>
                      <th className="py-3 px-4 text-center">शुल्क (INR)</th>
                      <th className="py-3 px-4 text-center">स्थिति</th>
                      <th className="py-3 px-4 text-right">कार्य</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {selectedService.slots.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-stone-500">
                          कोई स्लॉट नहीं मिला।
                        </td>
                      </tr>
                    ) : (
                      selectedService.slots.map((slot) => (
                        <tr key={slot.id} className="hover:bg-stone-50">
                          <td className="py-3.5 px-4 font-mono font-bold text-stone-900">
                            {slot.startTime} - {slot.endTime}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-800">
                            {slot.capacity}
                          </td>

                          <td className="py-3.5 px-4 text-center font-mono">
                            {slot.priceInPaise === 0 ? "निःशुल्क" : `₹${slot.priceInPaise / 100}`}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleSlotStatus(slot)}
                              className={`px-3 py-0.5 rounded-full text-[10px] font-bold ${
                                slot.isActive
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-stone-200 text-stone-600"
                              }`}
                            >
                              {slot.isActive ? "ACTIVE" : "DISABLED"}
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => openEditModal(selectedService.id, slot)}
                              className="p-1 text-stone-600 hover:text-maroon-800"
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
          )}
        </>
      )}

      {/* Create / Edit Slot Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                {editingSlotId ? "स्लॉट संपादित करें" : "नया समय स्लॉट जोड़ें"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveSlot} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">प्रारंभ समय (Start): *</label>
                  <input
                    type="text"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    placeholder="e.g. 06:00 AM"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">समापन समय (End): *</label>
                  <input
                    type="text"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    placeholder="e.g. 07:00 AM"
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">अधिकतम क्षमता (Capacity): *</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={capacity}
                  onChange={(e) => setCapacity(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">शुल्क (INR - 0 for Free):</label>
                <input
                  type="number"
                  min={0}
                  value={priceInRupees}
                  onChange={(e) => setPriceInRupees(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              {formDate && (
                <div>
                  <label className="block font-medium text-stone-700 mb-1">विशिष्ट तिथि (Specific Date):</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 font-mono focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="slot-active-check"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-maroon-800 focus:ring-saffron-500"
                />
                <label htmlFor="slot-active-check" className="font-medium text-stone-800 cursor-pointer">
                  यह स्लॉट बुकिंग हेतु सक्रिय रखें (Active for booking)
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-stone-200">
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
                  className="px-5 py-2 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold shadow"
                >
                  {saving ? "सुरक्षित हो रहा है..." : "सुरक्षित करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Duplicate Slots Modal */}
      {duplicateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <h3 className="font-bold text-base text-stone-900">
                स्लॉट कॉन्फ़िगरेशन कॉपी करें (Duplicate Slots)
              </h3>
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className="text-stone-400 hover:text-stone-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleDuplicateSlots} className="space-y-4 text-xs">
              <p className="text-stone-600">
                वर्तमान सेवा (<strong>{selectedService.titleHi}</strong>) के समस्त सक्रिय स्लॉट निम्नलिखित भविष्य की तिथियों पर प्रतिलिपिकृत (duplicate) हो जाएंगे।
              </p>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  लक्षित तिथियां (Target Dates - अल्पविराम से अलग करें): *
                </label>
                <textarea
                  rows={3}
                  required
                  value={duplicateTargetDates}
                  onChange={(e) => setDuplicateTargetDates(e.target.value)}
                  placeholder="e.g. 2026-09-25, 2026-09-26, 2026-09-27"
                  className="w-full p-2.5 rounded-xl border border-stone-300 font-mono text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDuplicateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-stone-600 hover:bg-stone-100 font-semibold"
                >
                  रद्द करें
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold shadow"
                >
                  {saving ? "कॉपी हो रहा है..." : "स्लॉट कॉपी करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
