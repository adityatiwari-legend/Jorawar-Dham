"use client";

import { useState, useEffect } from "react";
import { Save, Loader2, CheckCircle2, Settings } from "lucide-react";

interface SiteSetting {
  id: string;
  key: string;
  value: string;
  description?: string | null;
  isPublic: boolean;
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/settings");
      const data = await res.json();
      if (data.success) {
        setSettings(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess("Temple settings successfully saved to database!");
        setTimeout(() => setSuccess(null), 3000);
      } else {
        alert(data.error || "Save failed");
      }
    } catch {
      alert("Network error updating settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif">
            Temple Operational Settings
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Configure temple contact phone numbers, devotee helplines, official addresses, and hours.
          </p>
        </div>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{success}</span>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-stone-500 flex items-center justify-center gap-2 bg-white rounded-2xl border border-stone-200">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading temple configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {settings.map((s, idx) => (
              <div key={s.id} className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-800">
                  {s.description || s.key}
                  <span className="text-[10px] text-stone-400 font-mono block font-normal">
                    Key: {s.key}
                  </span>
                </label>
                <input
                  type="text"
                  value={s.value}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSettings((prev) =>
                      prev.map((item, i) => (i === idx ? { ...item, value: val } : item))
                    );
                  }}
                  className="w-full px-3.5 py-2.5 border border-stone-300 rounded-xl text-sm focus:ring-2 focus:ring-saffron-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-saffron-600 hover:bg-saffron-700 text-white text-xs font-semibold px-6 py-2.5 rounded-xl shadow-sm transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save All Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
