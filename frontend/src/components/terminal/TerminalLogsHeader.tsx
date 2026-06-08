import React from "react";
import { Terminal, Trash2, Copy, Check, ChevronDown, Download as DownloadIcon, Pause, Play } from "lucide-react";

interface TerminalLogsHeaderProps {
  consoleLogs: string[];
  autoScroll: boolean;
  setAutoScroll: (val: boolean) => void;
  paused: boolean;
  setPaused: (val: boolean) => void;
  copied: boolean;
  handleCopyAll: () => void;
  handleCopyVisible: () => void;
  handleDownloadLogs: () => void;
  handleClear: () => void;
}

export function TerminalLogsHeader({
  consoleLogs,
  autoScroll,
  setAutoScroll,
  paused,
  setPaused,
  copied,
  handleCopyAll,
  handleCopyVisible,
  handleDownloadLogs,
  handleClear,
}: TerminalLogsHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800/90 pb-4 overflow-x-auto">
      {/* Header Title */}
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-3xl border border-purple-500/20 bg-gradient-to-br from-purple-500/10 via-transparent to-slate-950 shadow-sm shadow-purple-500/10">
          <Terminal className="h-5 w-5 text-purple-300" />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-sm text-white">Terminal Logs</h3>
            {consoleLogs.length > 0 && (
              <span className="inline-flex items-center rounded-full border border-purple-800/60 bg-purple-950/70 px-2.5 py-0.5 text-[10px] font-semibold text-purple-300">
                {consoleLogs.length} entries
              </span>
            )}
          </div>
          <p className="text-[11px] text-neutral-400 font-mono">Live parser and AI status</p>
        </div>
      </div>

      {/* Global Toolbar */}
      <div className="flex flex-nowrap items-center gap-2 justify-end overflow-x-auto">
        <button
          onClick={() => setAutoScroll(!autoScroll)}
          className={`h-9 min-w-[72px] rounded-2xl border px-3 text-[10px] font-mono font-semibold transition duration-200 flex items-center justify-center gap-2 ${
            autoScroll
              ? "text-purple-300 border-purple-500/40 bg-purple-950/50 hover:bg-purple-950/70"
              : "text-neutral-300 border-neutral-800/60 bg-neutral-950/80 hover:bg-neutral-900"
          }`}
          title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
        >
          <ChevronDown className={`h-3 w-3 transition-transform ${autoScroll ? "rotate-0" : "-rotate-90"}`} />
          Auto
        </button>

        <button
          onClick={() => setPaused(!paused)}
          className={`h-9 min-w-[78px] rounded-2xl border px-3 text-[10px] font-mono font-semibold transition duration-200 flex items-center justify-center gap-2 ${
            paused
              ? "text-amber-300 border-amber-500/40 bg-amber-950/45 hover:bg-amber-950/65"
              : "text-neutral-300 border-neutral-800/60 bg-neutral-950/80 hover:bg-neutral-900"
          }`}
          title={paused ? "Paused — buffering incoming logs" : "Resume live logs"}
        >
          {paused ? <Play className="h-3 w-3 text-amber-300" /> : <Pause className="h-3 w-3" />}
          {paused ? "Resume" : "Pause"}
        </button>

        <button
          onClick={handleCopyAll}
          disabled={consoleLogs.length === 0}
          className="h-9 min-w-[78px] rounded-2xl border border-neutral-800/60 px-3 text-[10px] font-mono font-semibold text-neutral-300 bg-neutral-950/80 hover:text-white hover:bg-neutral-900 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
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

        <button
          onClick={handleCopyVisible}
          disabled={consoleLogs.length === 0}
          className="h-9 min-w-[78px] rounded-2xl border border-neutral-800/60 px-3 text-[10px] font-mono font-semibold text-neutral-300 bg-neutral-950/80 hover:text-white hover:bg-neutral-900 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Copy visible logs (respects Pause)"
        >
          <Copy className="h-3 w-3" />
          Visible
        </button>

        <button
          onClick={handleDownloadLogs}
          disabled={consoleLogs.length === 0}
          className="h-9 min-w-[78px] rounded-2xl border border-neutral-800/60 px-3 text-[10px] font-mono font-semibold text-emerald-300 bg-neutral-950/80 hover:text-white hover:bg-emerald-950/40 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          title="Download logs as text file"
        >
          <DownloadIcon className="h-3 w-3" />
          Export
        </button>

        <button
          onClick={handleClear}
          className="h-9 min-w-[72px] rounded-2xl border border-neutral-800/60 px-3 text-[10px] font-mono font-semibold text-red-400 bg-neutral-950/80 hover:text-white hover:bg-red-500/15 flex items-center justify-center gap-2 transition duration-200"
        >
          <Trash2 className="h-3 w-3" />
          Clear
        </button>
      </div>
    </div>
  );
}
