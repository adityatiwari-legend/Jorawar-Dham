"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Loader2, Filter } from "lucide-react";

interface AuditLogEntry {
  id: string;
  actorType: string;
  actorId?: string | null;
  actorEmail?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntity, setSelectedEntity] = useState<string>("");

  const fetchLogs = async (entityFilter?: string) => {
    try {
      setLoading(true);
      const url = entityFilter
        ? `/api/admin/audit-logs?entity=${encodeURIComponent(entityFilter)}`
        : "/api/admin/audit-logs";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setLogs(data.data);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleFilterChange = (entity: string) => {
    setSelectedEntity(entity);
    fetchLogs(entity);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 font-serif flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-saffron-600" />
            <span>Security & Administrative Audit Logs</span>
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Immutable, tamper-evident ledger tracking sensitive admin mutations, logins, and settings changes.
          </p>
        </div>

        {/* Entity Filter */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-stone-200 shadow-sm text-xs">
          <Filter className="w-3.5 h-3.5 text-stone-500" />
          <select
            value={selectedEntity}
            onChange={(e) => handleFilterChange(e.target.value)}
            className="bg-transparent text-stone-800 font-medium focus:outline-none"
          >
            <option value="">All Entities</option>
            <option value="Admin">Admin Auth</option>
            <option value="Notice">Notices</option>
            <option value="Event">Events</option>
            <option value="PageSection">Pages</option>
            <option value="GalleryItem">Gallery</option>
            <option value="SiteSetting">Settings</option>
            <option value="SYSTEM_INITIALIZATION">System Alerts</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-stone-500 flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Reading security ledger...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-stone-500">
            No audit logs found for the selected criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 uppercase text-[11px] font-semibold text-stone-500">
                <tr>
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Actor</th>
                  <th className="py-3.5 px-4">Details</th>
                  <th className="py-3.5 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                    <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString("en-IN")}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-semibold text-[10px] ${
                          log.action.includes("CREATE")
                            ? "bg-emerald-100 text-emerald-800"
                            : log.action.includes("UPDATE")
                            ? "bg-amber-100 text-amber-800"
                            : log.action.includes("DELETE")
                            ? "bg-rose-100 text-rose-800"
                            : log.action.includes("FAILURE")
                            ? "bg-red-100 text-red-900"
                            : "bg-stone-200 text-stone-800"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-900 whitespace-nowrap">
                      {log.entity}
                    </td>
                    <td className="py-3 px-4 text-stone-700">
                      <span className="font-medium text-stone-900 block truncate max-w-[150px]">
                        {log.actorEmail || "System"}
                      </span>
                      <span className="text-[10px] text-stone-400 font-mono">
                        Type: {log.actorType}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600 max-w-xs">
                      {log.details ? (
                        <pre className="text-[11px] font-mono bg-stone-50 p-1.5 rounded border border-stone-200 overflow-x-auto">
                          {JSON.stringify(log.details)}
                        </pre>
                      ) : (
                        <span className="text-stone-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-500 font-mono text-[11px]">
                      {log.ipAddress || "127.0.0.1"}
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
