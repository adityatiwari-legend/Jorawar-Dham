"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  Calendar,
  Heart,
  CheckCircle2,
  XCircle,
  Phone,
  ShieldCheck,
  X,
  UserCheck,
} from "lucide-react";

interface AdminDevotee {
  id: string;
  phone: string;
  fullName: string;
  city: string;
  state: string;
  status: string;
  isPhoneVerified: boolean;
  bookingsCount: number;
  donationsCount: number;
  createdAt: string;
}

interface DevoteeDetail {
  id: string;
  phone: string;
  fullName: string;
  email?: string | null;
  city?: string | null;
  state?: string | null;
  status: string;
  isPhoneVerified: boolean;
  createdAt: string;
  bookings: {
    id: string;
    reference: string;
    service: string;
    date: string;
    slot: string;
    devotees: number;
    status: string;
    amount: number;
  }[];
  donations: {
    id: string;
    reference: string;
    cause: string;
    amount: number;
    status: string;
    date: string;
  }[];
}

export default function AdminDevoteesPage() {
  const [devotees, setDevotees] = useState<AdminDevotee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedDevotee, setSelectedDevotee] = useState<DevoteeDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const fetchDevotees = async () => {
    setLoading(true);
    try {
      let url = "/api/admin/devotees?";
      if (search.trim()) url += `search=${encodeURIComponent(search.trim())}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setDevotees(data.devotees || []);
      }
    } catch (err) {
      console.error("Failed to load devotees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevotees();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchDevotees();
  };

  const handleOpenDevotee = async (id: string) => {
    setDrawerLoading(true);
    try {
      const res = await fetch(`/api/admin/devotees?id=${id}`);
      const data = await res.json();
      if (data.success) {
        setSelectedDevotee(data.devotee);
      }
    } catch (err) {
      console.error("Failed to load devotee details:", err);
    } finally {
      setDrawerLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-stone-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-saffron-600" />
            तीर्थयात्री एवं श्रद्धालु प्रबंधन (Devotee Directory)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            पंजीकृत श्रद्धालुओं की सूची, दर्शन आवृत्ति, सेवा इतिहास एवं सुरक्षित संपर्क विवरण
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchDevotees}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="मोबाइल नंबर, नाम अथवा ईमेल द्वारा खोजें..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-stone-50 border border-stone-300 text-xs focus:ring-2 focus:ring-saffron-500 focus:outline-none"
          />
        </form>

        <button
          type="button"
          onClick={fetchDevotees}
          className="px-5 py-2 rounded-xl bg-maroon-800 hover:bg-maroon-900 text-white font-bold text-xs shadow transition shrink-0"
        >
          खोजें (Search)
        </button>
      </div>

      {/* Devotees Table */}
      <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-stone-600 font-semibold uppercase tracking-wider">
                <th className="py-3.5 px-4">श्रद्धालु नाम (Name)</th>
                <th className="py-3.5 px-4">मोबाइल नंबर (Phone)</th>
                <th className="py-3.5 px-4">शहर / राज्य</th>
                <th className="py-3.5 px-4 text-center">सत्यापन स्थिति</th>
                <th className="py-3.5 px-4 text-center">कुल बुकिंग्स</th>
                <th className="py-3.5 px-4 text-center">कुल दान</th>
                <th className="py-3.5 px-4 text-center">पंजीकरण दिनांक</th>
                <th className="py-3.5 px-4 text-right">कार्य (Actions)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-stone-400" />
                    <span>श्रद्धालु सूची लोड हो रही है...</span>
                  </td>
                </tr>
              ) : devotees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-stone-500">
                    कोई श्रद्धालु रिकॉर्ड नहीं मिला।
                  </td>
                </tr>
              ) : (
                devotees.map((devotee) => (
                  <tr key={devotee.id} className="hover:bg-stone-50 transition-colors">
                    <td className="py-3.5 px-4">
                      <strong className="block text-stone-900 font-bold">{devotee.fullName}</strong>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-stone-700">
                      +91 {devotee.phone}
                    </td>

                    <td className="py-3.5 px-4 text-stone-600">
                      {devotee.city}{devotee.state !== "—" ? `, ${devotee.state}` : ""}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          devotee.isPhoneVerified
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {devotee.isPhoneVerified ? "सत्यापित (OTP)" : "लंबित"}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-maroon-800">
                      {devotee.bookingsCount}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono font-bold text-stone-800">
                      {devotee.donationsCount}
                    </td>

                    <td className="py-3.5 px-4 text-center text-stone-500 font-mono text-[10px]">
                      {devotee.createdAt}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDevotee(devotee.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-stone-100 hover:bg-maroon-800 hover:text-white text-stone-700 text-xs font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>प्रोफाइल</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Devotee Profile Drawer Modal */}
      {selectedDevotee && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0">
          <div className="bg-white h-full max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-300">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cream-warm border border-gold-royal/40 flex items-center justify-center text-maroon-800">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-stone-900">{selectedDevotee.fullName}</h3>
                  <span className="text-xs font-mono text-stone-500">+91 {selectedDevotee.phone}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedDevotee(null)}
                className="p-1.5 text-stone-400 hover:text-stone-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-stone-400 block text-[10px]">सत्यापन स्थिति:</span>
                  <strong className="text-emerald-700">{selectedDevotee.isPhoneVerified ? "OTP Verified" : "Pending"}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">खाता स्थिति:</span>
                  <strong className="text-stone-900">{selectedDevotee.status}</strong>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">निवास शहर:</span>
                  <span className="text-stone-800">{selectedDevotee.city || "—"}</span>
                </div>
                <div>
                  <span className="text-stone-400 block text-[10px]">पंजीकरण दिनांक:</span>
                  <span className="font-mono text-stone-800">{selectedDevotee.createdAt}</span>
                </div>
              </div>
            </div>

            {/* Devotee's Bookings History */}
            <div className="space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-saffron-600" />
                <span>दर्शन पासेज इतिहास ({selectedDevotee.bookings.length}):</span>
              </h4>

              {selectedDevotee.bookings.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">कोई दर्शन बुकिंग नहीं मिली।</p>
              ) : (
                <div className="space-y-2">
                  {selectedDevotee.bookings.map((b) => (
                    <div key={b.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                      <div>
                        <strong className="font-mono text-maroon-800 block">{b.reference}</strong>
                        <span className="text-stone-700 font-serif">{b.service}</span>
                        <span className="text-stone-400 block text-[10px]">{b.date} • {b.slot}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 block">
                          {b.status}
                        </span>
                        <span className="text-stone-500 font-mono text-[10px] block mt-1">₹{b.amount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Devotee's Donations History */}
            <div className="space-y-3 pt-2 border-t border-stone-200">
              <h4 className="font-bold text-xs uppercase tracking-wider text-stone-600 flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-saffron-600" />
                <span>धर्मार्थ दान इतिहास ({selectedDevotee.donations.length}):</span>
              </h4>

              {selectedDevotee.donations.length === 0 ? (
                <p className="text-xs text-stone-400 py-2">कोई दान प्रविष्टि नहीं मिली।</p>
              ) : (
                <div className="space-y-2">
                  {selectedDevotee.donations.map((d) => (
                    <div key={d.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex justify-between items-center">
                      <div>
                        <strong className="font-mono text-stone-700 block">{d.reference}</strong>
                        <span className="text-stone-600">{d.cause}</span>
                        <span className="text-stone-400 block text-[10px]">{d.date}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-sm text-maroon-800 block">₹{d.amount}</span>
                        <span className="text-[10px] text-emerald-700 font-semibold">{d.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
