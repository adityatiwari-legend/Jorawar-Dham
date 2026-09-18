"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Printer,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  X,
} from "lucide-react";

interface AdminInvoice {
  id: string;
  receiptNumber: string;
  bookingId: string;
  bookingReference: string;
  devoteeName: string;
  maskedPhone: string;
  serviceTitleHi: string;
  serviceTitleEn: string;
  amountInRupees: number;
  paymentReference: string;
  gatewayPaymentId?: string | null;
  issuedAt: string;
  slotTime: string;
  bookingDate: string;
}

export default function AdminInvoicesPage() {
  const [invoices, setInvoices] = useState<AdminInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedInvoice, setSelectedInvoice] = useState<AdminInvoice | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/invoices?";
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setInvoices(data.invoices || []);
      }
    } catch (err) {
      console.error("Failed to load invoices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handlePrintModal = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-saffron-600" />
            रसीद व चालान लेजर (Invoice & Receipt Management)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            समस्त जारी आधिकारिक कर चालान, सेवा रसीदें, लेखा सत्यापन एवं डाउनलोड
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInvoices}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Search Filter Box */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="रसीद संख्या (REC-...), बुकिंग संदर्भ (JD-...), अथवा श्रद्धालु का नाम खोजें..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
          />
        </form>

        <button
          type="button"
          onClick={fetchInvoices}
          className="px-5 py-2 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold text-xs shadow transition shrink-0"
        >
          खोजें (Search)
        </button>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">रसीद सं. (Receipt No)</th>
                <th className="py-3.5 px-4">बुकिंग संदर्भ</th>
                <th className="py-3.5 px-4">श्रद्धालु नाम</th>
                <th className="py-3.5 px-4">सेवा विवरण</th>
                <th className="py-3.5 px-4 text-center">दर्शन तिथि</th>
                <th className="py-3.5 px-4 text-right">राशि (INR)</th>
                <th className="py-3.5 px-4 text-center">जारी दिनांक</th>
                <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                    <span>रसीदें लोड हो रही हैं...</span>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    कोई रसीद रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-maroon-800 text-[11px]">
                      {inv.receiptNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-700">
                      {inv.bookingReference}
                    </td>

                    <td className="py-3.5 px-4">
                      <strong className="block text-stone-900">{inv.devoteeName}</strong>
                      <span className="text-stone-400 text-[10px] font-mono">{inv.maskedPhone}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-serif font-semibold text-stone-800 block">{inv.serviceTitleHi}</span>
                      <span className="text-stone-500 text-[10px]">{inv.slotTime}</span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono">
                      {inv.bookingDate}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold text-stone-900">
                      {inv.amountInRupees > 0 ? `₹${inv.amountInRupees.toFixed(2)}` : "निःशुल्क"}
                    </td>

                    <td className="py-3.5 px-4 text-center text-stone-500 font-mono text-[10px]">
                      {new Date(inv.issuedAt).toLocaleDateString("hi-IN")}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedInvoice(inv)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-maroon-800 hover:text-white text-stone-700 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>देखें</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice View Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-stone-200 max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 my-8 max-h-[90vh] overflow-y-auto">
            {/* Modal Actions Bar */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <span className="font-mono font-bold text-maroon-800 text-xs">
                {selectedInvoice.receiptNumber}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintModal}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-maroon-800 text-white text-xs font-semibold shadow"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>प्रिंट (Print)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedInvoice(null)}
                  className="p-1 text-stone-400 hover:text-stone-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Rendered Invoice Content */}
            <div className="p-6 bg-stone-50 rounded-2xl border border-stone-200 space-y-5 text-xs">
              <div className="flex items-start justify-between border-b border-stone-200 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src="/branding/jorawar-dham-icon.png"
                    alt="सिद्ध श्री जोरावर धाम"
                    className="w-12 h-12 rounded-full object-contain bg-maroon-800 p-1"
                  />
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">सिद्ध श्री जोरावर धाम सेवा समिति</h3>
                    <p className="text-[10px] text-stone-500">चितौरा, सैंपऊ, धौलपुर (राजस्थान)</p>
                    <p className="text-[9px] text-stone-400 font-mono">रजि. सं: COOP/2023/DHOLPUR/201054</p>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <strong className="text-maroon-800 block font-bold">{selectedInvoice.receiptNumber}</strong>
                  <span className="text-stone-500 text-[10px]">{new Date(selectedInvoice.issuedAt).toLocaleString("hi-IN")}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-stone-400 block text-[10px]">श्रद्धालु नाम:</span>
                  <strong className="text-stone-900 block">{selectedInvoice.devoteeName}</strong>
                  <span className="text-stone-500 font-mono">{selectedInvoice.maskedPhone}</span>
                </div>

                <div className="text-right">
                  <span className="text-stone-400 block text-[10px]">आरक्षण संदर्भ सं:</span>
                  <strong className="text-stone-900 font-mono block">{selectedInvoice.bookingReference}</strong>
                  <span className="text-stone-500 font-mono">{selectedInvoice.bookingDate} ({selectedInvoice.slotTime})</span>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-stone-200 flex items-center justify-between">
                <div>
                  <strong className="text-stone-900 font-serif block">{selectedInvoice.serviceTitleHi}</strong>
                  <span className="text-stone-500 text-[10px]">दर्शन एवं अनुष्ठान व्यवस्था</span>
                </div>
                <div className="text-right">
                  <strong className="font-mono text-base text-maroon-800 block">
                    {selectedInvoice.amountInRupees > 0 ? `₹${selectedInvoice.amountInRupees.toFixed(2)}` : "निःशुल्क"}
                  </strong>
                  <span className="text-[9px] text-emerald-700 font-semibold">● सफल भुगतान</span>
                </div>
              </div>

              <div className="text-[10px] text-stone-400 text-center pt-2 font-mono">
                * यह कंप्यूटर जनित आधिकारिक भुगतान रसीद है।
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
