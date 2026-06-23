import React from "react";
import { Search, X } from "lucide-react";

interface TerminalLogsFilterProps {
  consoleLogs: string[];
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
      {/* Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto custom-scrollbar pb-1">
        {(
          [
            { id: "all", label: "All", count: consoleLogs.length },
            {
              id: "errors",
              label: "Errors",
              count: errorCount,
              color: "text-red-400 bg-red-950/20 border-red-900/30",
            },
            {
              id: "warnings",
              label: "Warnings",
              count: warningCount,
              color: "text-amber-400 bg-amber-950/20 border-amber-900/30",
            },
            {
              id: "ai",
              label: "AI & Gemini",
              count: aiCount,
              color: "text-purple-400 bg-purple-950/20 border-purple-900/30",
            },
            {
              id: "success",
              label: "Success",
              count: successCount,
              color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/30",
            },
          ] as const
        ).map((tab) => {
          const isActive = activeFilter === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveFilter(tab.id)}
              className={`shrink-0 whitespace-nowrap px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                isActive
                  ? "bg-purple-600 border-purple-500 text-white shadow-sm"
                  : "bg-neutral-900 border-neutral-900/50 text-neutral-300 hover:text-neutral-100"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1 rounded font-bold ${
                  isActive
                    ? "bg-purple-700 text-white"
                    : "bg-neutral-950 text-neutral-500"
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
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
