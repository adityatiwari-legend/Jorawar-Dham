"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Shield,
  UserPlus,
  RefreshCw,
  Lock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface AdminUser {
  id: string;
  username: string;
  email: string;
  name: string;
  status: string;
  roles: string[];
  lastLoginAt?: string | null;
  createdAt: string;
}

const AVAILABLE_ROLES = [
  { id: "SUPER_ADMIN", label: "Super Admin", desc: "पूर्ण नियंत्रण एवं सभी विशेषाधिकार" },
  { id: "FINANCE_ADMIN", label: "Finance Admin", desc: "भुगतान, रिफंड, दान लेजर एवं वित्तीय रिपोर्ट्स" },
  { id: "BOOKING_ADMIN", label: "Booking Admin", desc: "दर्शन पासेज, स्लॉट क्षमता एवं काउन्टर बुकिंग" },
  { id: "CONTENT_ADMIN", label: "Content Admin", desc: "सीएमएस, पृष्ठ, सूचनाएं व धार्मिक इतिहास" },
  { id: "EVENT_ADMIN", label: "Event Admin", desc: "मेला, उत्सव एवं धार्मिक कार्यक्रम प्रबंधन" },
  { id: "STAFF", label: "Temple Staff", desc: "प्रवेश द्वार क्यूआर स्कैनर एवं सत्यापन" },
];

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [devoteesCount, setDevoteesCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);

  // Create Admin Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    roles: ["STAFF"],
  });
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setUnauthorized(false);
    try {
      const res = await fetch("/api/admin/users");
      if (res.status === 403) {
        setUnauthorized(true);
        return;
      }
      const data = await res.json();
      if (data.success) {
        setAdmins(data.admins || []);
        setDevoteesCount(data.devoteesCount || 0);
      }
    } catch (err) {
      console.error("Failed to load admin users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = (roleId: string) => {
    if (createForm.roles.includes(roleId)) {
      if (createForm.roles.length > 1) {
        setCreateForm({
          ...createForm,
          roles: createForm.roles.filter((r) => r !== roleId),
        });
      }
    } else {
      setCreateForm({
        ...createForm,
        roles: [...createForm.roles, roleId],
      });
    }
  };

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    setActionMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setActionMessage({ text: data.error || "व्यवस्थापक निर्माण विफल रहा", isError: true });
        return;
      }

      setActionMessage({ text: `नया व्यवस्थापक खाता निर्मित: ${createForm.email}` });
      setShowCreateModal(false);
      setCreateForm({
        username: "",
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        roles: ["STAFF"],
      });
      fetchUsers();
    } catch (err) {
      setActionMessage({ text: "प्रक्रिया में सर्वर त्रुटि", isError: true });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async (adminId: string, currentStatus: string) => {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminId, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        alert(data.error || "स्थिति अद्यतन विफल");
      }
    } catch {
      alert("सर्वर त्रुटि");
    }
  };

  if (unauthorized) {
    return (
      <div className="bg-white rounded-3xl p-12 border border-stone-200 text-center space-y-4 max-w-xl mx-auto my-12 shadow-sm">
        <div className="w-14 h-14 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-stone-900">सर्वोच्च विशेषाधिकार आवश्यक (Super Admin Only)</h2>
        <p className="text-xs text-stone-500 leading-relaxed">
          सुरक्षा एवं न्यूनतम विशेषाधिकार सिद्धांत (Least Privilege) के अंतर्गत प्रशासनिक उपयोगकर्ताओं एवं भूमिकाओं (Roles) का प्रबंधन केवल <code>SUPER_ADMIN</code> द्वारा ही किया जा सकता है।
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
            <Shield className="w-6 h-6 text-saffron-600" />
            व्यवस्थापक एवं भूमिका नियंत्रण (RBAC User Management)
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            मंदिर प्रबंधन दल के सदस्यों, भूमिकाओं (Roles) व अनुमतियों का कठोर नियंत्रण
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>नया व्यवस्थापक जोड़ें</span>
          </button>

          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-stone-200 text-stone-800 hover:bg-stone-300 rounded-xl text-xs font-semibold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>रिफ्रेश</span>
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm">
          <span className="text-xs font-medium text-stone-500 block">कुल अधिकृत व्यवस्थापक</span>
          <span className="text-2xl font-bold text-stone-900 mt-1 block">{admins.length}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-100 shadow-sm">
          <span className="text-xs font-medium text-emerald-600 block">सक्रिय (Active Staff)</span>
          <span className="text-2xl font-bold text-emerald-700 mt-1 block">
            {admins.filter((a) => a.status === "ACTIVE").length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-100 shadow-sm">
          <span className="text-xs font-medium text-blue-600 block">पंजीकृत श्रद्धालु खाते</span>
          <span className="text-2xl font-bold text-blue-700 mt-1 block">{devoteesCount}</span>
        </div>
      </div>

      {/* Admins Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-stone-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-saffron-600" />
            व्यवस्थापक सूची लोड हो रही है...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 text-xs font-semibold">
                <tr>
                  <th className="py-3.5 px-4">नाम एवं यूजरनेम</th>
                  <th className="py-3.5 px-4">ईमेल (Email)</th>
                  <th className="py-3.5 px-4">भूमिकाएं (Roles)</th>
                  <th className="py-3.5 px-4">अंतिम लॉगिन</th>
                  <th className="py-3.5 px-4">स्थिति</th>
                  <th className="py-3.5 px-4 text-right">कार्रवाई</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {admins.map((a) => (
                  <tr key={a.id} className="hover:bg-stone-50/60 transition">
                    <td className="py-3.5 px-4">
                      <span className="font-bold text-stone-900 block">{a.name}</span>
                      <span className="text-xs text-stone-400 font-mono">@{a.username}</span>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-stone-600">{a.email}</td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {a.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              r === "SUPER_ADMIN"
                                ? "bg-red-100 text-red-800 border border-red-200"
                                : r === "FINANCE_ADMIN"
                                ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                : r === "BOOKING_ADMIN"
                                ? "bg-amber-100 text-amber-800 border border-amber-200"
                                : "bg-stone-100 text-stone-700 border border-stone-200"
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-stone-500">
                      {a.lastLoginAt ? new Date(a.lastLoginAt).toLocaleString("en-IN") : "कदापि नहीं"}
                    </td>
                    <td className="py-3.5 px-4">
                      {a.status === "ACTIVE" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> सक्रिय
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3" /> निलंबित
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {!a.roles.includes("SUPER_ADMIN") && (
                        <button
                          onClick={() => handleToggleStatus(a.id, a.status)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                            a.status === "ACTIVE"
                              ? "text-red-600 hover:bg-red-50"
                              : "text-emerald-600 hover:bg-emerald-50"
                          }`}
                        >
                          {a.status === "ACTIVE" ? "निलंबित करें" : "सक्रिय करें"}
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

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-lg text-stone-900">नया प्रशासनिक खाता बनाएं</h3>
                <p className="text-xs text-stone-500">
                  Argon2id सुरक्षा व भूमिका-आधारित पहुंच (Least Privilege)
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateAdmin} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">प्रथम नाम *</label>
                  <input
                    type="text"
                    required
                    value={createForm.firstName}
                    onChange={(e) => setCreateForm({ ...createForm, firstName: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">अंतिम नाम</label>
                  <input
                    type="text"
                    value={createForm.lastName}
                    onChange={(e) => setCreateForm({ ...createForm, lastName: e.target.value })}
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">यूजरनेम *</label>
                  <input
                    type="text"
                    required
                    value={createForm.username}
                    onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
                    placeholder="e.g. rahul_finance"
                    className="w-full p-2 border border-stone-300 rounded-xl font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">आधिकारिक ईमेल *</label>
                  <input
                    type="email"
                    required
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="user@jorawardham.org"
                    className="w-full p-2 border border-stone-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  सुरक्षित पासवर्ड (कम से कम 8 अक्षर) *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1.5">
                  भूमिका चयन (Select Roles - Least Privilege) *
                </label>
                <div className="space-y-2 border border-stone-200 p-3 rounded-2xl bg-stone-50">
                  {AVAILABLE_ROLES.map((r) => (
                    <label
                      key={r.id}
                      className="flex items-start gap-2.5 p-2 rounded-xl hover:bg-white transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={createForm.roles.includes(r.id)}
                        onChange={() => handleRoleToggle(r.id)}
                        className="mt-0.5 rounded text-saffron-600 focus:ring-saffron-500"
                      />
                      <div>
                        <span className="font-bold text-stone-800 block text-xs">{r.label}</span>
                        <span className="text-[11px] text-stone-500">{r.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-stone-300 text-stone-600 rounded-xl font-semibold hover:bg-stone-50"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-4 py-2 bg-saffron-600 hover:bg-saffron-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {actionLoading ? "खाता बन रहा है..." : "खाता बनाएं"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
