"use client";

import { useState, useEffect } from "react";
import {
  Ticket,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  QrCode,
  FileText,
  RefreshCw,
  Eye,
  PlusCircle,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

interface AdminBooking {
  id: string;
  bookingReference: string;
  devoteeName: string;
  devoteePhone: string;
  serviceTitleHi: string;
  serviceTitleEn: string;
  slotTime: string;
  bookingDate: string;
  numberOfDevotees: number;
  totalAmountInPaise: number;
  status: string;
  checkedInAt?: string | null;
  receiptNumber?: string | null;
  paymentStatus: string;
  createdAt: string;
}

interface ServiceItem {
  id: string;
  titleHi: string;
  titleEn: string;
  slots: {
    id: string;
    startTime: string;
    endTime: string;
    capacity: number;
    bookedCount: number;
    priceInPaise: number;
  }[];
}

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState<AdminBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  // Manual Counter Booking Modal State
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualForm, setManualForm] = useState({
    devoteeName: "",
    devoteePhone: "",
    serviceId: "",
    slotId: "",
    bookingDate: new Date().toISOString().split("T")[0],
    numberOfDevotees: 1,
    notes: "Counter Booking",
  });
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  // Reschedule Modal State
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    bookingId: "",
    bookingReference: "",
    newSlotDate: new Date().toISOString().split("T")[0],
    newSlotId: "",
    reason: "Devotee requested time adjustment",
  });

  // Cancel Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelData, setCancelData] = useState({
    bookingId: "",
    bookingReference: "",
    reason: "",
  });

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/bookings?`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (statusFilter !== "ALL") url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServicesAndSlots = async () => {
    try {
      const res = await fetch("/api/public/services");
      const data = await res.json();
      if (data.success && data.services) {
        setServices(data.services);
        if (data.services.length > 0) {
          setManualForm((prev) => ({
            ...prev,
            serviceId: data.services[0].id,
            slotId: data.services[0].slots?.[0]?.id || "",
          }));
        }
      }
    } catch (err) {
      console.error("Failed to load services:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  useEffect(() => {
    fetchServicesAndSlots();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchBookings();
  };

  // Submit Counter Booking
  const handleCreateManualBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/bookings/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error || "काउंटर बुकिंग विफल रही", isError: true });
        return;
      }

      setActionMessage({ text: `काउन्टर पास निर्मित: ${data.bookingReference}` });
      setShowManualModal(false);
      fetchBookings();
    } catch (err) {
      setActionMessage({ text: "प्रक्रिया में सर्वर त्रुटि", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Reschedule
  const handleRescheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/bookings/${rescheduleData.bookingId}/reschedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newSlotDate: rescheduleData.newSlotDate,
          newSlotId: rescheduleData.newSlotId,
          reason: rescheduleData.reason,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error || "समय परिवर्तन विफल रहा", isError: true });
        return;
      }

      setActionMessage({ text: "बुकिंग समय सफलतापूर्वक परिवर्तित कर दिया गया है।" });
      setShowRescheduleModal(false);
      if (selectedBooking?.id === rescheduleData.bookingId) {
        setSelectedBooking(null);
      }
      fetchBookings();
    } catch (err) {
      setActionMessage({ text: "प्रक्रिया में सर्वर त्रुटि", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Submit Cancel
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/bookings/${cancelData.bookingId}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelData.reason }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error || "रद्दीकरण विफल रहा", isError: true });
        return;
      }

      setActionMessage({ text: data.message || "बुकिंग निरस्त कर दी गई है।" });
      setShowCancelModal(false);
      if (selectedBooking?.id === cancelData.bookingId) {
        setSelectedBooking(null);
      }
      fetchBookings();
    } catch (err) {
      setActionMessage({ text: "प्रक्रिया में सर्वर त्रुटि", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  // Metrics
  const totalCount = bookings.length;
  const confirmedCount = bookings.filter((b) => b.status === "CONFIRMED").length;
  const checkedInCount = bookings.filter((b) => b.status === "CHECKED_IN").length;
  const totalCollectedInRupees =
    bookings
      .filter((b) => b.status === "CONFIRMED" || b.status === "CHECKED_IN")
      .reduce((sum, b) => sum + b.totalAmountInPaise, 0) / 100;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CONFIRMED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3" /> स्वीकृत
          </span>
        );
      case "CHECKED_IN":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <QrCode className="w-3 h-3" /> प्रवेशित
          </span>
        );
      case "PENDING_PAYMENT":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3" /> भुगतान लंबित
          </span>
        );
      case "CANCELLED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <XCircle className="w-3 h-3" /> निरस्त
          </span>
        );
      case "REFUND_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800 border border-orange-300">
            <RotateCcw className="w-3 h-3" /> रिफंड लंबित
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-stone-100 text-stone-700">
            {status}
          </span>
        );
    }
  };

  const selectedServiceSlots =
    services.find((s) => s.id === manualForm.serviceId)?.slots || [];

  return (
    <div className="space-y-6">
      {/* Alert banner if action message */}
      {actionMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between text-xs ${
            actionMessage.isError
              ? "bg-red-50 text-red-800 border border-red-200"
              : "bg-emerald-50 text-emerald-800 border border-emerald-200"
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            onClick={() => setActionMessage(null)}
            className="text-stone-400 hover:text-stone-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Ticket className="w-6 h-6 text-saffron-600" />
            दर्शन एवं सेवा बुकिंग्स (Bookings & Passes)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            श्रद्धालुओं द्वारा की गई दर्शन, पूजा एवं आरती की डिजिटल बुकिंग्स, काउन्टर पास व समय प्रबंधन
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowManualModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>काउन्टर पास जारी करें</span>
          </button>

          <a
            href="/api/admin/reports?type=BOOKINGS&format=csv"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV निर्यात</span>
          </a>

          <button
            onClick={fetchBookings}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block">कुल बुकिंग्स (Total)</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">{totalCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-medium text-emerald-600 block">सक्रिय / स्वीकृत (Confirmed)</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">{confirmedCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-medium text-purple-600 block">प्रवेशित (Checked In)</span>
          <span className="text-2xl font-bold text-purple-700 mt-1 block">{checkedInCount}</span>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-amber-100 shadow-sm">
          <span className="text-xs font-medium text-amber-600 block">संग्रहित शुल्क (Revenue)</span>
          <span className="text-2xl font-bold text-amber-700 mt-1 block">
            ₹{totalCollectedInRupees.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="संदर्भ संख्या (JD-...), नाम अथवा मोबाइल नंबर खोजें..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-saffron-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-semibold"
          >
            खोजें
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {["ALL", "CONFIRMED", "CHECKED_IN", "PENDING_PAYMENT", "CANCELLED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === status
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {status === "ALL"
                ? "सभी (All)"
                : status === "CONFIRMED"
                ? "स्वीकृत"
                : status === "CHECKED_IN"
                ? "प्रवेशित"
                : status === "PENDING_PAYMENT"
                ? "लंबित"
                : "निरस्त"}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-saffron-600" />
            बुकिंग विवरण लोड हो रहा है...
          </div>
        ) : bookings.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <Ticket className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="font-semibold text-stone-700">कोई बुकिंग नहीं मिली</p>
            <p className="text-xs text-stone-400 mt-1">
              चयनित खोज या फिल्टर के अनुसार कोई प्रविष्टि उपलब्ध नहीं है।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">संदर्भ (Reference)</th>
                  <th className="py-3.5 px-4">श्रद्धालु (Devotee)</th>
                  <th className="py-3.5 px-4">सेवा (Service)</th>
                  <th className="py-3.5 px-4">दिनांक व समय</th>
                  <th className="py-3.5 px-4">संख्या</th>
                  <th className="py-3.5 px-4">शुल्क</th>
                  <th className="py-3.5 px-4">स्थिति</th>
                  <th className="py-3.5 px-4 text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-stone-900 text-xs block">
                        {b.bookingReference}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(b.createdAt).toLocaleDateString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">{b.devoteeName}</div>
                      <div className="text-xs text-stone-500 font-mono">{b.devoteePhone}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-stone-800">{b.serviceTitleHi}</div>
                      <div className="text-xs text-stone-400">{b.serviceTitleEn}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-stone-800 font-medium">{b.bookingDate}</div>
                      <div className="text-xs text-stone-500">{b.slotTime}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-stone-800">
                      {b.numberOfDevotees}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      {b.totalAmountInPaise === 0 ? (
                        <span className="text-emerald-600 text-xs">निःशुल्क</span>
                      ) : (
                        `₹${(b.totalAmountInPaise / 100).toLocaleString("en-IN")}`
                      )}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(b.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {b.status === "CONFIRMED" && (
                          <button
                            onClick={() => {
                              setRescheduleData({
                                bookingId: b.id,
                                bookingReference: b.bookingReference,
                                newSlotDate: b.bookingDate,
                                newSlotId: "",
                                reason: "Devotee requested time adjustment",
                              });
                              setShowRescheduleModal(true);
                            }}
                            className="p-1.5 text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition"
                            title="समय बदलें (Reschedule)"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="p-1.5 text-stone-500 hover:text-saffron-600 hover:bg-stone-100 rounded-lg transition"
                          title="विवरण देखें"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Counter Booking Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-900">
                  काउन्टर पास जारी करें (Manual Counter Booking)
                </h3>
                <p className="text-xs text-stone-500">
                  मंदिर प्रांगण में उपस्थित श्रद्धालु हेतु तत्काल डिजिटल पास
                </p>
              </div>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateManualBooking} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  श्रद्धालु का नाम (Devotee Full Name) *
                </label>
                <input
                  type="text"
                  required
                  value={manualForm.devoteeName}
                  onChange={(e) => setManualForm({ ...manualForm, devoteeName: e.target.value })}
                  placeholder="उदा. रामेश्वर शर्मा"
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-saffron-500 text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  मोबाइल नंबर (10-Digit Mobile) *
                </label>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={manualForm.devoteePhone}
                  onChange={(e) =>
                    setManualForm({
                      ...manualForm,
                      devoteePhone: e.target.value.replace(/\D/g, ""),
                    })
                  }
                  placeholder="9876543210"
                  className="w-full p-2.5 border border-stone-300 rounded-xl focus:ring-2 focus:ring-saffron-500 text-sm font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">सेवा चुनें (Service) *</label>
                  <select
                    value={manualForm.serviceId}
                    onChange={(e) => {
                      const svc = services.find((s) => s.id === e.target.value);
                      setManualForm({
                        ...manualForm,
                        serviceId: e.target.value,
                        slotId: svc?.slots?.[0]?.id || "",
                      });
                    }}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.titleHi}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">दिनांक (Date) *</label>
                  <input
                    type="date"
                    required
                    value={manualForm.bookingDate}
                    onChange={(e) => setManualForm({ ...manualForm, bookingDate: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">समय स्लॉट (Time Slot) *</label>
                  <select
                    value={manualForm.slotId}
                    onChange={(e) => setManualForm({ ...manualForm, slotId: e.target.value })}
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                  >
                    {selectedServiceSlots.map((sl) => (
                      <option key={sl.id} value={sl.id}>
                        {sl.startTime} - {sl.endTime} (उपलब्ध: {sl.capacity - sl.bookedCount})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">संख्या (Devotees) *</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={manualForm.numberOfDevotees}
                    onChange={(e) =>
                      setManualForm({
                        ...manualForm,
                        numberOfDevotees: parseInt(e.target.value) || 1,
                      })
                    }
                    className="w-full p-2.5 border border-stone-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "पास जारी हो रहा है..." : "पास स्वीकृत करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-900">बुकिंग समय परिवर्तन (Reschedule)</h3>
                <p className="text-xs font-mono text-saffron-600">{rescheduleData.bookingReference}</p>
              </div>
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRescheduleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">नया दिनांक (New Date) *</label>
                <input
                  type="date"
                  required
                  value={rescheduleData.newSlotDate}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, newSlotDate: e.target.value })
                  }
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">नया स्लॉट चुनें *</label>
                <select
                  required
                  value={rescheduleData.newSlotId}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, newSlotId: e.target.value })
                  }
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs"
                >
                  <option value="">-- स्लॉट चुनें --</option>
                  {services.flatMap((s) => s.slots).map((sl) => (
                    <option key={sl.id} value={sl.id}>
                      {sl.startTime} - {sl.endTime}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">परिवर्तन का कारण *</label>
                <textarea
                  required
                  value={rescheduleData.reason}
                  onChange={(e) =>
                    setRescheduleData({ ...rescheduleData, reason: e.target.value })
                  }
                  rows={2}
                  className="w-full p-2 border border-stone-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "अपडेट हो रहा है..." : "समय अपडेट करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-900 text-red-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-5 h-5" />
                  बुकिंग निरस्त करें (Cancel Booking)
                </h3>
                <p className="text-xs font-mono text-stone-500">{cancelData.bookingReference}</p>
              </div>
              <button
                onClick={() => setShowCancelModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  निरस्तीकरण का कारण (Cancellation Reason) *
                </label>
                <textarea
                  required
                  placeholder="उदा. श्रद्धालु द्वारा अग्रिम सूचना पर रद्दीकरण..."
                  value={cancelData.reason}
                  onChange={(e) => setCancelData({ ...cancelData, reason: e.target.value })}
                  rows={3}
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-red-500"
                />
              </div>

              <p className="text-[11px] text-stone-500 bg-stone-50 p-2.5 rounded-xl border border-stone-200">
                नोट: यदि इस बुकिंग हेतु ऑनलाइन भुगतान किया गया था, तो स्वतः रिफंड अनुरोध दर्ज हो जाएगा तथा स्लॉट क्षमता पुनः मुक्त हो जाएगी।
              </p>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-50"
                >
                  वापस
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "प्रक्रिया जारी..." : "निरस्त करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-900">बुकिंग विवरण (Booking Details)</h3>
                <p className="text-xs font-mono text-saffron-600">{selectedBooking.bookingReference}</p>
              </div>
              <button
                onClick={() => setSelectedBooking(null)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-xs text-stone-400 block">मुख्य श्रद्धालु</span>
                  <span className="font-semibold text-stone-800">{selectedBooking.devoteeName}</span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block">मोबाइल</span>
                  <span className="font-mono text-stone-800">{selectedBooking.devoteePhone}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-xs text-stone-400 block">सेवा</span>
                  <span className="font-semibold text-stone-800">{selectedBooking.serviceTitleHi}</span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block">श्रद्धालु संख्या</span>
                  <span className="font-semibold text-stone-800">{selectedBooking.numberOfDevotees} व्यक्ति</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-stone-50 p-3 rounded-xl">
                <div>
                  <span className="text-xs text-stone-400 block">दिनांक व समय</span>
                  <span className="font-semibold text-stone-800">
                    {selectedBooking.bookingDate} ({selectedBooking.slotTime})
                  </span>
                </div>
                <div>
                  <span className="text-xs text-stone-400 block">वर्तमान स्थिति</span>
                  <div>{getStatusBadge(selectedBooking.status)}</div>
                </div>
              </div>

              {selectedBooking.checkedInAt && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                  <strong>प्रवेश सत्यापन (Gate Checked-In):</strong>{" "}
                  {new Date(selectedBooking.checkedInAt).toLocaleString("hi-IN")}
                </div>
              )}

              {selectedBooking.receiptNumber && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-emerald-700 font-semibold block">रसीद संख्या (Receipt Number)</span>
                    <span className="font-mono text-emerald-900 font-bold">{selectedBooking.receiptNumber}</span>
                  </div>
                  <a
                    href={`/api/bookings/${selectedBooking.id}/receipt`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-emerald-800 underline font-semibold"
                  >
                    <FileText className="w-3.5 h-3.5" /> रसीद देखें
                  </a>
                </div>
              )}
            </div>

            <div className="pt-2 flex items-center justify-between border-t border-stone-100">
              {selectedBooking.status === "CONFIRMED" ? (
                <button
                  onClick={() => {
                    setCancelData({
                      bookingId: selectedBooking.id,
                      bookingReference: selectedBooking.bookingReference,
                      reason: "",
                    });
                    setShowCancelModal(true);
                  }}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-xl font-semibold"
                >
                  बुकिंग निरस्त करें
                </button>
              ) : (
                <div />
              )}

              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
              >
                बंद करें (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
