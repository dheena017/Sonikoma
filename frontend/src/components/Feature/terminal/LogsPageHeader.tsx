import React from "react";
import {
  Terminal,
  Activity,
  History,
  Download,
  Trash2,
  Database,
  ArrowLeft,
} from "lucide-react";

interface LogsPageHeaderProps {
  viewMode: "live" | "historical";
  onViewModeChange: (mode: "live" | "historical") => void;
  onDownloadLogs: () => void;
  onClearLive: () => void;
  onWipeDatabase: () => void;
  onNavigateHome: () => void;
}

export function LogsPageHeader({
  viewMode,
  onViewModeChange,
  onDownloadLogs,
  onClearLive,
  onWipeDatabase,
  onNavigateHome,
}: LogsPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
          <span
            className="hover:text-purple-400 cursor-pointer"
            onClick={onNavigateHome}
          >
            Dashboard
          </span>
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
            onClick={() => onViewModeChange("live")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "live"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <Activity className="h-3 w-3" /> Live
          </button>
          <button
            onClick={() => onViewModeChange("historical")}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              viewMode === "historical"
                ? "bg-purple-600 text-white shadow-lg"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            <History className="h-3 w-3" /> Historical
          </button>
        </div>

        <button
          onClick={onDownloadLogs}
          className="flex items-center gap-1.5 px-3 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Export
        </button>

        {viewMode === "live" ? (
          <button
            onClick={onClearLive}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-950/20 border border-red-900/20 text-red-300 hover:text-red-200 rounded-xl text-xs font-mono transition-all cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear
          </button>
        ) : (
          <button
            onClick={onWipeDatabase}
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
  );
}
