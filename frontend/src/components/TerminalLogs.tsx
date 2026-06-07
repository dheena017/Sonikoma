import React, { useEffect, useRef, useState } from "react";
import { Terminal, Trash2, Copy, Check, ChevronDown, Search, Filter, Download as DownloadIcon, X } from "lucide-react";

interface TerminalLogsProps {
  consoleLogs: string[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getLogColor(log: string): string {
  if (log.includes("[ERROR]") || log.includes("ERROR]")) return "text-red-400 font-semibold";
  if (log.includes("[FATAL]")) return "text-red-500 font-bold";
  if (log.includes("[SUCCESS]") || log.includes("completed cleanly") || log.includes("Successfully")) return "text-emerald-400 font-medium";
  if (log.includes("[WARNING]") || log.includes("[WARN]")) return "text-amber-400 font-semibold";
  if (log.includes("[AI Auto-Analysis]") || log.includes("[AI Model]") || log.includes("[Gemini]")) return "text-purple-300 font-medium";
  if (log.includes("[AI Smart Crop]")) return "text-violet-400 font-medium";
  if (log.includes("[OCR/CV Engine]") || log.includes("[Vision OCR]") || log.includes("[CV")) return "text-purple-300";
  if (log.includes("[Scraper]")) return "text-cyan-400";
  if (log.includes("[Control]") || log.includes("[Pipeline]")) return "text-blue-400";
  if (log.includes("[MoviePy]") || log.includes("[Video]") || log.includes("[FFmpeg]")) return "text-amber-300";
  if (log.includes("[Image Editor]")) return "text-orange-400";
  if (log.includes("[Stitcher]") || log.includes("Combined") || log.includes("[Stitch]")) return "text-indigo-300";
  if (log.includes("[Auto Cropper]") || log.includes("[Crop]")) return "text-green-400";
  if (log.includes("[Speech Bubbles]")) return "text-pink-400";
  if (log.includes("[API]") || log.includes("[Network]") || log.includes("[HTTP]")) return "text-sky-400";
  if (log.includes("[GUI]")) return "text-neutral-300";
  if (log.includes("[Preloader]")) return "text-neutral-500";
  if (log.includes("[Model]")) return "text-violet-300";
  if (log.includes("[Database]") || log.includes("[DB]")) return "text-teal-400";
  return "text-neutral-400";
}

function getLogBorderColor(log: string): string {
  if (log.includes("[ERROR]") || log.includes("ERROR]") || log.includes("[FATAL]")) return "border-red-500/60";
  if (log.includes("[SUCCESS]") || log.includes("Successfully")) return "border-emerald-500/60";
  if (log.includes("[WARNING]") || log.includes("[WARN]")) return "border-amber-500/60";
  if (log.includes("[AI") || log.includes("[Gemini]")) return "border-purple-500/50";
  if (log.includes("[Scraper]")) return "border-cyan-500/40";
  if (log.includes("[Control]") || log.includes("[Pipeline]")) return "border-blue-500/40";
  return "border-neutral-800";
}

export default function TerminalLogs({ consoleLogs, setConsoleLogs }: TerminalLogsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "errors" | "warnings" | "ai" | "success">("all");

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, autoScroll, searchQuery, activeFilter]);

  const handleCopyAll = () => {
    const allLogs = consoleLogs.join("\n");
    navigator.clipboard.writeText(allLogs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([consoleLogs.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compilation_logs_${getTimestamp().replace(/:/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter and search logic
  const filteredLogs = consoleLogs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = query === "" || log.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (activeFilter === "errors") {
      return log.includes("[ERROR]") || log.includes("ERROR]") || log.includes("[FATAL]");
    }
    if (activeFilter === "warnings") {
      return log.includes("[WARNING]") || log.includes("[WARN]");
    }
    if (activeFilter === "ai") {
      return log.includes("[AI") || log.includes("[Gemini]") || log.includes("Gemini");
    }
    if (activeFilter === "success") {
      return log.includes("[SUCCESS]") || log.includes("Successfully") || log.includes("completed cleanly");
    }

    return true;
  });

  // Calculate statistics counts
  const errorCount = consoleLogs.filter(log => log.includes("[ERROR]") || log.includes("ERROR]") || log.includes("[FATAL]")).length;
  const warningCount = consoleLogs.filter(log => log.includes("[WARNING]") || log.includes("[WARN]")).length;
  const successCount = consoleLogs.filter(log => log.includes("[SUCCESS]") || log.includes("Successfully")).length;
  const aiCount = consoleLogs.filter(log => log.includes("[AI") || log.includes("[Gemini]")).length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5">
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
            onClick={() => setConsoleLogs([`[GUI] ${getTimestamp()} — Active shell cleared at user prompt.`])}
            className="h-9 min-w-[70px] text-[10px] font-mono rounded-xl border border-neutral-800/80 px-3 text-red-400 hover:text-white bg-neutral-950 hover:bg-red-500/10 flex items-center justify-center gap-2 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear
          </button>
        </div>
      </div>

      {/* Real-time search and filtering tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-neutral-950/40 p-2 rounded-xl border border-transparent shadow-inner shadow-black/10">
        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {([
            { id: "all", label: "All", count: consoleLogs.length },
            { id: "errors", label: "Errors", count: errorCount, color: "text-red-400 bg-red-950/20 border-red-900/30" },
            { id: "warnings", label: "Warnings", count: warningCount, color: "text-amber-400 bg-amber-950/20 border-amber-900/30" },
            { id: "ai", label: "AI & Gemini", count: aiCount, color: "text-purple-400 bg-purple-950/20 border-purple-900/30" },
            { id: "success", label: "Success", count: successCount, color: "text-emerald-400 bg-emerald-950/20 border-emerald-900/30" },
          ] as const).map((tab) => {
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`px-2.5 py-1 rounded-lg font-mono text-[9px] font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? "bg-purple-600 border-purple-500 text-white shadow-sm"
                    : "bg-neutral-900 border-neutral-900/50 text-neutral-300 hover:text-neutral-100"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1 rounded font-bold ${isActive ? "bg-purple-700 text-white" : "bg-neutral-950 text-neutral-500"}`}>
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

      {/* Terminal Output display window */}
      <div
        ref={scrollRef}
        className="bg-neutral-950 rounded-xl p-4 border border-transparent h-56 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin shadow-inner"
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
            <Terminal className="h-6 w-6 opacity-30 animate-pulse" />
            <p className="text-[11px] font-mono">
              {searchQuery || activeFilter !== "all" ? "No search results match query filters" : "Waiting for pipeline activity..."}
            </p>
            <p className="text-[9px] text-neutral-700">
              {searchQuery || activeFilter !== "all" ? "Try clearing the search query or tabs filter" : "Logs will print here on active script actions"}
            </p>
          </div>
        ) : (
          filteredLogs.map((log, index) => {
            const logColor = getLogColor(log);
            const borderColor = getLogBorderColor(log);

            return (
              <div
                key={index}
                className={`leading-relaxed border-l-2 pl-2 hover:bg-neutral-900/30 rounded-r transition-colors ${logColor} ${borderColor}`}
              >
                <span className="text-neutral-600 mr-2 select-none">
                  {String(filteredLogs.length - index).padStart(3, '0')}
                </span>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
