import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Terminal,
  Search,
  Download,
  ArrowLeft,
  Trash2,
  Filter,
  History,
  Activity,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  AlertTriangle,
  CheckCircle2,
  Database,
  Pause,
  Play,
  Maximize2,
  Minimize2,
  Fingerprint,
  User,
  Monitor,
  AlertCircle,
  FileText,
  Copy,
} from "lucide-react";
import { LogEntry, normalizeLog } from "../types/logs";

interface LogsPageProps {
  consoleLogs: LogEntry[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  onNavigateHome: () => void;
}

export default function LogsPage({
  consoleLogs,
  setConsoleLogs,
  onNavigateHome,
}: LogsPageProps) {
  // --- View States ---
  const [viewMode, setViewMode] = useState<"live" | "historical">("live");
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<number | string | null>(null);

  // --- Filtering & Search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR">("ALL");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [highlightPattern, setHighlightPattern] = useState("");

  // --- Historical States ---
  const [historicalLogs, setHistoricalLogs] = useState<LogEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLimit] = useState(50);

  // --- Stats ---
  const stats = useMemo(() => {
    const logs = viewMode === "live" ? consoleLogs : historicalLogs;
    return {
      total: logs.length,
      errors: logs.filter(l => l.level === "ERROR" || l.level === "CRITICAL").length,
      warnings: logs.filter(l => l.level === "WARN" || l.level === "WARNING").length,
      success: logs.filter(l => l.level === "SUCCESS").length,
    };
  }, [consoleLogs, historicalLogs, viewMode]);

  // --- Fetch Historical Logs ---
  const fetchHistory = useCallback(async () => {
    if (viewMode !== "historical") return;
    setIsHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(historyLimit),
        offset: String(historyPage * historyLimit),
      });
      if (levelFilter !== "ALL") params.append("level", levelFilter);
      if (moduleFilter !== "ALL") params.append("module", moduleFilter);
      if (searchQuery) params.append("search", searchQuery);

      const res = await fetch(`/api/system-logs?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setHistoricalLogs(data.logs.map((l: any) => normalizeLog(l)));
      }
    } catch (err) {
      console.error("Failed to fetch historical logs:", err);
    } finally {
      setIsHistoryLoading(false);
    }
  }, [viewMode, historyPage, historyLimit, levelFilter, moduleFilter, searchQuery]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // --- Handlers ---
  const handleDownloadLogs = () => {
    const logs = viewMode === "live" ? consoleLogs : historicalLogs;
    const text = logs.map(l => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`).join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sonikoma_${viewMode}_logs_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearLive = async () => {
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await confirm("Clear the live console buffer?");
    if (confirmed) {
      setConsoleLogs([]);
    }
  };

  const handleWipeDatabase = async () => {
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await confirm("PERMANENTLY delete all logs from the database?");
    if (confirmed) {
      try {
        const res = await fetch("/api/system-logs", { method: "DELETE" });
        if (res.ok) {
          if (viewMode === "historical") fetchHistory();
          alert("Database logs wiped.");
        }
      } catch (err) {
        alert("Wipe failed.");
      }
    }
  };

  const filteredLiveLogs = useMemo(() => {
    if (viewMode !== "live") return [];
    return consoleLogs.filter((log) => {
      const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           log.module.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           (log.correlation_id && log.correlation_id.toLowerCase().includes(searchQuery.toLowerCase()));
      if (!matchesSearch) return false;
      if (levelFilter !== "ALL" && log.level !== levelFilter) {
        if (levelFilter === "WARN" && log.level === "WARNING") return true;
        if (levelFilter === "ERROR" && log.level === "CRITICAL") return true;
        return false;
      }
      if (moduleFilter !== "ALL" && log.module !== moduleFilter) return false;
      return true;
    });
  }, [consoleLogs, searchQuery, levelFilter, moduleFilter, viewMode]);

  const displayedLogs = viewMode === "live" ? filteredLiveLogs : historicalLogs;

