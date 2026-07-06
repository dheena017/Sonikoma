import React from "react";
import { Search, X } from "lucide-react";
import { LogEntry } from "../../../types/logs";

interface TerminalLogsFilterProps {
  consoleLogs: LogEntry[];
  activeFilter: "all" | "errors" | "warnings" | "ai" | "success";
  setActiveFilter: (
    val: "all" | "errors" | "warnings" | "ai" | "success"
  ) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  errorCount: number;
  warningCount: number;
  aiCount: number;
  successCount: number;
}

export function TerminalLogsFilter({
  consoleLogs,
  activeFilter,
  setActiveFilter,
  searchQuery,
  setSearchQuery,
  errorCount,
  warningCount,
  aiCount,
  successCount,
}: TerminalLogsFilterProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950/40 p-2 rounded-xl border border-transparent shadow-inner shadow-black/10">
      {/* Filter Dropdown */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-[10px] font-bold text-neutral-400 uppercase font-mono tracking-wider">Filter:</span>
        <select
          value={activeFilter}
          onChange={(e) => setActiveFilter(e.target.value as any)}
          className="bg-neutral-900 border border-neutral-800 text-neutral-200 rounded-lg px-3 py-1.5 text-[10px] focus:border-purple-500 focus:outline-none cursor-pointer font-bold font-mono transition-colors shadow-sm"
        >
          <option value="all">All ({consoleLogs.length})</option>
          <option value="errors">Errors ({errorCount})</option>
          <option value="warnings">Warnings ({warningCount})</option>
          <option value="ai">System ({aiCount})</option>
          <option value="success">Success ({successCount})</option>
        </select>
      </div>

      {/* Real-Time Search Input */}
      <div className="relative flex items-center w-full md:w-56">
        <input
          type="text"
          placeholder="Search logs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-900/60 text-neutral-200 rounded-lg pl-7 pr-7 py-1 text-[10px] focus:border-purple-500 focus:outline-none placeholder-neutral-500 transition-colors"
        />
        <Search className="absolute left-2.5 h-3 w-3 text-neutral-600 pointer-events-none" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-2.5 text-neutral-500 hover:text-white transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
