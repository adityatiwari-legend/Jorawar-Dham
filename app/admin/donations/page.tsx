"use client";

import { useState, useEffect } from "react";
import {
  Heart,
  Search,
  PlusCircle,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  CheckCircle2,
  FileText,
  Clock,
  Settings2,
} from "lucide-react";

interface AdminDonation {
  id: string;
  donationReference: string;
  donorName: string;
  donorPhone: string;
  donorEmail?: string | null;
  donorCity?: string | null;
  amountInPaise: number;
  status: string;
  causeTitleHi: string;
  causeTitleEn: string;
  receiptNumber?: string | null;
  createdAt: string;
}

interface AdminCause {
  id: string;
  slug: string;
  titleHi: string;
  titleEn: string;
  descriptionHi: string;
  descriptionEn: string;
  suggestedAmounts: number[];
  targetAmountInPaise?: number | null;
  collectedAmountInPaise: number;
  isActive: boolean;
}

export default function AdminDonationsPage() {
  const [activeTab, setActiveTab] = useState<"LEDGER" | "CAUSES">("LEDGER");
  const [donations, setDonations] = useState<AdminDonation[]>([]);
  const [causes, setCauses] = useState<AdminCause[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Cause Modal State
  const [showCauseModal, setShowCauseModal] = useState(false);
  const [causeForm, setCauseForm] = useState({
    titleHi: "",
    titleEn: "",
    descriptionHi: "",
    descriptionEn: "",
    targetAmountInRupees: 0,
    suggestedAmountsStr: "251, 501, 1100, 2100, 5100",
    isActive: true,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchDonations = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      let url = `/api/admin/donations?`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (statusFilter !== "ALL") url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      if (res.status === 403) {
        setUnauthorized(true);
        setDonations([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setDonations(data.donations || []);
      }
    } catch (err) {
      console.error("Error loading donations:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCauses = async () => {
    try {
      const res = await fetch("/api/admin/donations/causes");
      const data = await res.json();
      if (data.success) {
        setCauses(data.causes || []);
      }
    } catch (err) {
      console.error("Error loading causes:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "LEDGER") {
      fetchDonations();
    } else {
      fetchCauses();
    }
  }, [activeTab, statusFilter]);

  const handleCreateCause = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const suggestedAmounts = causeForm.suggestedAmountsStr
        .split(",")
        .map((s) => Math.round(parseFloat(s.trim()) * 100))
        .filter((n) => !isNaN(n) && n > 0);

      const payload = {
        titleHi: causeForm.titleHi,
        titleEn: causeForm.titleEn,
        descriptionHi: causeForm.descriptionHi,
        descriptionEn: causeForm.descriptionEn,
        targetAmountInPaise:
          causeForm.targetAmountInRupees > 0
            ? Math.round(causeForm.targetAmountInRupees * 100)
            : null,
        suggestedAmounts,
        isActive: causeForm.isActive,
      };

      const res = await fetch("/api/admin/donations/causes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error || "दान उद्देश्य निर्माण विफल रहा", isError: true });
        return;
      }

      setActionMessage({ text: "नया दान उद्देश्य सफलतापूर्वक जोड़ा गया।" });
      setShowCauseModal(false);
      fetchCauses();
    } catch (err) {
      setActionMessage({ text: "सर्वर त्रुटि", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPaise = donations.reduce((sum, d) => (d.status === "COMPLETED" ? sum + d.amountInPaise : sum), 0);

  if (unauthorized) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-rose-100 text-rose-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">दान लेजर अनुमतियां आवश्यक</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          दान लेजर एवं वित्तीय विवरण देखने के लिए आपकी प्रशासनिक भूमिका में <code>donations:read</code> अथवा <code>FINANCE_ADMIN</code> अधिकार होना आवश्यक है।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action banner */}
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
            <Heart className="w-6 h-6 text-rose-600" />
            दान प्रबंधन (Donations & Causes)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            श्रद्धालुओं द्वारा समर्पित दान, रसीदें एवं विभिन्न धार्मिक प्रकल्पों (Causes) का प्रबंधन
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {activeTab === "CAUSES" ? (
            <button
              onClick={() => setShowCauseModal(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>नया दान प्रकल्प जोड़ें</span>
            </button>
          ) : (
            <a
              href="/api/admin/reports?type=DONATIONS&format=csv"
              download
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV निर्यात</span>
            </a>
          )}

          <button
            onClick={() => (activeTab === "LEDGER" ? fetchDonations() : fetchCauses())}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab("LEDGER")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "LEDGER"
              ? "bg-stone-900 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          दान लेजर (Donation Records)
        </button>
        <button
          onClick={() => setActiveTab("CAUSES")}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition ${
            activeTab === "CAUSES"
              ? "bg-stone-900 text-white shadow-sm"
              : "text-stone-600 hover:bg-stone-100"
          }`}
        >
          दान उद्देश्य व प्रकल्प (Configured Causes)
        </button>
      </div>

      {activeTab === "LEDGER" ? (
        <div className="space-y-6">
          {/* Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-rose-100 shadow-sm">
              <span className="text-xs font-medium text-rose-600 block">कुल समर्पित दान (Total Collected)</span>
              <span className="text-2xl font-bold text-rose-700 mt-1 block">
                ₹{(totalPaise / 100).toLocaleString("en-IN")}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-medium text-stone-500 block">सफल दान संख्या</span>
              <span className="text-2xl font-bold text-stone-900 mt-1 block">
                {donations.filter((d) => d.status === "COMPLETED").length}
              </span>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
              <span className="text-xs font-medium text-stone-500 block">कुल प्रविष्टियां</span>
              <span className="text-2xl font-bold text-stone-900 mt-1 block">{donations.length}</span>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-stone-400">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-rose-600" />
                दान लेजर लोड हो रहा है...
              </div>
            ) : donations.length === 0 ? (
              <div className="py-16 text-center text-stone-500">
                <Heart className="w-12 h-12 text-stone-300 mx-auto mb-3" />
                <p className="font-semibold text-stone-700">कोई दान प्रविष्टि नहीं मिली</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs font-semibold">
                    <tr>
                      <th className="py-3.5 px-4">दान संदर्भ</th>
                      <th className="py-3.5 px-4">दानदाता (Donor)</th>
                      <th className="py-3.5 px-4">प्रकल्प (Cause)</th>
                      <th className="py-3.5 px-4">राशि (INR)</th>
                      <th className="py-3.5 px-4">स्थिति</th>
                      <th className="py-3.5 px-4">रसीद</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {donations.map((d) => (
                      <tr key={d.id} className="hover:bg-stone-50/60 transition">
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-bold text-stone-900 text-xs block">
                            {d.donationReference}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            {new Date(d.createdAt).toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-stone-800">{d.donorName}</div>
                          <div className="text-xs text-stone-500 font-mono">{d.donorPhone}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-medium text-stone-800">{d.causeTitleHi}</div>
                          <div className="text-xs text-stone-400">{d.causeTitleEn}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-stone-900">
                          ₹{(d.amountInPaise / 100).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4">
                          {d.status === "COMPLETED" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3" /> समर्पित
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
                              <Clock className="w-3 h-3" /> {d.status}
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {d.receiptNumber ? (
                            <a
                              href={`/hi/donation/receipt/${d.id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-rose-700 underline font-semibold"
                            >
                              <FileText className="w-3.5 h-3.5" /> {d.receiptNumber}
                            </a>
                          ) : (
                            <span className="text-xs text-stone-400">N/A</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Causes List */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {causes.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-2xl border border-stone-200 p-5 shadow-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    c.isActive ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-600"
                  }`}
                >
                  {c.isActive ? "सक्रिय (Active)" : "निष्क्रिय"}
                </span>
                <span className="text-xs font-mono text-stone-400">/{c.slug}</span>
              </div>

              <div>
                <h3 className="font-bold text-base text-stone-900">{c.titleHi}</h3>
                <p className="text-xs text-stone-500">{c.titleEn}</p>
              </div>

              <p className="text-xs text-stone-600 line-clamp-2">{c.descriptionHi}</p>

              <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400 block text-[11px]">एकत्रित राशि:</span>
                  <span className="font-bold text-rose-700">
                    ₹{(c.collectedAmountInPaise / 100).toLocaleString("en-IN")}
                  </span>
                </div>
                {c.targetAmountInPaise && (
                  <div className="text-right">
                    <span className="text-stone-400 block text-[11px]">लक्ष्य:</span>
                    <span className="font-semibold text-stone-800">
                      ₹{(c.targetAmountInPaise / 100).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Cause Modal */}
      {showCauseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-900">नया दान प्रकल्प जोड़ें</h3>
                <p className="text-xs text-stone-500">
                  श्रद्धालुओं द्वारा ऑनलाइन दान हेतु नया उद्देश्य निर्धारित करें
                </p>
              </div>
              <button
                onClick={() => setShowCauseModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCause} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">शीर्षक (हिंदी) *</label>
                  <input
                    type="text"
                    required
                    value={causeForm.titleHi}
                    onChange={(e) => setCauseForm({ ...causeForm, titleHi: e.target.value })}
                    placeholder="उदा. गौशाला सेवा"
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Title (English) *</label>
                  <input
                    type="text"
                    required
                    value={causeForm.titleEn}
                    onChange={(e) => setCauseForm({ ...causeForm, titleEn: e.target.value })}
                    placeholder="e.g. Gaushala Seva"
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">विवरण (हिंदी) *</label>
                <textarea
                  required
                  rows={2}
                  value={causeForm.descriptionHi}
                  onChange={(e) => setCauseForm({ ...causeForm, descriptionHi: e.target.value })}
                  placeholder="उद्देश्य एवं महत्व..."
                  className="w-full p-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Description (English) *</label>
                <textarea
                  required
                  rows={2}
                  value={causeForm.descriptionEn}
                  onChange={(e) => setCauseForm({ ...causeForm, descriptionEn: e.target.value })}
                  placeholder="Details and purpose..."
                  className="w-full p-2 border border-stone-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">लक्ष्य राशि (INR, ऐच्छिक)</label>
                  <input
                    type="number"
                    value={causeForm.targetAmountInRupees}
                    onChange={(e) =>
                      setCauseForm({ ...causeForm, targetAmountInRupees: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">प्रस्तावित राशियां (Comma separated)</label>
                  <input
                    type="text"
                    value={causeForm.suggestedAmountsStr}
                    onChange={(e) => setCauseForm({ ...causeForm, suggestedAmountsStr: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="causeActive"
                  checked={causeForm.isActive}
                  onChange={(e) => setCauseForm({ ...causeForm, isActive: e.target.checked })}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                />
                <label htmlFor="causeActive" className="font-semibold text-stone-700">
                  यह उद्देश्य सार्वजनिक दान पोर्टल पर तुरंत सक्रिय करें
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCauseModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "सहेज रहा है..." : "सहेजें (Create Cause)"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
