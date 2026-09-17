"use client";

import { useState, useEffect } from "react";
import {
  BarChart3,
  FileSpreadsheet,
  Calendar,
  Users,
  CreditCard,
  Heart,
  RefreshCw,
  Lock,
  Download,
  Ticket,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ReportMetrics {
  totalBookings: number;
  confirmedBookings: number;
  checkedInVisitors: number;
  cancelledBookings: number;
  totalDonationsCount: number;
  totalDonationsAmountInRupees?: number | null;
  totalPaymentsAmountInRupees?: number | null;
  servicesPopularity: { name: string; bookings: number }[];
}

export default function AdminReportsPage() {
  const [range, setRange] = useState<"today" | "7d" | "30d" | "all">("30d");
  const [metrics, setMetrics] = useState<ReportMetrics | null>(null);
  const [isFinanceAdmin, setIsFinanceAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?range=${range}`);
      const data = await res.json();
      if (data.success) {
        setMetrics(data.metrics);
        setIsFinanceAdmin(data.isFinanceAdmin);
      }
    } catch (err) {
      console.error("Error loading reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const ranges = [
    { id: "today", label: "आज (Today)" },
    { id: "7d", label: "विगत 7 दिवस (7 Days)" },
    { id: "30d", label: "विगत 30 दिवस (30 Days)" },
    { id: "all", label: "समस्त समय (All Time)" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-saffron-600" />
            प्रशासनिक रिपोर्ट एवं सांख्यिकी (Reports & Analytics)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            दर्शनार्थी आवक, सेवा लोकप्रियता, बुकिंग रुझान एवं सुरक्षित वित्तीय विश्लेषण
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Range Selector */}
      <div className="bg-white p-3 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-stone-500">
          <Calendar className="w-4 h-4 text-saffron-600" />
          <span>समयावधि (Time Range):</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {ranges.map((r) => (
            <button
              key={r.id}
              onClick={() => setRange(r.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                range === r.id
                  ? "bg-stone-900 text-white shadow-sm"
                  : "bg-stone-100 text-stone-600 hover:bg-stone-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Operational Metrics Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-16 border border-stone-200 text-center text-stone-400">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-saffron-600" />
          सांख्यिकी संकलित की जा रही है...
        </div>
      ) : metrics ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Visitors */}
            <div className="bg-gradient-to-br from-saffron-500 to-maroon-700 text-white p-5 rounded-2xl shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-saffron-100">सत्यापित दर्शनार्थी आवक</span>
                <Users className="w-5 h-5 text-white/80" />
              </div>
              <div className="text-3xl font-black">{metrics.checkedInVisitors}</div>
              <p className="text-[11px] text-saffron-200 mt-1">Checked-in Devotees</p>
            </div>

            {/* Total Bookings */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500">कुल बुकिंग्स</span>
                <Ticket className="w-5 h-5 text-stone-400" />
              </div>
              <div className="text-3xl font-black text-stone-900">{metrics.totalBookings}</div>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1">
                {metrics.confirmedBookings} स्वीकृत (Confirmed)
              </p>
            </div>

            {/* Cancellations */}
            <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-stone-500">निरस्त बुकिंग्स</span>
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div className="text-3xl font-black text-red-700">{metrics.cancelledBookings}</div>
              <p className="text-[11px] text-stone-400 mt-1">Cancelled passes</p>
            </div>

            {/* Donations Count & Amount */}
            <div className="bg-white p-5 rounded-2xl border border-rose-100 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-rose-600">समर्पित दान (Donations)</span>
                <Heart className="w-5 h-5 text-rose-500" />
              </div>
              <div className="text-3xl font-black text-stone-900">
                {metrics.totalDonationsCount}
              </div>
              {isFinanceAdmin && metrics.totalDonationsAmountInRupees !== null ? (
                <p className="text-[11px] text-rose-700 font-bold mt-1">
                  ₹{metrics.totalDonationsAmountInRupees?.toLocaleString("en-IN")} एकत्रित
                </p>
              ) : (
                <p className="text-[11px] text-stone-400 flex items-center gap-1 mt-1">
                  <Lock className="w-3 h-3" /> राशि गोपनीय
                </p>
              )}
            </div>
          </div>

          {/* Service Popularity Breakdown */}
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-stone-900 text-sm">सेवावार बुकिंग रुझान (Service Breakdown)</h3>
            <div className="space-y-3">
              {metrics.servicesPopularity.map((s) => (
                <div key={s.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-stone-800">{s.name}</span>
                    <span className="text-stone-500 font-mono">{s.bookings} बुकिंग्स</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-saffron-500 rounded-full"
                      style={{
                        width: `${
                          metrics.totalBookings > 0
                            ? Math.min(100, Math.round((s.bookings / metrics.totalBookings) * 100))
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Secure CSV Exports Section */}
          <div className="bg-stone-900 text-white rounded-3xl p-6 sm:p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold font-serif flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <span>अधिकृत डेटा निर्यात केंद्र (Authorized CSV Exports)</span>
              </h2>
              <p className="text-xs text-stone-400 mt-1">
                सभी निर्यात व्यक्तिगत पहचान सुरक्षा (PII Masking) एवं रोल-बेस्ड ऑथराइजेशन नियमों का पूर्ण पालन करते हैं।
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Bookings CSV */}
              <div className="bg-stone-800/80 border border-stone-700 p-4 rounded-2xl space-y-3">
                <span className="font-bold text-sm block text-stone-200">दर्शन एवं सेवा बुकिंग्स</span>
                <p className="text-xs text-stone-400">
                  संदर्भ संख्या, स्लॉट, दिनांक, श्रद्धालु संख्या व प्रवेश स्थिति का सुरक्षित लेजर।
                </p>
                <a
                  href={`/api/admin/reports?export=bookings&range=${range}`}
                  download
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-semibold transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Bookings CSV ({range})</span>
                </a>
              </div>

              {/* Payments CSV */}
              <div className="bg-stone-800/80 border border-stone-700 p-4 rounded-2xl space-y-3">
                <span className="font-bold text-sm block text-stone-200">भुगतान एवं गेटवे लेन-देन</span>
                <p className="text-xs text-stone-400">
                  रेज़रपे आर्डर आईडी, भुगतान संदर्भ, स्थिति व निपटान ऑडिट रिकॉर्ड।
                </p>
                {isFinanceAdmin ? (
                  <a
                    href={`/api/admin/reports?export=payments&range=${range}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Payments CSV ({range})</span>
                  </a>
                ) : (
                  <div className="text-xs text-stone-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> वित्त अधिकार आवश्यक
                  </div>
                )}
              </div>

              {/* Donations CSV */}
              <div className="bg-stone-800/80 border border-stone-700 p-4 rounded-2xl space-y-3">
                <span className="font-bold text-sm block text-stone-200">दान व प्रकल्प समर्पित राशि</span>
                <p className="text-xs text-stone-400">
                  दानदाता नाम, उद्देश्य (Cause), राशि, रसीद क्रमांक एवं सत्यापन स्थिति।
                </p>
                {isFinanceAdmin ? (
                  <a
                    href={`/api/admin/reports?export=donations&range=${range}`}
                    download
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Donations CSV ({range})</span>
                  </a>
                ) : (
                  <div className="text-xs text-stone-500 flex items-center gap-1">
                    <Lock className="w-3.5 h-3.5" /> वित्त अधिकार आवश्यक
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
