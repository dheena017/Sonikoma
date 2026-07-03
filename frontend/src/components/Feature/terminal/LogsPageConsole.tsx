import React from "react";
import {
  Terminal,
  RefreshCw,
  Activity,
  Maximize2,
  Minimize2,
  Fingerprint,
  User,
  Monitor,
  AlertCircle,
  FileText,
  Copy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { LogEntry } from "../../../types/logs";

interface LogsPageConsoleProps {
  displayedLogs: LogEntry[];
  isHistoryLoading: boolean;
  viewMode: "live" | "historical";
  historyPage: number;
  historyLimit: number;
  historicalLogs: LogEntry[];
  scrollRef: React.RefObject<HTMLDivElement>;
  expandedLogId: number | string | null;
  setExpandedLogId: (id: number | string | null) => void;
  highlightPattern: string;
  handleReportIssue: (log: LogEntry) => void;
  setHistoryPage: React.Dispatch<React.SetStateAction<number>>;
}

export function LogsPageConsole({
  displayedLogs,
  isHistoryLoading,
  viewMode,
  historyPage,
  historyLimit,
  historicalLogs,
  scrollRef,
  expandedLogId,
  setExpandedLogId,
  highlightPattern,
  handleReportIssue,
  setHistoryPage,
}: LogsPageConsoleProps) {
  return (
    <div className="relative flex-1 bg-[#050507] border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[600px]">
      <div className="px-5 py-3 border-b border-neutral-800 bg-neutral-900/50 flex items-center justify-between text-[11px] font-mono text-neutral-500">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500/40 border border-red-500/20" />
            <div className="h-3 w-3 rounded-full bg-amber-500/40 border border-amber-500/20" />
            <div className="h-3 w-3 rounded-full bg-emerald-500/40 border border-emerald-500/20" />
          </div>
          <span className="font-bold tracking-wider text-neutral-400 flex items-center gap-2">
            {viewMode === "live" ? (
              <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            ) : (
              <Monitor className="h-3 w-3 text-purple-400" />
            )}
            {viewMode === "live" ? "SYSTEM_REALTIME_STREAM" : "HISTORICAL_AUDIT_LOGS"}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-tighter border ${
            viewMode === "live"
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500"
              : "bg-purple-500/10 border-purple-500/20 text-purple-500"
          }`}>
            {viewMode === "live" ? "Active Feed" : `Page ${historyPage + 1}`}
          </span>
          <span className="text-[10px] opacity-60">
            Showing {displayedLogs.length} entries
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex-1 overflow-auto font-mono text-[11px] leading-relaxed p-4 space-y-0.5 scrollbar-thin bg-grid-slate-900/[0.04]"
      >
        {isHistoryLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-10 w-10 text-purple-500 animate-spin opacity-50" />
            <p className="text-neutral-500 animate-pulse">
              Retrieving archived diagnostic data...
            </p>
          </div>
        ) : displayedLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-3 py-20 opacity-50">
            <Terminal className="h-12 w-12 text-neutral-800" />
            <div className="text-center">
              <p className="font-bold">Empty Console Environment</p>
              <p className="text-[10px]">
                No telemetry matches the current filter parameters.
              </p>
            </div>
          </div>
        ) : (
          displayedLogs.map((log, index) => {
            const isExpanded = expandedLogId === (log.id || `l-${index}`);
            const isHighlighted =
              highlightPattern &&
              (log.message.toLowerCase().includes(highlightPattern.toLowerCase()) ||
                log.module.toLowerCase().includes(highlightPattern.toLowerCase()));

            let logColorClass = "text-neutral-400";
            if (log.level.toUpperCase() === "ERROR" || log.level.toUpperCase() === "CRITICAL")
              logColorClass = "text-red-400";
            else if (log.level.toUpperCase() === "WARN" || log.level.toUpperCase() === "WARNING")
              logColorClass = "text-amber-400";
            else if (log.level.toUpperCase() === "SUCCESS")
              logColorClass = "text-emerald-400";
            else if (log.module === "Scraper")
              logColorClass = "text-purple-400";
            else if (log.module === "AI" || log.module === "Model")
              logColorClass = "text-violet-400";
            else if (log.module === "API")
              logColorClass = "text-sky-400";

            return (
              <div
                key={log.id || `l-${index}`}
                className={`group relative flex flex-col border-l-2 transition-all ${
                  isExpanded
                    ? "bg-white/5 py-3 px-3 rounded-lg border-l-purple-500"
                    : isHighlighted
                    ? "bg-purple-500/10 border-l-purple-500/50 px-2"
                    : "px-2 border-transparent hover:bg-white/5"
                }`}
              >
                <div
                  className="flex items-start gap-3 cursor-pointer"
                  onClick={() =>
                    log.details || log.snapshot || log.correlation_id
                      ? setExpandedLogId(
                          isExpanded ? null : log.id || `l-${index}`
                        )
                      : null
                  }
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
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {log.correlation_id && (
                        <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 flex items-center gap-3">
                          <Fingerprint className="h-4 w-4 text-purple-400" />
                          <div>
                            <p className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">
                              Correlation ID
                            </p>
                            <p className="text-[10px] text-neutral-200 font-mono select-all">
                              {log.correlation_id}
                            </p>
                          </div>
                        </div>
                      )}
                      {log.user_id && (
                        <div className="bg-neutral-900/80 rounded-xl p-3 border border-neutral-800 flex items-center gap-3">
                          <User className="h-4 w-4 text-sky-400" />
                          <div>
                            <p className="text-[8px] text-neutral-500 uppercase font-bold tracking-widest">
                              Contextual User
                            </p>
                            <p className="text-[10px] text-neutral-200 font-mono">
                              {log.user_id}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {log.snapshot && (
                      <div className="bg-neutral-900/80 rounded-xl p-4 border border-neutral-800">
                        <div className="flex items-center justify-between mb-3 border-b border-neutral-800 pb-2">
                          <div className="flex items-center gap-2 text-neutral-400">
                            <Monitor className="h-3.5 w-3.5 text-amber-400" />
                            <span className="uppercase font-bold tracking-widest text-[9px]">
                              Engine State Snapshot
                            </span>
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

                    {log.details && (
                      <div className="bg-black/60 rounded-xl p-4 border border-neutral-800 text-[10px] text-neutral-300 font-mono whitespace-pre-wrap overflow-x-auto shadow-inner">
                        <div className="flex items-center gap-2 text-neutral-500 mb-2 border-b border-neutral-800 pb-1">
                          <FileText className="h-3 w-3" />
                          <span className="uppercase font-bold tracking-widest text-[9px]">
                            Payload Metadata
                          </span>
                        </div>
                        {typeof log.details === "string"
                          ? log.details
                          : JSON.stringify(log.details, null, 2)}
                      </div>
                    )}

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

      {viewMode === "historical" && (
        <div className="px-5 py-3 border-t border-neutral-800 bg-neutral-900/50 flex items-center justify-between">
          <div className="text-[10px] text-neutral-500 font-mono flex items-center gap-3">
            <span className="uppercase tracking-widest font-bold">Historical Archive</span>
            <span className="h-1 w-1 rounded-full bg-neutral-700" />
            <span>PAGE {historyPage + 1}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setHistoryPage((p) => Math.max(0, p - 1))}
              disabled={historyPage === 0 || isHistoryLoading}
              className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-[10px] font-bold text-neutral-300 font-mono px-3 py-1 bg-black/40 border border-white/5 rounded-md min-w-[80px] text-center">
              {historyPage * historyLimit + 1} - {historyPage * historyLimit + historicalLogs.length}
            </span>
            <button
              onClick={() => setHistoryPage((p) => p + 1)}
              disabled={historicalLogs.length < historyLimit || isHistoryLoading}
              className="p-1.5 rounded-lg bg-neutral-800 border border-neutral-700 text-neutral-400 hover:text-white disabled:opacity-30 transition-all active:scale-95"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
