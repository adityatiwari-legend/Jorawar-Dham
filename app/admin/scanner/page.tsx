"use client";

import { useState } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Calendar,
  Clock,
  ShieldCheck,
  RefreshCw,
  Search,
} from "lucide-react";

interface CheckInLog {
  reference: string;
  devoteeName: string;
  service: string;
  time: string;
  count: number;
  success: boolean;
  message: string;
}

export default function AdminScannerPage() {
  const [scanInput, setScanInput] = useState("");
  const [manualRef, setManualRef] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
    status?: string;
    booking?: any;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<CheckInLog[]>([]);

  // Simple Web Audio API feedback
  const playSound = (isSuccess: boolean) => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isSuccess) {
        osc.frequency.setValueAtTime(880, ctx.currentTime); // High pleasant A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(220, ctx.currentTime); // Low buzz
        osc.frequency.setValueAtTime(160, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch {
      // Audio context might be restricted before user gesture
    }
  };

  const handleVerify = async (ref: string, token: string) => {
    if (!ref.trim() || !token.trim()) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const res = await fetch("/api/admin/bookings/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingReference: ref.trim(),
          qrSecurityToken: token.trim(),
        }),
      });

      const data = await res.json();
      setVerificationResult(data);
      playSound(data.success);

      if (data.booking) {
        setRecentLogs((prev) => [
          {
            reference: ref.trim(),
            devoteeName: data.booking.primaryDevoteeName,
            service: data.booking.serviceNameHi,
            time: new Date().toLocaleTimeString("hi-IN"),
            count: data.booking.numberOfDevotees,
            success: data.success,
            message: data.message || data.error,
          },
          ...prev.slice(0, 19),
        ]);
      }
    } catch (err: any) {
      setVerificationResult({
        success: false,
        message: err.message || "सत्यापन प्रक्रिया विफल हुई",
      });
      playSound(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleQuickScanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanInput.trim()) return;

    // QR input can be either a full verification URL or format "REF:TOKEN"
    let ref = "";
    let token = "";

    try {
      if (scanInput.includes("ref=") && scanInput.includes("token=")) {
        const url = new URL(scanInput.trim());
        ref = url.searchParams.get("ref") || "";
        token = url.searchParams.get("token") || "";
      } else if (scanInput.includes(":")) {
        const parts = scanInput.split(":");
        ref = parts[0];
        token = parts[1];
      } else {
        ref = scanInput.trim();
      }
    } catch {
      ref = scanInput.trim();
    }

    if (ref && token) {
      handleVerify(ref, token);
      setScanInput("");
    } else {
      setVerificationResult({
        success: false,
        message: "अमान्य क्यूआर डेटा। कृपया संदर्भ संख्या एवं टोकन दोनों दर्ज करें।",
      });
      playSound(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleVerify(manualRef, manualToken);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
          <QrCode className="w-6 h-6 text-saffron-600" />
          मुख्य द्वार क्यूआर सत्यापन (Entrance Gate Scanner)
        </h1>
        <p className="text-sm text-stone-500 mt-1">
          दर्शनार्थियों के डिजिटल पास का सत्यापन एवं वास्तविक समय पर प्रवेश नियंत्रण (Double Check-in Prevention)
        </p>
      </div>

      {/* Main Scan Input Card */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-lg p-6 sm:p-8 space-y-6">
        <form onSubmit={handleQuickScanSubmit} className="space-y-3">
          <label className="block text-sm font-bold text-stone-800 flex items-center gap-2">
            <QrCode className="w-4 h-4 text-saffron-600" />
            त्वरित बारकोड / क्यूआर स्कैनर इनपुट (Quick Scanner / Barcode Gun)
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              autoFocus
              value={scanInput}
              onChange={(e) => setScanInput(e.target.value)}
              placeholder="क्यूआर कोड स्कैन करें अथवा सत्यापन यूआरएल पेस्ट करें..."
              className="flex-1 px-4 py-3 border-2 border-stone-300 focus:border-saffron-600 rounded-2xl text-sm font-mono focus:outline-none focus:ring-4 focus:ring-saffron-500/10 shadow-inner"
            />
            <button
              type="submit"
              disabled={verifying}
              className="px-6 py-3 bg-saffron-600 hover:bg-saffron-700 text-white font-bold rounded-2xl text-sm shadow-md transition disabled:opacity-50 flex items-center gap-2"
            >
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              सत्यापित करें
            </button>
          </div>
          <span className="text-xs text-stone-400 block">
            सुझाव: बारकोड स्कैनर गन स्वचालित रूप से इस बॉक्स में डेटा पढ़कर सबमिट कर सकती है।
          </span>
        </form>

        {/* Manual Fallback Accordion / Inputs */}
        <details className="text-xs text-stone-600 pt-2 border-t border-stone-100">
          <summary className="cursor-pointer font-semibold text-stone-700 hover:text-saffron-700">
            + हस्तचालित संदर्भ कोड व सुरक्षा टोकन दर्ज करें (Manual Token Entry)
          </summary>
          <form onSubmit={handleManualSubmit} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">बुकिंग संदर्भ (Ref)</label>
              <input
                type="text"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
                placeholder="उदा. JD-DAR-2026-XXXX"
                className="w-full p-2 border border-stone-300 rounded-xl font-mono text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-stone-600 mb-1">सुरक्षा टोकन (Token)</label>
              <input
                type="text"
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="उदा. 4a8e2b9c..."
                className="w-full p-2 border border-stone-300 rounded-xl font-mono text-xs"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={verifying}
                className="px-4 py-1.5 bg-stone-800 text-white rounded-xl text-xs font-semibold hover:bg-stone-900"
              >
                मैन्युअल जांचें
              </button>
            </div>
          </form>
        </details>
      </div>

      {/* Verification Result Display */}
      {verificationResult && (
        <div
          className={`rounded-3xl p-6 sm:p-8 border-2 shadow-xl animate-in zoom-in-95 transition-all ${
            verificationResult.success
              ? "bg-emerald-50 border-emerald-500 text-emerald-950"
              : verificationResult.status === "CHECKED_IN"
              ? "bg-amber-50 border-amber-500 text-amber-950"
              : "bg-red-50 border-red-500 text-red-950"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              {verificationResult.success ? (
                <div className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
              ) : verificationResult.status === "CHECKED_IN" ? (
                <div className="w-16 h-16 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/30">
                  <AlertTriangle className="w-10 h-10" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30">
                  <XCircle className="w-10 h-10" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span
                  className={`text-xs uppercase tracking-widest font-black px-3 py-1 rounded-full ${
                    verificationResult.success
                      ? "bg-emerald-200/80 text-emerald-900"
                      : verificationResult.status === "CHECKED_IN"
                      ? "bg-amber-200/80 text-amber-900"
                      : "bg-red-200/80 text-red-900"
                  }`}
                >
                  {verificationResult.success
                    ? "✓ प्रवेश की अनुमति है (ENTRY GRANTED)"
                    : verificationResult.status === "CHECKED_IN"
                    ? "⚠ पूर्व में प्रयुक्त टिकट (ALREADY CHECKED IN)"
                    : "✕ प्रवेश अस्वीकृत (ENTRY DENIED)"}
                </span>

                {verificationResult.booking?.bookingReference && (
                  <span className="font-mono text-sm font-bold opacity-75">
                    {verificationResult.booking.bookingReference}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black">
                {verificationResult.message || (verificationResult as any).error}
              </h2>

              {verificationResult.booking && (
                <div className="mt-4 pt-4 border-t border-black/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="opacity-60 block font-semibold">मुख्य श्रद्धालु</span>
                    <span className="font-bold text-sm">{verificationResult.booking.primaryDevoteeName}</span>
                  </div>
                  <div>
                    <span className="opacity-60 block font-semibold">श्रद्धालु संख्या</span>
                    <span className="font-bold text-sm flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {verificationResult.booking.numberOfDevotees} व्यक्ति
                    </span>
                  </div>
                  <div>
                    <span className="opacity-60 block font-semibold">सेवा / दर्शन</span>
                    <span className="font-bold text-sm">{verificationResult.booking.serviceNameHi}</span>
                  </div>
                  <div>
                    <span className="opacity-60 block font-semibold">दिनांक व स्लॉट</span>
                    <span className="font-bold text-sm">
                      {verificationResult.booking.bookingDate} ({verificationResult.booking.slotTime})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Scans Log Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-stone-500" />
            हाल ही में सत्यापित प्रवेश (Shift Entrance Log)
          </h3>
          <span className="text-xs text-stone-400">{recentLogs.length} प्रविष्टियाँ</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-stone-400 py-6 text-center">
            इस सत्र में अभी तक कोई पास स्कैन नहीं किया गया है।
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-stone-50 text-stone-500 border-b border-stone-100">
                <tr>
                  <th className="py-2.5 px-3">समय</th>
                  <th className="py-2.5 px-3">संदर्भ</th>
                  <th className="py-2.5 px-3">श्रद्धालु</th>
                  <th className="py-2.5 px-3">सेवा</th>
                  <th className="py-2.5 px-3">संख्या</th>
                  <th className="py-2.5 px-3">स्थिति</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 font-medium">
                {recentLogs.map((log, idx) => (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="py-2.5 px-3 text-stone-500 font-mono">{log.time}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-stone-800">{log.reference}</td>
                    <td className="py-2.5 px-3 text-stone-900">{log.devoteeName}</td>
                    <td className="py-2.5 px-3 text-stone-700">{log.service}</td>
                    <td className="py-2.5 px-3 font-bold">{log.count}</td>
                    <td className="py-2.5 px-3">
                      {log.success ? (
                        <span className="text-emerald-700 font-bold">✓ स्वीकृत</span>
                      ) : (
                        <span className="text-red-600 font-bold">✕ अस्वीकृत</span>
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
  );
}