  // --- Auto Scroll ---
  const scrollRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (autoScroll && !isPaused && viewMode === "live" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, autoScroll, isPaused, viewMode]);

  // --- Debug to Reporter ---
  const handleReportIssue = (log: LogEntry) => {
    const timestamp = new Date().toISOString();
    const snapshot = log.snapshot;

    const report = `### 🚩 Diagnostic Issue Report
**Error:** [${log.module}] ${log.message}
**Level:** \`${log.level}\`
**Trace ID:** \`${log.correlation_id || "N/A"}\`
**User ID:** \`${log.user_id || "Anonymous"}\`
**Generated At:** ${timestamp}

#### 🖥️ System Context
${snapshot ? `
- **Platform:** ${snapshot.platform?.system || "Unknown"} ${snapshot.platform?.release || ""}
- **Memory:** ${snapshot.process?.memory_rss_mb || "?"} MB (Process) / ${snapshot.system?.memory_percent || "?"}% (System)
- **CPU:** ${snapshot.system?.cpu_percent || "?"}% Load
` : "- No system snapshot available for this entry."}

<details>
<summary>📦 Raw Diagnostic Data</summary>

\`\`\`json
${JSON.stringify({
  log_entry: {
    message: log.message,
    level: log.level,
    module: log.module,
    timestamp: log.timestamp,
    details: log.details
  },
  correlation_id: log.correlation_id,
  user_id: log.user_id,
  snapshot: log.snapshot
}, null, 2)}
\`\`\`

</details>

---
*Generated by Sonikoma Autonomous Diagnostic Suite*`;

    navigator.clipboard.writeText(report).then(() => {
      alert("Markdown diagnostic report copied to clipboard! You can now paste it into your support ticket or GitHub issue.");
    });
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
            <span className="hover:text-purple-400 cursor-pointer" onClick={onNavigateHome}>Dashboard</span>
            <span>&gt;</span>
            <span className="text-purple-400">System Logs</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Terminal className="h-6 w-6 text-purple-400" />
            Infrastructure Diagnostic Console
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Real-time process instrumentation and persistent audit trails
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
           <div className="flex p-1 bg-neutral-950 border border-neutral-800 rounded-xl mr-2">
              <button
                onClick={() => setViewMode("live")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${viewMode === "live" ? "bg-purple-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <Activity className="h-3 w-3" /> Live
              </button>
              <button
                onClick={() => setViewMode("historical")}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${viewMode === "historical" ? "bg-purple-600 text-white shadow-lg" : "text-neutral-500 hover:text-neutral-300"}`}
              >
                <History className="h-3 w-3" /> Historical
              </button>
           </div>

          <button
            onClick={handleDownloadLogs}
            className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>

          {viewMode === "live" ? (
            <button
              onClick={handleClearLive}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-950/20 border border-red-900/20 text-red-300 hover:text-red-200 rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Clear
            </button>
          ) : (
            <button
              onClick={handleWipeDatabase}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 border border-red-800/40 text-red-100 hover:bg-red-800 rounded-xl text-xs font-mono transition-all cursor-pointer"
            >
              <Database className="h-3.5 w-3.5" />
              Wipe DB
            </button>
          )}


          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all shadow-lg font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Home
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-neutral-900/40 border border-neutral-800 p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mb-1">Total Logs</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-white">{stats.total}</span>
            <Activity className="h-4 w-4 text-purple-400" />
          </div>
        </div>
        <div className="bg-red-500/5 border border-red-900/20 p-4 rounded-2xl relative overflow-hidden group">
          {stats.errors > 0 && viewMode === "live" && !isPaused && (
             <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none" />
          )}
          <p className="text-[10px] font-mono text-red-500/60 uppercase tracking-widest mb-1">Critical Errors</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-red-400">{stats.errors}</span>
            <AlertTriangle className="h-4 w-4 text-red-500 group-hover:scale-110 transition-transform" />
          </div>
        </div>
        <div className="bg-amber-500/5 border border-amber-900/20 p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-amber-500/60 uppercase tracking-widest mb-1">System Warnings</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-amber-400">{stats.warnings}</span>
            <Info className="h-4 w-4 text-amber-500" />
          </div>
        </div>
        <div className="bg-emerald-500/5 border border-emerald-900/20 p-4 rounded-2xl">
          <p className="text-[10px] font-mono text-emerald-500/60 uppercase tracking-widest mb-1">Success Events</p>
          <div className="flex items-center justify-between">
            <span className="text-xl font-bold text-emerald-400">{stats.success}</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col space-y-4 bg-neutral-900/20 p-4 rounded-2xl border border-neutral-800/50 shadow-inner">
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
                type="text"
                placeholder="Search log messages, modules, or trace IDs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-black/40 border border-neutral-800 hover:border-neutral-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 outline-none transition-all font-mono shadow-inner"
            />
            </div>

            <div className="relative w-full md:w-64">
            <Fingerprint className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-purple-500/50" />
            <input
                type="text"
                placeholder="Highlight pattern (e.g. Timeout)"
                value={highlightPattern}
                onChange={(e) => setHighlightPattern(e.target.value)}
                className="w-full bg-purple-950/10 border border-purple-900/20 hover:border-purple-500/40 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 outline-none transition-all font-mono shadow-inner"
            />
            </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-2 bg-black/40 border border-neutral-800 rounded-xl shadow-sm">
                <Filter className="h-3 w-3 text-neutral-500" />
                <select
                value={levelFilter}
                onChange={(e) => setLevelFilter(e.target.value as any)}
                className="bg-transparent text-[10px] font-bold text-neutral-300 outline-none cursor-pointer"
                >
                <option value="ALL">All Levels</option>
                <option value="INFO">Info</option>
                <option value="SUCCESS">Success</option>
                <option value="WARN">Warnings</option>
                <option value="ERROR">Errors</option>
                </select>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-2 bg-black/40 border border-neutral-800 rounded-xl shadow-sm">
                <Terminal className="h-3 w-3 text-neutral-500" />
                <select
                value={moduleFilter}
                onChange={(e) => setModuleFilter(e.target.value)}
                className="bg-transparent text-[10px] font-bold text-neutral-300 outline-none cursor-pointer"
                >
                <option value="ALL">All Modules</option>
                {Array.from(new Set([...consoleLogs, ...historicalLogs].map(l => l.module))).map(mod => (
                    <option key={mod} value={mod}>{mod}</option>
                ))}
                </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewMode === "live" && (
                <>
                <button
                    onClick={() => setIsPaused(!isPaused)}
                    className={`p-2 rounded-xl border transition-all ${isPaused ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"}`}
                    title={isPaused ? "Resume Live Feed" : "Pause Live Feed"}
                >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </button>
                <button
                    onClick={() => setAutoScroll(!autoScroll)}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${autoScroll ? "bg-purple-600/20 border-purple-500/40 text-purple-400" : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"}`}
                >
                    Auto-scroll: {autoScroll ? "ON" : "OFF"}
                </button>
                </>
            )}

            {viewMode === "historical" && (
                <button
                onClick={fetchHistory}
                disabled={isHistoryLoading}
                className="p-2 bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white rounded-xl disabled:opacity-50"
                >
                <RefreshCw className={`h-4 w-4 ${isHistoryLoading ? "animate-spin" : ""}`} />
                </button>
            )}
          </div>
        </div>
      </div>

      {/* Terminal Screen */}
      <div className="relative flex-1 bg-[#050507] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
        {/* Title Bar */}
        <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between text-[11px] font-mono text-neutral-500">
          <div className="flex items-center gap-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500/20" />
              <div className="h-3 w-3 rounded-full bg-amber-500/40 border border-amber-500/20" />
              <div className="h-3 w-3 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
            </div>
            <span className="font-bold tracking-wider text-neutral-400 flex items-center gap-2">
              {viewMode === "live" ? <Activity className="h-3 w-3 text-emerald-500 animate-pulse" /> : <Database className="h-3 w-3 text-purple-400" />}
              {viewMode === "live" ? "SYSTEM_REALTIME_STREAM" : "HISTORICAL_AUDIT_LOGS"}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border ${isPaused ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"}`}>
              {viewMode === "live" ? (isPaused ? "Buffer Paused" : "Active Feed") : `Page ${historyPage + 1}`}
            </span>
            <span className="text-[10px] opacity-60">
              Showing {displayedLogs.length} entries
            </span>
          </div>
        </div>

        {/* Console List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-4 space-y-0.5 scrollbar-thin bg-grid-slate-900/[0.04]"
        >
          {isHistoryLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
               <RefreshCw className="h-10 w-10 text-purple-500 animate-spin opacity-50" />
               <p className="text-neutral-500 animate-pulse">Retrieving archived diagnostic data...</p>
            </div>
          ) : displayedLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-3 py-20 opacity-50">
              <Terminal className="h-12 w-12 text-neutral-800" />
              <div className="text-center">
                <p className="font-bold">Empty Console Environment</p>
                <p className="text-[10px]">No telemetry matches the current filter parameters.</p>
              </div>
            </div>
          ) : (
            displayedLogs.map((log, index) => {
              const isExpanded = expandedLogId === (log.id || `l-${index}`);
              const isHighlighted = highlightPattern && (
                 log.message.toLowerCase().includes(highlightPattern.toLowerCase()) ||
                 log.module.toLowerCase().includes(highlightPattern.toLowerCase())
              );

              let logColorClass = "text-neutral-400";
              let borderClass = "border-transparent";
              const level = log.level.toUpperCase();

              if (level === "ERROR" || level === "CRITICAL") logColorClass = "text-red-400";
              else if (level === "WARN" || level === "WARNING") logColorClass = "text-amber-400";
              else if (level === "SUCCESS") logColorClass = "text-emerald-400";
              else if (log.module === "Scraper") logColorClass = "text-purple-400";
              else if (log.module === "AI" || log.module === "Model") logColorClass = "text-violet-400";
              else if (log.module === "API") logColorClass = "text-sky-400";

              return (
                <div
                  key={log.id || `l-${index}`}
                  className={`group relative flex flex-col border-l-2 transition-all ${
                    isExpanded ? "bg-white/5 py-3 px-3 rounded-lg border-l-purple-500" :
                    isHighlighted ? "bg-purple-500/10 border-l-purple-500/50 px-2" :
                    "px-2 border-transparent hover:bg-white/5"
                  }`}
                >
                  <div
                    className="flex items-start gap-3 cursor-pointer"
                    onClick={() => log.details || log.snapshot || log.correlation_id ? setExpandedLogId(isExpanded ? null : (log.id || `l-${index}`)) : null}
                  >
                    <span className="text-neutral-600 select-none shrink-0 w-16 tabular-nums">
                      {log.timestamp}
                    </span>
                    <span className={`shrink-0 w-20 text-[9px] font-bold uppercase tracking-tighter opacity-80 ${logColorClass}`}>
                      [{log.module}]
                    </span>
                    <span className={`flex-1 break-words ${logColorClass} group-hover:text-white transition-colors`}>
                      {log.message}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                        {log.correlation_id && !isExpanded && (
                            <span className="text-[8px] bg-neutral-800 text-neutral-500 px-1.5 py-0.5 rounded-md font-mono hidden md:inline-block">
                                ID: {log.correlation_id}
                            </span>
                        )}
                        {(log.details || log.snapshot || log.correlation_id) && (
                            <button className="text-neutral-600 group-hover:text-purple-400 transition-colors">
                                {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
                            </button>
                        )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 ml-16 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200 pr-4 pb-4">
                       {/* Metadata Row */}
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {log.correlation_id && (
                            <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 flex items-center gap-3">
                                <Fingerprint className="h-4 w-4 text-purple-400" />
                                <div>
                                    <p className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">Correlation ID</p>
                                    <p className="text-[10px] text-neutral-200 font-mono select-all">{log.correlation_id}</p>
                                </div>
                            </div>
                          )}
                          {log.user_id && (
                            <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 flex items-center gap-3">
                                <User className="h-4 w-4 text-sky-400" />
                                <div>
                                    <p className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">Contextual User</p>
                                    <p className="text-[10px] text-neutral-200 font-mono">{log.user_id}</p>
                                </div>
                            </div>
                          )}
                       </div>

                       {/* System Snapshot */}
                       {log.snapshot && (
                         <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800">
                            <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                                <div className="flex items-center gap-2 text-neutral-400">
                                    <Monitor className="h-3.5 w-3.5 text-amber-400" />
                                    <span className="uppercase font-bold tracking-widest text-[9px]">Engine State Snapshot</span>
                                </div>
                                <div className="flex gap-2">
                                    {log.snapshot.system && (
                                        <span className="text-[9px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20">
                                            CPU: {log.snapshot.system.cpu_percent}%
                                        </span>
                                    )}
                                    {log.snapshot.process && (
                                        <span className="text-[9px] bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/20">
                                            MEM: {log.snapshot.process.memory_rss_mb} MB
                                        </span>
                                    )}
                                </div>
                            </div>
                            <pre className="text-[10px] text-neutral-400 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
                                {JSON.stringify(log.snapshot, null, 2)}
                            </pre>
                         </div>
                       )}

                       {/* Details / Payload */}
                       {log.details && (
                        <div className="bg-black/60 rounded-xl p-4 border border-neutral-800 text-[10px] text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto shadow-inner">
                            <div className="flex items-center gap-2 text-neutral-500 mb-2 border-b border-neutral-800 pb-1">
                                <FileText className="h-3 w-3" />
                                <span className="uppercase font-bold tracking-widest text-[9px]">Payload Metadata</span>
                            </div>
                            {typeof log.details === 'string' ? log.details : JSON.stringify(log.details, null, 2)}
                        </div>
                       )}

                       {/* Action Bar */}
                       <div className="flex items-center gap-2 pt-2">
                          <button
                            onClick={() => handleReportIssue(log)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 rounded-lg text-[10px] font-bold transition-all group"
                          >
                             <AlertCircle className="h-3 w-3" />
                             Report Diagnostic Issue
                          </button>
                          <button
                            onClick={() => {
                                navigator.clipboard.writeText(log.message);
                                alert("Message copied");
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-[10px] font-bold transition-all"
                          >
                             <Copy className="h-3 w-3" />
                             Copy Message
                          </button>
                       </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer / Pagination */}
        {viewMode === "historical" && (
           <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
              <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-3">
                <span className="uppercase tracking-widest font-bold">Historical Archive</span>
                <span className="h-1 w-1 rounded-full bg-neutral-700" />
                <span>PAGE {historyPage + 1}</span>
              </div>
              <div className="flex items-center gap-2">
                 <button
                   onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                   disabled={historyPage === 0 || isHistoryLoading}
                   className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30 transition-all active:scale-95"
                 >
                   <ChevronLeft className="h-4 w-4" />
                 </button>
                 <span className="text-[10px] font-bold text-neutral-300 font-mono px-3 py-1 bg-black/40 border border-white/5 rounded-md min-w-[80px] text-center">
                    {historyPage * historyLimit + 1} - {(historyPage * historyLimit) + historicalLogs.length}
                 </span>
                 <button
                   onClick={() => setHistoryPage(p => p + 1)}
                   disabled={historicalLogs.length < historyLimit || isHistoryLoading}
                   className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30 transition-all active:scale-95"
                 >
                   <ChevronRight className="h-4 w-4" />
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* Help Banner */}
      <div className="bg-purple-950/20 border border-purple-500/20 rounded-3xl p-5 flex items-start gap-5 shadow-inner">
         <div className="p-3 bg-purple-500/20 rounded-2xl text-purple-400 shadow-lg">
            <Info className="h-6 w-6" />
         </div>
         <div className="space-y-1.5">
            <h4 className="text-sm font-bold text-purple-200 uppercase tracking-widest">Telemetry Orchestration Info</h4>
            <p className="text-xs text-purple-300/60 leading-relaxed font-mono">
              Live view displays high-frequency ephemeral events stored in server memory. Historical view queries the persistent SQL transaction log for deep forensic analysis.
              Logs are automatically pruned every 7 days or when exceeding 5,000 records. Snapshot metadata is captured automatically for all critical engine failures.
            </p>
         </div>
      </div>
    </div>
  );
}
