import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  Database,
  RefreshCw,
  Zap,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Info,
  Filter,
  ExternalLink,
} from "lucide-react";
import {
  listAdminDomains,
  updateDomainStatus,
  deleteAdminDomain,
  requestDomainOnboarding,
  type DomainRecord,
} from "../../../../api/endpoints/scraper";

// ─── Status badge helper ────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3" /> Approved
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3" /> Pending
        </span>
      );
    case "blocked":
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">
          <ShieldAlert className="w-3 h-3" /> Blocked
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-700/50 text-neutral-400 border border-neutral-700">
          <Info className="w-3 h-3" /> {status}
        </span>
      );
  }
};

// ─── Blueprint preview popover ───────────────────────────────────────────────
const BlueprintPreview = ({ blueprint }: { blueprint: Record<string, any> | null | undefined }) => {
  const [open, setOpen] = useState(false);
  if (!blueprint) return <span className="text-neutral-600 text-xs italic">No blueprint</span>;
  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[10px] text-blue-400 hover:text-blue-300 border border-blue-500/20 bg-blue-500/5 px-2 py-0.5 rounded-full transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Blueprint
      </button>
      {open && (
        <div className="absolute z-50 top-6 left-0 w-80 bg-[#0d0d11] border border-neutral-700 rounded-xl p-3 shadow-2xl">
          <div className="space-y-2">
            {blueprint.container_selector && (
              <div>
                <div className="text-[9px] text-neutral-500 uppercase font-bold mb-0.5">Container Selector</div>
                <code className="text-[11px] text-[#60A5FA] font-mono break-all">{blueprint.container_selector}</code>
              </div>
            )}
            {blueprint.image_url_pattern && (
              <div>
                <div className="text-[9px] text-neutral-500 uppercase font-bold mb-0.5">Image URL Pattern</div>
                <code className="text-[11px] text-emerald-300 font-mono break-all">{blueprint.image_url_pattern}</code>
              </div>
            )}
            {blueprint.worker_strategy && (
              <div>
                <div className="text-[9px] text-neutral-500 uppercase font-bold mb-0.5">Strategy</div>
                <span className="text-[11px] text-amber-300 font-mono">{blueprint.worker_strategy}</span>
              </div>
            )}
            {blueprint.unwanted_patterns?.length > 0 && (
              <div>
                <div className="text-[9px] text-neutral-500 uppercase font-bold mb-0.5">Blocked Patterns</div>
                <div className="flex flex-wrap gap-1">
                  {blueprint.unwanted_patterns.map((p: string, i: number) => (
                    <code key={i} className="text-[10px] text-red-300 bg-red-500/10 px-1.5 py-0.5 rounded font-mono">{p}</code>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Add Domain Modal ────────────────────────────────────────────────────────
const AddDomainModal = ({
  onClose,
  fetchWithInterceptor,
  addNotification,
  onSuccess,
}: {
  onClose: () => void;
  fetchWithInterceptor: any;
  addNotification: any;
  onSuccess: () => void;
}) => {
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await requestDomainOnboarding(fetchWithInterceptor, url.trim(), notes.trim() || undefined);
      if (res.success) {
        addNotification(`Domain '${res.domain}' submitted for review.`, "success");
        onSuccess();
        onClose();
      } else {
        addNotification("Failed to submit domain request.", "error");
      }
    } catch {
      addNotification("Error submitting domain request.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-[#111115] border border-neutral-700 rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
          <Plus className="w-5 h-5 text-blue-400" /> Request Domain Onboarding
        </h3>
        <p className="text-xs text-neutral-500 mb-5">
          Submit a comic website URL to be reviewed and added as a supported scraping source.
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-widest">
              Comic Chapter URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/manga/series/chapter-1"
              className="w-full px-3 py-2.5 bg-black/40 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-400 mb-1.5 uppercase tracking-widest">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why does this site need to be added? Any special login or access requirements?"
              rows={3}
              className="w-full px-3 py-2.5 bg-black/40 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-sm font-bold transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !url.trim()}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Submit Request
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main AdminScrapersTab ────────────────────────────────────────────────────
export function AdminScrapersTab({
  fetchWithInterceptor,
  addNotification,
}: any) {
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchDomains = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminDomains(fetchWithInterceptor, filterStatus === "all" ? undefined : filterStatus);
      setDomains(res.domains || []);
    } catch {
      addNotification("Failed to load domain list.", "error");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, fetchWithInterceptor]);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleStatusChange = async (domain: string, newStatus: "approved" | "pending" | "blocked") => {
    setActionLoading(domain);
    try {
      const res = await updateDomainStatus(fetchWithInterceptor, domain, { status: newStatus });
      if (res.success) {
        addNotification(`Domain '${domain}' set to ${newStatus}.`, "success");
        fetchDomains();
      } else {
        addNotification("Failed to update domain status.", "error");
      }
    } catch {
      addNotification("Error updating domain.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (domain: string) => {
    if (!confirm(`Remove domain '${domain}' from configuration? This cannot be undone.`)) return;
    setActionLoading(domain);
    try {
      const res = await deleteAdminDomain(fetchWithInterceptor, domain);
      if (res.success) {
        addNotification(`Domain '${domain}' removed.`, "success");
        fetchDomains();
      } else {
        addNotification("Failed to delete domain.", "error");
      }
    } catch {
      addNotification("Error deleting domain.", "error");
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = domains.filter((d) =>
    d.domain.toLowerCase().includes(search.toLowerCase()) ||
    (d.requested_by || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = domains.filter((d) => d.status === "pending").length;
  const approvedCount = domains.filter((d) => d.status === "approved").length;
  const blockedCount = domains.filter((d) => d.status === "blocked").length;

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      {/* ── Stats Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Domains", value: domains.length, color: "text-white", icon: <Globe className="w-4 h-4 text-blue-400" /> },
          { label: "Approved", value: approvedCount, color: "text-emerald-400", icon: <ShieldCheck className="w-4 h-4 text-emerald-400" /> },
          { label: "Pending Review", value: pendingCount, color: "text-amber-400", icon: <Clock className="w-4 h-4 text-amber-400" /> },
          { label: "Blocked", value: blockedCount, color: "text-red-400", icon: <ShieldAlert className="w-4 h-4 text-red-400" /> },
        ].map((stat) => (
          <div key={stat.label} className="bg-[#111115] border border-neutral-800 rounded-xl p-4 flex items-center gap-3">
            <div className="p-2 bg-black/30 rounded-lg">{stat.icon}</div>
            <div>
              <div className={`text-xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pending Alert Banner ── */}
      {pendingCount > 0 && (
        <div className="flex items-center gap-3 p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl">
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-sm font-bold text-amber-300">{pendingCount} domain{pendingCount > 1 ? "s" : ""} awaiting review</span>
            <p className="text-xs text-amber-400/60 mt-0.5">Review and approve or block these websites to control what can be scraped.</p>
          </div>
          <button
            onClick={() => setFilterStatus("pending")}
            className="text-xs font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/20 transition-colors"
          >
            Review Now
          </button>
        </div>
      )}

      {/* ── Active Registered Domains Quick Filter Bar ── */}
      {domains.length > 0 && (
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#E5E5E5] uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Globe className="w-3.5 h-3.5 text-[#3B82F6]" />
              Registered Platform Domains ({domains.length})
            </span>
            <span className="text-[10px] text-[#9CA3AF] font-mono">
              Click any domain to filter table
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {domains.map((d) => (
              <button
                key={d.domain}
                onClick={() => setSearch(search === d.domain ? "" : d.domain)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer hover:scale-[1.02] active:scale-95 font-mono ${
                  search === d.domain
                    ? "bg-[#3B82F6] border-[#60A5FA]/40 text-white shadow-sm"
                    : d.status === "approved"
                    ? "border-[#10B981]/30 text-[#10B981] bg-[#10B981]/10"
                    : d.status === "pending"
                    ? "border-[#F59E0B]/30 text-[#F59E0B] bg-[#F59E0B]/10"
                    : "border-[#EF4444]/30 text-[#EF4444] bg-[#EF4444]/10"
                }`}
                title={`Filter table for ${d.domain}`}
              >
                <span>🌐</span>
                <span>{d.domain}</span>
                <span className="text-[9px] opacity-75 font-mono">({d.status})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Domain Table ── */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl overflow-hidden shadow-sm">
        {/* Table header / controls */}
        <div className="p-4 border-b border-[#2F2F2F] bg-[#181818] flex flex-wrap gap-3 items-center justify-between">
          <h3 className="font-bold text-[#E5E5E5] flex items-center gap-2 text-sm">
            <Database className="w-4 h-4 text-[#3B82F6]" />
            Domain Configuration Registry
          </h3>

          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search domains…"
                className="pl-8 pr-3 py-1.5 bg-black/40 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-blue-500/50 transition-colors w-44"
              />
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1 bg-black/30 border border-neutral-800 rounded-lg p-0.5">
              {(["all", "approved", "pending", "blocked"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest transition-all ${
                    filterStatus === s
                      ? "bg-white/10 text-white"
                      : "text-neutral-500 hover:text-neutral-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Refresh */}
            <button
              onClick={fetchDomains}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${loading ? "animate-spin" : ""}`} />
            </button>

            {/* Add domain */}
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Domain
            </button>
          </div>
        </div>

        {/* Table body */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-black/20 text-neutral-500 border-b border-neutral-800 uppercase tracking-widest font-bold text-[9px]">
              <tr>
                <th className="px-5 py-3">Domain</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Blueprint</th>
                <th className="px-5 py-3">Stats</th>
                <th className="px-5 py-3">Requested By</th>
                <th className="px-5 py-3">Last Updated</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <RefreshCw className="w-5 h-5 text-neutral-600 animate-spin mx-auto mb-2" />
                    <div className="text-neutral-600 text-xs">Loading domains…</div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center">
                    <Globe className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
                    <div className="text-neutral-600 text-sm font-bold">No domains found</div>
                    <div className="text-neutral-700 text-xs mt-1">
                      {search ? "Try a different search term" : "Add a domain to get started"}
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((d) => (
                  <tr
                    key={d.domain}
                    className={`hover:bg-white/[0.015] group transition-colors ${
                      d.status === "pending" ? "bg-amber-500/[0.02]" : ""
                    } ${d.status === "blocked" ? "bg-red-500/[0.02]" : ""}`}
                  >
                    {/* Domain */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          d.status === "approved" ? "bg-emerald-500" :
                          d.status === "pending" ? "bg-amber-500 animate-pulse" :
                          "bg-red-500"
                        }`} />
                        <div>
                          <div className="text-neutral-200 font-bold font-mono text-[11px]">{d.domain}</div>
                          {d.sample_url && (
                            <a
                              href={d.sample_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[9px] text-neutral-600 hover:text-blue-400 transition-colors flex items-center gap-0.5 mt-0.5"
                            >
                              <ExternalLink className="w-2.5 h-2.5" />
                              Sample URL
                            </a>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <StatusBadge status={d.status} />
                    </td>

                    {/* Blueprint */}
                    <td className="px-5 py-4">
                      <BlueprintPreview blueprint={d.blueprint} />
                    </td>

                    {/* Stats */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-emerald-400 font-bold">{d.success_count}</div>
                          <div className="text-[9px] text-neutral-600">✓ ok</div>
                        </div>
                        <div className="text-center">
                          <div className={`font-bold ${d.failure_count > 0 ? "text-red-400" : "text-neutral-600"}`}>
                            {d.failure_count}
                          </div>
                          <div className="text-[9px] text-neutral-600">✗ fail</div>
                        </div>
                      </div>
                    </td>

                    {/* Requested By */}
                    <td className="px-5 py-4 text-neutral-500 font-mono text-[10px]">
                      {d.requested_by || <span className="text-neutral-700 italic">system</span>}
                      {d.notes && (
                        <div className="text-[9px] text-neutral-700 max-w-[120px] truncate mt-0.5" title={d.notes}>
                          {d.notes}
                        </div>
                      )}
                    </td>

                    {/* Last Updated */}
                    <td className="px-5 py-4 text-neutral-600 font-mono text-[10px]">
                      {d.updated_at
                        ? new Date(d.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        {d.status !== "approved" && (
                          <button
                            onClick={() => handleStatusChange(d.domain, "approved")}
                            disabled={actionLoading === d.domain}
                            title="Approve domain"
                            className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {actionLoading === d.domain ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                        {d.status !== "blocked" && (
                          <button
                            onClick={() => handleStatusChange(d.domain, "blocked")}
                            disabled={actionLoading === d.domain}
                            title="Block domain"
                            className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {d.status === "blocked" && (
                          <button
                            onClick={() => handleStatusChange(d.domain, "pending")}
                            disabled={actionLoading === d.domain}
                            title="Move back to pending"
                            className="p-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <Clock className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(d.domain)}
                          disabled={actionLoading === d.domain}
                          title="Delete domain record"
                          className="p-1.5 bg-neutral-700/40 hover:bg-red-500/10 text-neutral-500 hover:text-red-400 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 border-t border-neutral-800/50 bg-black/10 flex items-center justify-between">
            <span className="text-[10px] text-neutral-600">
              Showing {filtered.length} of {domains.length} registered domains
            </span>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] text-neutral-600">Domain registry live</span>
            </div>
          </div>
        )}
      </div>

      {/* ── Engine Info Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm mb-4">
            <Globe className="w-4 h-4 text-blue-400" /> Extraction Engine
            <span className="ml-auto px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-500/20">
              Active
            </span>
          </h3>
          <div className="space-y-2">
            {[
              { label: "AI Strategy", value: "Gemini 2.5 Flash" },
              { label: "Fallback Engine", value: "Playwright (Browser)" },
              { label: "Concurrency Limit", value: "10 Tasks / Node" },
              { label: "Proxy Cache", value: "SQLite Domain Memory" },
            ].map((row) => (
              <div key={row.label} className="flex justify-between items-center p-2.5 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
                <span className="text-xs text-neutral-500">{row.label}</span>
                <span className="text-xs text-neutral-200 font-bold">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-5">
          <h3 className="font-bold text-white flex items-center gap-2 text-sm mb-4">
            <Zap className="w-4 h-4 text-amber-400" /> Domain Approval Flow
          </h3>
          <div className="space-y-3">
            {[
              { step: "1", label: "User requests URL", desc: "System auto-detects domain, queues for review", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
              { step: "2", label: "Admin reviews", desc: "Approve, block, or update blueprint selectors", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
              { step: "3", label: "AI Auto-Inspect", desc: "Gemini analyzes HTML to generate blueprint", color: "text-[#3B82F6] bg-[#3B82F6]/10 border-[#3B82F6]/20" },
              { step: "4", label: "Goes Live", desc: "All users can now scrape from this domain", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
            ].map((item) => (
              <div key={item.step} className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border flex-shrink-0 ${item.color}`}>
                  {item.step}
                </div>
                <div>
                  <div className="text-xs font-bold text-neutral-200">{item.label}</div>
                  <div className="text-[10px] text-neutral-600">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Add Domain Modal ── */}
      {showAddModal && (
        <AddDomainModal
          onClose={() => setShowAddModal(false)}
          fetchWithInterceptor={fetchWithInterceptor}
          addNotification={addNotification}
          onSuccess={fetchDomains}
        />
      )}
    </div>
  );
}
