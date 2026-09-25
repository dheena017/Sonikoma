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
  AlertTriangle,
  Info,
  ExternalLink,
  Shield,
  Sliders,
  Cpu,
  Layers,
  Check,
  X,
  Activity,
  ArrowRight,
  Sparkles,
  Server,
  Code,
  Gauge,
  Timer,
  Network,
  RotateCcw,
  FileText,
  CheckCircle2,
} from "lucide-react";
import DeleteConfirmModal from "@/shared/ui/modal/DeleteConfirmModal";
import {
  listAdminDomains,
  updateDomainStatus,
  deleteAdminDomain,
  saveDomainRule,
  checkDomainBlocked,
  separateComicUrl,
  listAdapters,
  getScraperHealth,
  clearScraperCache,
  type DomainRecord,
  type AdapterMeta,
  type SeparateUrlResult,
} from "../../../../api/endpoints/scraper";

// ─── Status Badge Component ──────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) => {
  switch (status.toLowerCase()) {
    case "approved":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Approved
        </span>
      );
    case "pending":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <Clock className="w-3 h-3 text-amber-400" /> Pending Review
        </span>
      );
    case "blocked":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
          <ShieldAlert className="w-3 h-3 text-red-400" /> Blocked
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-neutral-800 text-neutral-400 border border-neutral-700">
          <Info className="w-3 h-3" /> {status}
        </span>
      );
  }
};

// ─── Comprehensive Add/Edit Domain Rule Modal ────────────────────────────────
interface RuleModalProps {
  initialData?: DomainRecord | null;
  onClose: () => void;
  fetchWithInterceptor: any;
  addNotification: any;
  onSuccess: () => void;
  onRequestDelete?: (domain: string) => void;
}

