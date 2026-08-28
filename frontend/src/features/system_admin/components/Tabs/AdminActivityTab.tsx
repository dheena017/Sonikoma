import React, { useState, useEffect } from "react";
import { History, Search, Filter, Download, User } from "lucide-react";
import { adminGetAuditLogs } from "@/api";

export function AdminActivityTab({ fetchWithInterceptor }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await adminGetAuditLogs(fetchWithInterceptor);
      if (data.success) setLogs(data.logs);
    } catch (err) {
      console.error("Failed to fetch audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      (log.action || "").toLowerCase().includes(search.toLowerCase()) ||
      (log.email || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141414] border border-[#2F2F2F] rounded-xl p-4">
        <div className="flex-1 flex flex-col sm:flex-row gap-4 w-full">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" />
            <input
              type="text"
              placeholder="Search by action or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-[#3B82F6]/60"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#121212] border border-[#2F2F2F] text-sm text-[#E5E5E5] rounded-lg px-4 py-2 focus:outline-none focus:border-[#3B82F6]/60"
          >
            <option value="ALL">All Statuses</option>
            <option value="Success">Success</option>
            <option value="Failure">Failure</option>
          </select>
        </div>
        <button
          onClick={() => {
            const res = fetchWithInterceptor("/api/auth/admin/activity/export");
            res.then((r: any) => {
              if (r.ok) {
                r.blob().then((blob: any) => {
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `Sonikoma_Audit_Logs_${
                    new Date().toISOString().split("T")[0]
                  }.csv`;
                  a.click();
                });
              }
            });
          }}
          className="btn-secondary px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="bg-[#141414] border border-[#2F2F2F] rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-[#181818] text-[#9CA3AF] border-b border-[#2F2F2F] text-xs uppercase font-semibold">
              <tr>
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">IP Address</th>
                <th className="px-6 py-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2F2F2F]/60">
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    Loading activity...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-neutral-500"
                  >
                    No logs found
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-neutral-600" />
                        <span className="text-neutral-300">
                          {log.email || "System"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-neutral-200">{log.action}</td>
                    <td className="px-6 py-4 text-neutral-500 font-mono text-xs">
                      {log.ip_address}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.status === "Success"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
