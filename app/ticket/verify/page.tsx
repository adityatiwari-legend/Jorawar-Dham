"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, AlertTriangle, XCircle, Users, Calendar, Clock, ShieldCheck, RefreshCw } from "lucide-react";
import Link from "next/link";

function TicketVerifyContent() {
  const searchParams = useSearchParams();
  const ref = searchParams.get("ref");
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ref || !token) {
      setError("अमान्य पास लिंक या अनुपलब्ध सुरक्षा टोकन। (Invalid or missing verification parameters)");
      setLoading(false);
      return;
    }

    fetch(`/api/ticket/verify?ref=${encodeURIComponent(ref)}&token=${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success) {
          setData(res);
        } else {
          setError(res.message || res.error || "पास सत्यापन विफल रहा");
        }
      })
      .catch(() => {
        setError("सत्यापन सर्वर से संपर्क नहीं हो सका");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [ref, token]);

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-stone-200 shadow-xl overflow-hidden">
        {/* Sacred Header */}
        <div className="bg-gradient-to-r from-maroon-800 to-saffron-700 text-white p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-2 border border-white/20">
            <ShieldCheck className="w-7 h-7 text-saffron-300" />
          </div>
          <h1 className="font-serif font-bold text-lg">श्री जोरावर धाम डिजिटल पास</h1>
          <p className="text-xs text-saffron-200">आधिकारिक दर्शन एवं सेवा सत्यापन पोर्टल</p>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-stone-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-saffron-600" />
              <p className="text-sm font-semibold">डिजिटल पास सत्यापित हो रहा है...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
                <XCircle className="w-8 h-8" />
              </div>
              <h2 className="text-base font-bold text-red-800">सत्यापन अस्वीकृत</h2>
              <p className="text-xs text-stone-600 px-4">{error}</p>
            </div>
          ) : data?.ticket ? (
            <div className="space-y-5">
              {/* Status Banner */}
              <div
                className={`p-4 rounded-2xl border text-center ${
                  data.ticket.checkedInAt
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-emerald-50 border-emerald-300 text-emerald-900"
                }`}
              >
                {data.ticket.checkedInAt ? (
                  <>
                    <AlertTriangle className="w-6 h-6 mx-auto mb-1 text-amber-600" />
                    <span className="font-bold text-sm block">पूर्व में प्रयुक्त पास (Already Checked In)</span>
                    <span className="text-xs text-amber-700">
                      प्रवेश समय: {new Date(data.ticket.checkedInAt).toLocaleString("hi-IN")}
                    </span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                    <span className="font-bold text-sm block">वैध डिजिटल पास (Valid Pass)</span>
                    <span className="text-xs text-emerald-700">प्रवेश हेतु अधिकृत (Authorized for Entry)</span>
                  </>
                )}
              </div>

              {/* Pass Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">संदर्भ संख्या:</span>
                  <span className="font-mono font-bold text-stone-900">{data.ticket.bookingReference}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">श्रद्धालु:</span>
                  <span className="font-bold text-stone-900">{data.ticket.devoteeNameMasked}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">सेवा / दर्शन:</span>
                  <span className="font-bold text-stone-900">
                    {data.ticket.serviceTitleHi} ({data.ticket.serviceTitleEn})
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-stone-100">
                  <span className="text-stone-500">दिनांक व समय:</span>
                  <span className="font-bold text-stone-900">
                    {data.ticket.bookingDate} ({data.ticket.slotTime})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-stone-500">अनुमत संख्या:</span>
                  <span className="font-bold text-stone-900">{data.ticket.numberOfDevotees} व्यक्ति</span>
                </div>
              </div>

              <div className="pt-2 text-center">
                <Link
                  href="/hi"
                  className="text-xs text-saffron-700 hover:text-saffron-800 font-semibold underline"
                >
                  श्री जोरावर धाम मुख्य पृष्ठ पर जाएं
                </Link>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default function TicketVerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4 text-stone-500 text-sm">
          डिजिटल पास सत्यापित हो रहा है... (Verifying...)
        </div>
      }
    >
      <TicketVerifyContent />
    </Suspense>
  );
}
