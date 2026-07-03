import React from "react";
import { Search, Filter, Terminal, Fingerprint, Pause, Play, RefreshCw } from "lucide-react";
import { LogEntry } from "../../../types/logs";

interface LogsPageToolbarProps {
  viewMode: "live" | "historical";
  searchQuery: string;
  setSearchQuery: (value: string) => void;
  highlightPattern: string;
  setHighlightPattern: (value: string) => void;
  levelFilter: "ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR";
  setLevelFilter: (value: "ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR") => void;
  moduleFilter: string;
  setModuleFilter: (value: string) => void;
  consoleLogs: LogEntry[];
  historicalLogs: LogEntry[];
  isPaused: boolean;
  setIsPaused: (value: boolean) => void;
  autoScroll: boolean;
  setAutoScroll: (value: boolean) => void;
  fetchHistory: () => void;
  isHistoryLoading: boolean;
}

export function LogsPageToolbar({
  viewMode,
  searchQuery,
  setSearchQuery,
  highlightPattern,
  setHighlightPattern,
  levelFilter,
  setLevelFilter,
  moduleFilter,
  setModuleFilter,
  consoleLogs,
  historicalLogs,
  isPaused,
  setIsPaused,
  autoScroll,
  setAutoScroll,
  fetchHistory,
  isHistoryLoading,
}: LogsPageToolbarProps) {
  return (
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
              {Array.from(
                new Set(
                  [...consoleLogs, ...historicalLogs].map((l) => l.module)
                )
              ).map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {viewMode === "live" && (
            <>
              <button
                onClick={() => setIsPaused(!isPaused)}
                className={`p-2 rounded-xl border transition-all ${
                  isPaused
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 shadow-[0_0_10px_rgba(245,158,11,0.2)]"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"
                }`}
                title={isPaused ? "Resume Live Feed" : "Pause Live Feed"}
              >
                {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
              </button>
              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                  autoScroll
                    ? "bg-purple-600/20 border-purple-500/40 text-purple-400"
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-white"
                }`}
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
  );
}
