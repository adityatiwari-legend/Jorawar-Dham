"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  FileSpreadsheet,
  RefreshCw,
  AlertTriangle,
  Lock,
} from "lucide-react";

interface AdminPayment {
  id: string;
  paymentReference: string;
  bookingReference: string;
  gateway: string;
  gatewayOrderId?: string | null;
  gatewayPaymentId?: string | null;
  amountInPaise: number;
  status: string;
  devoteeName: string;
  devoteePhone: string;
  paidAt?: string | null;
  createdAt: string;
  refunds: {
    id: string;
    refundReference: string;
    amountInPaise: number;
    reason: string;
    status: string;
    processedAt?: string | null;
  }[];
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<AdminPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedPayment, setSelectedPayment] = useState<AdminPayment | null>(null);

  // Refund Modal State
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundData, setRefundData] = useState({
    paymentId: "",
    paymentReference: "",
    amountInPaise: 0,
    reason: "",
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchPayments = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      let url = `/api/admin/payments?`;
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}&`;
      if (statusFilter !== "ALL") url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      if (res.status === 403) {
        setUnauthorized(true);
        setPayments([]);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setPayments(data.payments || []);
      }
    } catch (err) {
      console.error("Error loading payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPayments();
  };

  const handleProcessRefund = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch(`/api/admin/payments/${refundData.paymentId}/refund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: refundData.reason }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error || "रिफंड प्रक्रिया विफल रही", isError: true });
        return;
      }

      setActionMessage({ text: `रिफंड सफल: ${data.refundReference}` });
      setShowRefundModal(false);
      fetchPayments();
    } catch (err) {
      setActionMessage({ text: "प्रक्रिया में सर्वर त्रुटि", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const totalPaise = payments.reduce((acc, p) => (p.status === "COMPLETED" ? acc + p.amountInPaise : acc), 0);
  const completedCount = payments.filter((p) => p.status === "COMPLETED").length;
  const refundedCount = payments.filter((p) => p.status === "REFUNDED" || p.refunds?.length > 0).length;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3" /> सफल (Completed)
          </span>
        );
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <Clock className="w-3 h-3" /> लंबित (Pending)
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="w-3 h-3" /> विफल (Failed)
          </span>
        );
      case "REFUND_PENDING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">
            <RotateCcw className="w-3 h-3" /> वापसी लंबित
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800">
            <RotateCcw className="w-3 h-3" /> वापस किया गया
          </span>
        );
      default:
        return <span className="text-xs text-stone-500">{status}</span>;
    }
  };

  if (unauthorized) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">वित्तीय अनुमतियां आवश्यक (Restricted)</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          भुगतान लेजर एवं वित्तीय विवरण देखने के लिए आपकी प्रशासनिक भूमिका में <code>payments:read</code> अथवा <code>FINANCE_ADMIN</code> अधिकार होना अनिवार्य है।
        </p>
      </div>
    );
  }

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
            <CreditCard className="w-6 h-6 text-emerald-600" />
            भुगतान लेजर (Payments & Settlements)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            रेज़रपे (Razorpay) गेटवे लेनदेन, समाधान व रिफंड प्रबंधन का पूर्ण विवरण
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <a
            href="/api/admin/reports?type=PAYMENTS&format=csv"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>CSV निर्यात</span>
          </a>

          <button
            onClick={fetchPayments}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-medium text-emerald-600 block">कुल सफल राजस्व (Completed Revenue)</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            ₹{(totalPaise / 100).toLocaleString("en-IN")}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block">सफल लेनदेन संख्या</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">{completedCount}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm">
          <span className="text-xs font-medium text-purple-600 block">वापसी / रिफंड संख्या</span>
          <span className="text-2xl font-bold text-purple-700 mt-1 block">{refundedCount}</span>
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
              placeholder="भुगतान संदर्भ (PAY-...), आर्डर आईडी अथवा फोन नंबर..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-stone-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-semibold"
          >
            खोजें
          </button>
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          {["ALL", "COMPLETED", "PENDING", "FAILED", "REFUNDED"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === status
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            भुगतान डेटा लोड हो रहा है...
          </div>
        ) : payments.length === 0 ? (
          <div className="py-16 text-center text-stone-500">
            <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-3" />
            <p className="font-semibold text-stone-700">कोई भुगतान रिकॉर्ड नहीं मिला</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">भुगतान संदर्भ</th>
                  <th className="py-3.5 px-4">बुकिंग संदर्भ</th>
                  <th className="py-3.5 px-4">श्रद्धालु विवरण</th>
                  <th className="py-3.5 px-4">गेटवे आईडी</th>
                  <th className="py-3.5 px-4">राशि (INR)</th>
                  <th className="py-3.5 px-4">स्थिति</th>
                  <th className="py-3.5 px-4 text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-stone-900 text-xs block">
                        {p.paymentReference}
                      </span>
                      <span className="text-[11px] text-stone-400">
                        {new Date(p.createdAt).toLocaleString("en-IN")}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-saffron-700">
                      {p.bookingReference}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-stone-800">{p.devoteeName}</div>
                      <div className="text-xs text-stone-500 font-mono">{p.devoteePhone}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-stone-600">
                      <div>{p.gatewayOrderId || "N/A"}</div>
                      <div className="text-[11px] text-stone-400">{p.gatewayPaymentId || "Pending"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-stone-900">
                      ₹{(p.amountInPaise / 100).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4">{getStatusBadge(p.status)}</td>
                    <td className="py-3.5 px-4 text-right">
                      {p.status === "COMPLETED" && (
                        <button
                          onClick={() => {
                            setRefundData({
                              paymentId: p.id,
                              paymentReference: p.paymentReference,
                              amountInPaise: p.amountInPaise,
                              reason: "",
                            });
                            setShowRefundModal(true);
                          }}
                          className="px-2.5 py-1 text-xs text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg font-semibold transition"
                        >
                          रिफंड जारी करें
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-purple-900 flex items-center gap-1.5">
                  <RotateCcw className="w-5 h-5" />
                  रिफंड जारी करें (Process Refund)
                </h3>
                <p className="text-xs font-mono text-stone-500">{refundData.paymentReference}</p>
              </div>
              <button
                onClick={() => setShowRefundModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProcessRefund} className="space-y-4 text-xs">
              <div className="p-3 bg-purple-50 rounded-xl text-purple-900">
                <span className="block text-[11px] text-purple-600">रिफंड राशि (Full Refund):</span>
                <span className="text-xl font-bold">
                  ₹{(refundData.amountInPaise / 100).toLocaleString("en-IN")}
                </span>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  रिफंड का कारण (Reason for Refund) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={refundData.reason}
                  onChange={(e) => setRefundData({ ...refundData, reason: e.target.value })}
                  placeholder="उदा. दर्शन रद्द होने पर सेवा शुल्क की वापसी..."
                  className="w-full p-2.5 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-purple-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRefundModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "प्रक्रिया जारी..." : "रिफंड स्वीकृत करें"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
