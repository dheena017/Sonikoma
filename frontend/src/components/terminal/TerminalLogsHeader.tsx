import React from "react";
import { Terminal, Trash2, Copy, Check, ChevronDown, Download as DownloadIcon } from "lucide-react";

interface TerminalLogsHeaderProps {
  consoleLogs: string[];
  autoScroll: boolean;
  setAutoScroll: (val: boolean) => void;
  copied: boolean;
  handleCopyAll: () => void;
  handleDownloadLogs: () => void;
  handleClear: () => void;
}

export function TerminalLogsHeader({
  consoleLogs,
  autoScroll,
  setAutoScroll,
  copied,
  handleCopyAll,
  handleDownloadLogs,
  handleClear,
}: TerminalLogsHeaderProps) {
  return (
    <div className="flex flex-row flex-nowrap items-center justify-between gap-4 border-b border-neutral-800 pb-3 overflow-x-auto">
      {/* Header Title */}
      <div className="flex min-w-0 items-center gap-2.5">
        <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/15">
          <Terminal className="h-4.5 w-4.5 text-purple-400" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-white">Terminal Logs</h3>
            {consoleLogs.length > 0 && (
              <span className="text-[9px] px-1.5 py-0.5 font-mono font-bold bg-purple-950/60 text-purple-400 rounded border border-purple-800/40">
                {consoleLogs.length} entries
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 font-mono">Live parser and AI status</p>
        </div>
      </div>

      {/* Global Toolbar */}
      <div className="flex flex-nowrap items-center gap-2 justify-end overflow-x-auto">
        {/* Auto-scroll toggle */}
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`h-9 min-w-[70px] text-[10px] font-mono rounded-xl border px-3 transition-colors flex items-center justify-center gap-2 ${
            autoScroll
              ? "text-purple-400 border-purple-800/50 bg-purple-950/30 hover:bg-purple-950/50"
              : "text-neutral-400 border-neutral-800/80 bg-neutral-950 hover:bg-neutral-900"
          }`}
          title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${autoScroll ? "" : "rotate-180"}`} />
          Auto
        </button>

        {/* Copy All */}
        <button
          onClick={handleCopyAll}
          disabled={consoleLogs.length === 0}
          className="h-9 min-w-[78px] text-[10px] font-mono rounded-xl border border-neutral-800/80 px-3 text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>

        {/* Export to File */}
        <button
          onClick={handleDownloadLogs}
          disabled={consoleLogs.length === 0}
          className="h-9 min-w-[78px] text-[10px] font-mono rounded-xl border border-neutral-800/80 px-3 text-neutral-300 hover:text-white bg-neutral-950 hover:bg-neutral-900 flex items-center justify-center gap-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          title="Download logs as text file"
        >
          <DownloadIcon className="h-3 w-3 text-emerald-500/70" />
          Export
        </button>

        {/* Clear */}
        <button
          onClick={handleClear}
          className="h-9 min-w-[70px] text-[10px] font-mono rounded-xl border border-neutral-800/80 px-3 text-red-400 hover:text-white bg-neutral-950 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
    </div>
  );
}