const DomainRuleModal = ({
  initialData,
  onClose,
  fetchWithInterceptor,
  addNotification,
  onSuccess,
  onRequestDelete,
}: RuleModalProps) => {
  const isEditing = Boolean(initialData);

  // Form tabs
  const [modalTab, setModalTab] = useState<"general" | "engine" | "headers">(
    "general"
  );

  // General Fields
  const [domainInput, setDomainInput] = useState(initialData?.domain || "");
  const [status, setStatus] = useState<"approved" | "blocked" | "pending">(
    (initialData?.status as any) || "approved"
  );
  const [rateLimit, setRateLimit] = useState(
    initialData?.rate_limit_per_min || 30
  );

  // Engine & Performance Fields
  const [engineStrategy, setEngineStrategy] = useState<
    "auto" | "http_fast" | "browser_playwright"
  >((initialData?.engine_strategy as any) || "auto");
  const [proxyRequired, setProxyRequired] = useState(
    Boolean(initialData?.proxy_required)
  );
  const [timeoutSec, setTimeoutSec] = useState(initialData?.timeout_sec || 30);
  const [maxConcurrency, setMaxConcurrency] = useState(
    initialData?.max_concurrency || 2
  );
  const [retryAttempts, setRetryAttempts] = useState(
    initialData?.retry_attempts || 2
  );

  // Headers & Notes
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [customHeaders, setCustomHeaders] = useState(
    initialData?.custom_headers || "{}"
  );

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = domainInput.trim().toLowerCase();
    if (!cleaned) return;

    try {
      if (cleaned.includes("://")) {
        const u = new URL(cleaned);
        cleaned = u.hostname;
      }
    } catch {
      // Keep as entered
    }

    setSubmitting(true);
    try {
      await saveDomainRule(fetchWithInterceptor, {
        domain: cleaned,
        is_blocked: status === "blocked",
        rate_limit_per_min: Number(rateLimit) || 30,
        proxy_required: proxyRequired,
        engine_strategy: engineStrategy,
        timeout_sec: Number(timeoutSec) || 30,
        max_concurrency: Number(maxConcurrency) || 2,
        retry_attempts: Number(retryAttempts) || 2,
        notes: notes.trim(),
        custom_headers: customHeaders.trim() || "{}",
      });

      // Also ensure status is reflected via scraper admin API
      await updateDomainStatus(fetchWithInterceptor, cleaned, {
        status: status,
      });

      addNotification(
        `Domain rule for '${cleaned}' ${
          isEditing ? "updated" : "created"
        } successfully.`,
        "success"
      );
      onSuccess();
      onClose();
    } catch {
      addNotification("Failed to save domain configuration rule.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9990] flex items-center justify-center p-4 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-[#111115] border border-[#2F2F2F] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Gradient Accent */}
        <div className="h-[2px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Modal Header */}
        <div className="p-5 border-b border-[#2F2F2F] flex items-center justify-between shrink-0 bg-[#141414]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6]">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white tracking-tight">
                  {isEditing
                    ? `Edit Rule: ${initialData?.domain}`
                    : "Add New Scraper Domain Rule"}
                </h3>
                {isEditing && <StatusBadge status={status} />}
              </div>
              <p className="text-xs text-neutral-400">
                Configure rate limits, anti-bot bypass strategies, proxy
                routing, and timeouts.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-800 rounded-full text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Sub-Tabs */}
        <div className="flex items-center border-b border-[#2F2F2F] px-5 bg-[#0e0e12] shrink-0 gap-1 text-xs">
          <button
            type="button"
            onClick={() => setModalTab("general")}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              modalTab === "general"
                ? "border-blue-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            General & Rate Limits
          </button>

          <button
            type="button"
            onClick={() => setModalTab("engine")}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              modalTab === "engine"
                ? "border-blue-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            Engine & Network
          </button>

          <button
            type="button"
            onClick={() => setModalTab("headers")}
            className={`py-3 px-3 font-semibold border-b-2 transition-all flex items-center gap-1.5 ${
              modalTab === "headers"
                ? "border-blue-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-200"
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Headers & Notes
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-5 overflow-y-auto flex-1 text-xs font-sans"
        >
          {/* ── TAB 1: GENERAL & RATE LIMITS ── */}
          {modalTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Domain Hostname or Target URL *
                </label>
                <input
                  type="text"
                  disabled={isEditing}
                  value={domainInput}
                  onChange={(e) => setDomainInput(e.target.value)}
                  placeholder="e.g. mangadex.org or https://asuracomic.net"
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 disabled:opacity-50 disabled:bg-neutral-900 font-mono transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                    Firewall Permission
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                  >
                    <option value="approved">Approved (Allowed)</option>
                    <option value="blocked">Blocked (Banned)</option>
                    <option value="pending">Pending Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                    Rate Limit (req / min)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={600}
                    value={rateLimit}
                    onChange={(e) => setRateLimit(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>
              </div>

              {/* Rate Limit Presets */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-neutral-500 font-mono">
                  Quick Presets:
                </span>
                {[15, 30, 60, 120].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setRateLimit(preset)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                      rateLimit === preset
                        ? "bg-blue-600 text-white"
                        : "bg-neutral-800 text-neutral-400 hover:text-white"
                    }`}
                  >
                    {preset} req/m
                  </button>
                ))}
              </div>

              {/* Editing historical stats if available */}
              {isEditing &&
                (initialData?.success_count !== undefined ||
                  initialData?.failure_count !== undefined) && (
                  <div className="p-4 bg-black/30 border border-[#2F2F2F] rounded-2xl space-y-2 mt-4">
                    <span className="text-[10px] uppercase tracking-wider text-neutral-400 font-mono font-bold block">
                      Domain Execution History:
                    </span>
                    <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                      <div className="p-2.5 bg-[#181818] rounded-xl border border-[#2F2F2F] flex items-center justify-between">
                        <span className="text-emerald-400 flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Successful
                          Runs
                        </span>
                        <span className="text-white font-bold">
                          {initialData?.success_count || 0}
                        </span>
                      </div>
                      <div className="p-2.5 bg-[#181818] rounded-xl border border-[#2F2F2F] flex items-center justify-between">
                        <span className="text-red-400 flex items-center gap-1.5 font-bold">
                          <XCircle className="w-3.5 h-3.5" /> Failures
                        </span>
                        <span className="text-white font-bold">
                          {initialData?.failure_count || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          )}

          {/* ── TAB 2: ENGINE & NETWORK ── */}
          {modalTab === "engine" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Extraction Engine Strategy
                </label>
                <select
                  value={engineStrategy}
                  onChange={(e) => setEngineStrategy(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
                >
                  <option value="auto">
                    Adaptive Auto-Detect (AI + Dynamic Browser Fallback)
                  </option>
                  <option value="http_fast">
                    High-Speed Direct HTTP (Cheerio / Raw HTML Stream)
                  </option>
                  <option value="browser_playwright">
                    Headless Browser (Playwright / Cloudflare WAF Bypass)
                  </option>
                </select>
                <p className="text-[11px] text-neutral-500 mt-1">
                  Controls whether to parse lightweight HTML directly or spin up
                  a full Chromium session.
                </p>
              </div>

              {/* Proxy Network Routing */}
              <div className="p-3.5 bg-black/40 border border-[#2F2F2F] rounded-xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-400" /> Residential
                    Proxy Routing
                  </span>
                  <p className="text-[11px] text-neutral-400">
                    Route requests through residential proxy nodes to evade IP
                    rate limits and geoblocks.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={proxyRequired}
                  onChange={(e) => setProxyRequired(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 bg-neutral-800 border-[#2F2F2F] focus:ring-neutral-700 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                    Timeout (sec)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={180}
                    value={timeoutSec}
                    onChange={(e) => setTimeoutSec(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                    Max Parallel
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={maxConcurrency}
                    onChange={(e) => setMaxConcurrency(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                    Retry Attempts
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5}
                    value={retryAttempts}
                    onChange={(e) => setRetryAttempts(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white focus:outline-none focus:border-neutral-600 font-mono"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ── TAB 3: HEADERS & NOTES ── */}
          {modalTab === "headers" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Custom Request Headers (JSON)
                </label>
                <textarea
                  value={customHeaders}
                  onChange={(e) => setCustomHeaders(e.target.value)}
                  placeholder='{"User-Agent": "Custom/1.0", "Referer": "https://..."}'
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-emerald-300 placeholder-neutral-600 focus:outline-none focus:border-neutral-600 font-mono resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-300 mb-1.5 uppercase tracking-wider font-mono">
                  Domain Notes & Anti-Scrape Caveats
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Requires image proxying; lazy-loaded panels stored in data-src attribute."
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-600 font-sans resize-none"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#2F2F2F] flex items-center justify-between gap-3">
            {isEditing && onRequestDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (initialData?.domain) {
                    onRequestDelete(initialData.domain);
                    onClose();
                  }
                }}
                className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Rule
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !domainInput.trim()}
                className="px-5 py-2 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                {submitting ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                {isEditing ? "Save Changes" : "Create Rule"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Main AdminScrapersTab Component ─────────────────────────────────────────
export function AdminScrapersTab({
  fetchWithInterceptor,
  addNotification,
}: {
  fetchWithInterceptor: any;
  addNotification: any;
}) {
  // Navigation
  const [activeSubTab, setActiveSubTab] = useState<"domains" | "adapters">(
    "domains"
  );

  // Domain records & filters
  const [domains, setDomains] = useState<DomainRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "approved" | "blocked" | "pending"
  >("all");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Engine health & Adapters state
  const [health, setHealth] = useState<{
    status: string;
    version: string;
    in_memory_l1_cache_size: number;
    in_memory_l5_cache_size: number;
    active_in_flight_jobs: number;
  } | null>(null);
  const [adapters, setAdapters] = useState<AdapterMeta[]>([]);
  const [clearingCache, setClearingCache] = useState(false);

  // Modals & Delete Confirmation
  const [editingDomain, setEditingDomain] = useState<DomainRecord | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [domainToDelete, setDomainToDelete] = useState<string | null>(null);

  // Interactive URL Inspector / Probe
  const [showProbe, setShowProbe] = useState(false);
  const [probeUrl, setProbeUrl] = useState("");
  const [probing, setProbing] = useState(false);
  const [probeResult, setProbeResult] = useState<{
    separated?: SeparateUrlResult;
    blockedCheck?: { is_blocked: boolean; reason?: string | null };
  } | null>(null);

  // Load domains
  const loadDomains = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listAdminDomains(fetchWithInterceptor);
      setDomains(res.domains || []);
    } catch {
      addNotification("Failed to load domain rules from database.", "error");
    } finally {
      setLoading(false);
    }
  }, [fetchWithInterceptor, addNotification]);

  // Load system metrics (Health & Adapters)
  const loadSystemMetrics = useCallback(async () => {
    try {
      const [hRes, aRes] = await Promise.all([
        getScraperHealth(fetchWithInterceptor).catch(() => null),
        listAdapters(fetchWithInterceptor).catch(() => ({
          total: 0,
          adapters: [],
        })),
      ]);
      if (hRes) setHealth(hRes);
      if (aRes?.adapters) setAdapters(aRes.adapters);
    } catch (err) {
      console.error("Failed to load scraper metrics", err);
    }
  }, [fetchWithInterceptor]);

  useEffect(() => {
    loadDomains();
    loadSystemMetrics();
  }, [loadDomains, loadSystemMetrics]);

  // Fast Toggle Status (Approved <-> Blocked)
  const handleToggleStatus = async (d: DomainRecord) => {
    const nextStatus = d.status === "approved" ? "blocked" : "approved";
    setActionLoading(d.domain);
    try {
      await saveDomainRule(fetchWithInterceptor, {
        domain: d.domain,
        is_blocked: nextStatus === "blocked",
        rate_limit_per_min: d.rate_limit_per_min || 30,
        proxy_required: Boolean(d.proxy_required),
        engine_strategy: d.engine_strategy || "auto",
        timeout_sec: d.timeout_sec || 30,
        max_concurrency: d.max_concurrency || 2,
        retry_attempts: d.retry_attempts || 2,
        notes: d.notes || "",
      });
      await updateDomainStatus(fetchWithInterceptor, d.domain, {
        status: nextStatus,
      });
      addNotification(`Domain '${d.domain}' set to ${nextStatus}.`, "success");
      loadDomains();
    } catch {
      addNotification(`Failed to toggle status for '${d.domain}'.`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Perform Real Deletion via DeleteConfirmModal
  const executeDeleteDomain = async (domain: string) => {
    setActionLoading(domain);
    try {
      await deleteAdminDomain(fetchWithInterceptor, domain);
      addNotification(`Domain rule '${domain}' removed.`, "success");
      loadDomains();
    } catch {
      addNotification(`Failed to delete '${domain}'.`, "error");
    } finally {
      setActionLoading(null);
    }
  };

  // Clear In-Memory Cache
  const handlePurgeCache = async () => {
    setClearingCache(true);
    try {
      const res = await clearScraperCache(fetchWithInterceptor);
      addNotification(
        res.message || "RAM cache cleared successfully.",
        "success"
      );
      loadSystemMetrics();
    } catch {
      addNotification("Failed to purge scraper cache.", "error");
    } finally {
      setClearingCache(false);
    }
  };

  // Run Probe / URL Inspector
  const handleRunProbe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probeUrl.trim()) return;
    setProbing(true);
    setProbeResult(null);
    try {
      const [separated, blockedCheck] = await Promise.all([
        separateComicUrl(fetchWithInterceptor, probeUrl.trim()).catch(
          () => null
        ),
        checkDomainBlocked(fetchWithInterceptor, probeUrl.trim()).catch(
          () => null
        ),
      ]);
      setProbeResult({
        separated: separated || undefined,
        blockedCheck: blockedCheck || undefined,
      });
    } catch {
      addNotification("Inspection failed for the provided URL.", "error");
    } finally {
      setProbing(false);
    }
  };

  // Filtered & Paginated Domains
  const filteredDomains = domains.filter((d) => {
    const matchesSearch =
      d.domain.toLowerCase().includes(search.toLowerCase()) ||
      (d.requested_by || "").toLowerCase().includes(search.toLowerCase()) ||
      (d.notes || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === "all" || d.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredDomains.length / pageSize) || 1;
  const paginatedDomains = filteredDomains.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const approvedCount = domains.filter((d) => d.status === "approved").length;
  const blockedCount = domains.filter((d) => d.status === "blocked").length;
  const pendingCount = domains.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ── Page Header ── */}
      <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[#3B82F6]">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  Scraper Fleet & Ingestion Engine
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Engine Online
                </span>
              </div>
              <p className="text-xs text-neutral-400">
                Manage target domain firewall rules, extraction speed, site
                adapters, and RAM cache.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowProbe((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              showProbe
                ? "bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-500/20"
                : "bg-[#181818] border-[#2F2F2F] text-neutral-300 hover:text-white hover:border-neutral-500"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {showProbe ? "Hide URL Inspector" : "URL Inspector / Probe"}
          </button>

          <button
            onClick={handlePurgeCache}
            disabled={clearingCache}
            className="flex items-center gap-1.5 px-3 py-2 bg-[#181818] hover:bg-neutral-800 border border-[#2F2F2F] hover:border-neutral-500 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
            title="Flush in-memory L1 and L5 scraper cache"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-blue-400 ${
                clearingCache ? "animate-spin" : ""
              }`}
            />
            Purge RAM Cache
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3B82F6] hover:bg-[#2563EB] text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Domain Rule
          </button>
        </div>
      </div>

      {/* ── Key Metrics KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fleet Engine */}
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[#3B82F6]">
            <Server className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white uppercase font-mono">
                {health?.status || "HEALTHY"}
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">
                v{health?.version || "2.0"}
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              {health?.active_in_flight_jobs || 0} active scraping tasks
              in-flight
            </div>
          </div>
        </div>

        {/* Metric 2: Domain Firewall Registry */}
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white font-mono">
                {domains.length} Rules
              </span>
              <span className="text-[10px] text-emerald-400 font-semibold font-mono">
                {approvedCount} Approved
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 flex items-center gap-2">
              <span className="text-red-400 font-semibold">
                {blockedCount} Blocked
              </span>
              <span>•</span>
              <span className="text-amber-400 font-semibold">
                {pendingCount} Pending
              </span>
            </div>
          </div>
        </div>

        {/* Metric 3: RAM Caches */}
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-purple-400">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white font-mono">
                {(health?.in_memory_l1_cache_size || 0) +
                  (health?.in_memory_l5_cache_size || 0)}{" "}
                Keys
              </span>
              <span className="text-[10px] text-purple-400 uppercase font-mono font-bold">
                RAM Cache
              </span>
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              {health?.in_memory_l1_cache_size || 0} L1 HTML •{" "}
              {health?.in_memory_l5_cache_size || 0} L5 Panels
            </div>
          </div>
        </div>

        {/* Metric 4: Specialized Site Adapters */}
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-white font-mono">
                {adapters.length || 6} Adapters
              </span>
              <button
                onClick={() => setActiveSubTab("adapters")}
                className="text-[10px] text-blue-400 hover:underline font-mono cursor-pointer"
              >
                View Specs
              </button>
            </div>
            <div className="text-[11px] text-neutral-400 truncate">
              Asura, Flame, MangaDex & Webtoons
            </div>
          </div>
        </div>
      </div>

      {/* ── Interactive URL Inspector / Probe Drawer ── */}
      {showProbe && (
        <div className="bg-[#141414] border border-blue-500/30 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-[#2F2F2F] pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                Live Comic URL Inspector & Firewall Probe
              </h3>
            </div>
            <button
              onClick={() => setShowProbe(false)}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Close
            </button>
          </div>

          <form onSubmit={handleRunProbe} className="flex gap-2">
            <input
              type="url"
              value={probeUrl}
              onChange={(e) => setProbeUrl(e.target.value)}
              placeholder="Paste any comic chapter or series URL to probe (e.g. https://mangadex.org/title/...)"
              className="flex-1 px-3.5 py-2.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 font-mono"
              required
            />
            <button
              type="submit"
              disabled={probing || !probeUrl.trim()}
              className="px-5 py-2.5 bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2 cursor-pointer"
            >
              {probing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              Inspect Target
            </button>
          </form>

          {probeResult && (
            <div className="p-4 bg-black/40 border border-[#2F2F2F] rounded-xl space-y-3 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-lg">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Domain / Host
                  </span>
                  <span className="text-white font-bold">
                    {probeResult.separated?.domain || "Unknown"}
                  </span>
                </div>

                <div className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-lg">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Firewall Verdict
                  </span>
                  {probeResult.blockedCheck?.is_blocked ? (
                    <span className="text-red-400 font-bold flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5" /> Blocked from
                      Scraping
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Allowed /
                      Operational
                    </span>
                  )}
                </div>

                <div className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-lg">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold block mb-1">
                    Recommended Action
                  </span>
                  <span className="text-amber-400 font-bold uppercase">
                    {probeResult.separated?.recommended_action ||
                      "Standard Scrape"}
                  </span>
                </div>
              </div>

              {probeResult.separated && (
                <div className="p-3 bg-[#181818] border border-[#2F2F2F] rounded-lg space-y-1.5">
                  <div className="text-[10px] text-neutral-400 uppercase font-bold">
                    Entity Deconstruction:
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                      Platform: {probeResult.separated.platform}
                    </span>
                    {probeResult.separated.is_chapter_url && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        Chapter #{probeResult.separated.chapter_number || "1"}
                      </span>
                    )}
                    {probeResult.separated.series_slug && (
                      <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        Series: {probeResult.separated.series_slug}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-2 border-b border-[#2F2F2F] pb-3">
        <button
          onClick={() => setActiveSubTab("domains")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "domains"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-[#181818] text-neutral-400 hover:text-white border border-[#2F2F2F]"
          }`}
        >
          <Database className="w-3.5 h-3.5" />
          Domain Rules Registry ({domains.length})
        </button>

        <button
          onClick={() => setActiveSubTab("adapters")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeSubTab === "adapters"
              ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
              : "bg-[#181818] text-neutral-400 hover:text-white border border-[#2F2F2F]"
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          Site Adapters ({adapters.length || 6})
        </button>
      </div>

      {/* ── SUB-TAB 1: DOMAIN RULES REGISTRY TABLE ── */}
      {activeSubTab === "domains" && (
        <div className="bg-[#141414] border border-[#2F2F2F] rounded-2xl overflow-hidden shadow-sm space-y-0">
          {/* Table Toolbar */}
          <div className="p-4 border-b border-[#2F2F2F] bg-[#181818] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="Filter domain rules…"
                  className="pl-8 pr-3 py-1.5 bg-black/50 border border-[#2F2F2F] rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600 w-52 font-mono"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center p-1 bg-black/40 border border-[#2F2F2F] rounded-xl">
                {(["all", "approved", "blocked", "pending"] as const).map(
                  (st) => (
                    <button
                      key={st}
                      onClick={() => {
                        setFilterStatus(st);
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider font-mono transition-all cursor-pointer ${
                        filterStatus === st
                          ? "bg-[#3B82F6] text-white shadow-sm"
                          : "text-neutral-400 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-neutral-400 font-mono">
                Showing {paginatedDomains.length} of {filteredDomains.length}
              </span>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-2 py-1 bg-black/50 border border-[#2F2F2F] rounded-lg text-xs text-neutral-300 font-mono focus:outline-none cursor-pointer"
              >
                <option value={10}>10 / page</option>
                <option value={15}>15 / page</option>
                <option value={25}>25 / page</option>
                <option value={50}>50 / page</option>
              </select>

              <button
                onClick={() => {
                  loadDomains();
                  loadSystemMetrics();
                }}
                className="p-1.5 bg-[#141414] hover:bg-neutral-800 border border-[#2F2F2F] rounded-lg text-neutral-400 hover:text-white transition-colors cursor-pointer"
                title="Refresh Table"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          </div>

          {/* Clean Data Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#121212] text-neutral-400 border-b border-[#2F2F2F] uppercase tracking-wider font-mono text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Target Domain</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Rate Limit</th>
                  <th className="px-5 py-3.5">Engine Strategy</th>
                  <th className="px-5 py-3.5">Network Route</th>
                  <th className="px-5 py-3.5">Created Date</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242424]">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <RefreshCw className="w-5 h-5 text-neutral-500 animate-spin mx-auto mb-2" />
                      <div className="text-neutral-400 text-xs font-mono">
                        Querying database rules…
                      </div>
                    </td>
                  </tr>
                ) : paginatedDomains.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-12 text-center">
                      <Globe className="w-8 h-8 text-neutral-600 mx-auto mb-2" />
                      <div className="text-neutral-300 text-sm font-bold">
                        No domain rules match criteria
                      </div>
                      <div className="text-neutral-500 text-xs mt-1">
                        Try modifying search or add a new domain rule.
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedDomains.map((d) => (
                    <tr
                      key={d.domain}
                      className="hover:bg-white/[0.02] group transition-colors"
                    >
                      {/* Domain */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 rounded-lg bg-neutral-800 text-neutral-400 border border-[#2F2F2F]">
                            <Globe className="w-3.5 h-3.5 text-blue-400" />
                          </div>
                          <div>
                            <span className="font-bold text-white font-mono text-xs">
                              {d.domain}
                            </span>
                            {d.notes && (
                              <div
                                className="text-[10px] text-neutral-500 truncate max-w-[160px]"
                                title={d.notes}
                              >
                                {d.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        <StatusBadge status={d.status} />
                      </td>

                      {/* Rate Limit */}
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1 font-mono text-neutral-300 bg-black/40 px-2 py-0.5 rounded border border-[#2F2F2F]">
                          <Activity className="w-3 h-3 text-blue-400" />
                          {d.rate_limit_per_min || 30} req/min
                        </span>
                      </td>

                      {/* Strategy */}
                      <td className="px-5 py-3.5">
                        <span className="text-[11px] font-mono text-neutral-400">
                          {d.engine_strategy === "http_fast"
                            ? "⚡ Fast HTTP"
                            : d.engine_strategy === "browser_playwright"
                            ? "🎭 Playwright"
                            : "🤖 Auto AI"}
                        </span>
                      </td>

                      {/* Network Route */}
                      <td className="px-5 py-3.5">
                        {d.proxy_required ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                            <Shield className="w-3 h-3" /> Proxy
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] text-neutral-400 bg-neutral-800 px-2 py-0.5 rounded border border-neutral-700">
                            Direct
                          </span>
                        )}
                      </td>

                      {/* Created Date */}
                      <td className="px-5 py-3.5 text-neutral-400 font-mono text-[11px]">
                        {d.created_at
                          ? new Date(d.created_at).toLocaleDateString(
                              undefined,
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )
                          : "Default Rule"}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Toggle Status Button */}
                          <button
                            onClick={() => handleToggleStatus(d)}
                            disabled={actionLoading === d.domain}
                            title={
                              d.status === "approved"
                                ? "Block domain"
                                : "Approve domain"
                            }
                            className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                              d.status === "approved"
                                ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/20"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
                            }`}
                          >
                            {actionLoading === d.domain ? (
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            ) : d.status === "approved" ? (
                              <XCircle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Configure / Edit Modal */}
                          <button
                            onClick={() => setEditingDomain(d)}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-[#2F2F2F] transition-colors cursor-pointer"
                            title="Edit rule parameters"
                          >
                            <Sliders className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Rule with Cyberpunk DeleteConfirmModal */}
                          <button
                            onClick={() => setDomainToDelete(d.domain)}
                            disabled={actionLoading === d.domain}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 border border-[#2F2F2F] transition-colors cursor-pointer"
                            title="Delete rule"
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

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-[#2F2F2F] bg-[#181818] flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-mono">
                Page {currentPage} of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-black/40 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 rounded-lg text-xs font-mono border border-[#2F2F2F] cursor-pointer"
                >
                  Prev
                </button>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 bg-black/40 hover:bg-neutral-800 disabled:opacity-40 text-neutral-300 rounded-lg text-xs font-mono border border-[#2F2F2F] cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB 2: SITE ADAPTERS REGISTRY ── */}
      {activeSubTab === "adapters" && (
        <div className="space-y-4">
          <div className="p-4 bg-[#141414] border border-[#2F2F2F] rounded-2xl flex items-center justify-between">
            <div className="space-y-0.5">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Cpu className="w-4 h-4 text-blue-400" />
                Compiled Engine Site Adapters
              </h3>
              <p className="text-xs text-neutral-400">
                High-performance custom parsers built specifically for
                webtoon/manga platforms.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {adapters.length || 6} Registered
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {adapters.length === 0 ? (
              <div className="col-span-3 p-8 text-center text-neutral-500 font-mono text-xs">
                Loading engine adapters...
              </div>
            ) : (
              adapters.map((ad) => (
                <div
                  key={ad.adapter_id}
                  className="bg-[#141414] border border-[#2F2F2F] rounded-2xl p-5 space-y-3 shadow-sm hover:border-neutral-500 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">
                      {ad.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {ad.speed} Speed
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2">
                    {ad.description ||
                      "Custom extractor module with automated chapter navigation."}
                  </p>

                  <div className="pt-2 border-t border-[#242424] space-y-2">
                    <div className="text-[10px] text-neutral-500 uppercase font-mono font-bold">
                      Supported Patterns:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {ad.supported_domains?.map((dom) => (
                        <span
                          key={dom}
                          className="px-2 py-0.5 rounded bg-black/50 border border-[#2F2F2F] text-[10px] font-mono text-neutral-300"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Add / Edit Rule Modal ── */}
      {(showAddModal || editingDomain) && (
        <DomainRuleModal
          initialData={editingDomain}
          onClose={() => {
            setShowAddModal(false);
            setEditingDomain(null);
          }}
          fetchWithInterceptor={fetchWithInterceptor}
          addNotification={addNotification}
          onSuccess={() => {
            loadDomains();
            loadSystemMetrics();
          }}
          onRequestDelete={(domain) => {
            setDomainToDelete(domain);
          }}
        />
      )}

      {/* ── Cyberpunk Delete Confirmation Modal (Same as panels/storyboard) ── */}
      {domainToDelete && (
        <DeleteConfirmModal
          title="Delete Scraper Domain Rule"
          message={`Are you sure you want to remove '${domainToDelete}' from custom scraper rules? The engine will revert to platform default behavior for this target website.`}
          confirmText="Delete Rule"
          cancelText="Cancel"
          onCancel={() => setDomainToDelete(null)}
          onConfirm={async () => {
            const d = domainToDelete;
            setDomainToDelete(null);
            await executeDeleteDomain(d);
          }}
        />
      )}
    </div>
  );
}
