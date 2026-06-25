import React, { useState, useMemo } from "react";
import {
  Terminal,
  Search,
  Download,
  ArrowLeft,
  Trash2,
  Filter,
} from "lucide-react";

interface LogsPageProps {
  consoleLogs: string[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  onNavigateHome: () => void;
}

export default function LogsPage({
  consoleLogs,
  setConsoleLogs,
  onNavigateHome,
}: LogsPageProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<
    "ALL" | "INFO" | "WARNING" | "ERROR"
  >("ALL");

  const filteredLogs = useMemo(() => {
    return consoleLogs.filter((log) => {
      // 1. Text Search matching
      const matchesSearch = log
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      // 2. Level filter matching
      if (levelFilter === "ALL") return true;
      if (
        levelFilter === "ERROR" &&
        (log.toLowerCase().includes("[error]") ||
          log.toLowerCase().includes("fail"))
      )
        return true;
      if (levelFilter === "WARNING" && log.toLowerCase().includes("[warning]"))
        return true;
      if (levelFilter === "INFO") {
        return (
          !log.toLowerCase().includes("[error]") &&
          !log.toLowerCase().includes("fail") &&
          !log.toLowerCase().includes("[warning]")
        );
      }
      return false;
    });
  }, [consoleLogs, searchQuery, levelFilter]);

  const handleDownloadLogs = () => {
    const text = consoleLogs.join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `webtoon_pipeline_system_logs_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClearLogs = async () => {
    const confirm = (window as any).confirmAsync || window.confirm;
    const confirmed = await (window as any).confirmAsync(
      "Are you sure you want to clear the logs console cache?"
    );
    if (confirmed) {
      setConsoleLogs([]);
    }
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
      {/* Breadcrumb & Title Section */}
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
            Live System Orchestrator Console
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Real-time pipeline diagnostics, image processing threads, and API
            executions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadLogs}
            disabled={consoleLogs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-800 hover:border-neutral-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            Export Raw Logs
          </button>
          <button
            onClick={handleClearLogs}
            disabled={consoleLogs.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-red-950/20 border border-red-900/20 text-red-300 hover:text-red-200 rounded-xl text-xs font-mono transition-all hover:bg-red-900/10 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <Trash2 className="h-3.5 w-3.5 text-red-400" />
            Clear Console
          </button>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </button>
        </div>
      </div>

      {/* Toolbar: Search and Filter Pills */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Search Bar */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search logs by keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 hover:border-neutral-700 focus:border-purple-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-neutral-200 outline-none transition-all font-mono"
          />
        </div>

        {/* Filter Pills */}
        <div className="md:col-span-6 flex flex-wrap items-center gap-1.5 justify-start md:justify-end">
          <span className="text-xs font-semibold text-neutral-500 font-mono mr-2 flex items-center gap-1">
            <Filter className="h-3 w-3" /> Filter:
          </span>
          {(["ALL", "INFO", "WARNING", "ERROR"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setLevelFilter(filter)}
              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold font-mono transition-all cursor-pointer ${
                levelFilter === filter
                  ? filter === "ERROR"
                    ? "bg-red-500/25 border-red-500/40 text-red-350"
                    : filter === "WARNING"
                    ? "bg-amber-500/25 border-amber-500/40 text-amber-350"
                    : "bg-purple-600 text-white shadow-md shadow-purple-950/50"
                  : "bg-neutral-950 border border-neutral-850 hover:bg-neutral-900 text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Log Terminal Screen */}
      <div className="relative flex-1 bg-black/60 border border-neutral-850 rounded-2xl overflow-hidden shadow-inner flex flex-col h-[520px]">
        {/* Top title bar */}
        <div className="px-4 py-2 border-b border-neutral-850 bg-neutral-950/80 flex items-center justify-between text-[10px] font-mono text-neutral-500 select-none">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            <span className="ml-1.5 font-bold tracking-wider">
              system_stream.log
            </span>
          </div>
          <div>
            Showing {filteredLogs.length} of {consoleLogs.length} entries
          </div>
        </div>

        {/* Console display */}
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] leading-5 text-[#dcdcdc] space-y-1.5 selection:bg-purple-600 selection:text-white">
          {filteredLogs.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-500 space-y-2 py-20 select-none">
              <Terminal className="h-8 w-8 text-neutral-700 animate-pulse" />
              <p>No log records matching filters found.</p>
            </div>
          ) : (
            filteredLogs.map((log, index) => {
              // Highlight log levels dynamically
              let logColorClass = "text-[#dcdcdc]";
              if (
                log.toLowerCase().includes("[error]") ||
                log.toLowerCase().includes("fail")
              ) {
                logColorClass = "text-red-400 font-semibold";
              } else if (log.toLowerCase().includes("[warning]")) {
                logColorClass = "text-amber-400 font-semibold";
              } else if (log.toLowerCase().includes("[preloader]")) {
                logColorClass = "text-cyan-400";
              } else if (log.toLowerCase().includes("[scraper]")) {
                logColorClass = "text-purple-400";
              } else if (
                log.toLowerCase().includes("[api]") ||
                log.toLowerCase().includes("success")
              ) {
                logColorClass = "text-emerald-400";
              }

              return (
                <div
                  key={index}
                  className={`hover:bg-neutral-900/40 px-2 py-0.5 rounded transition-colors whitespace-pre-wrap ${logColorClass}`}
                >
                  <span className="text-neutral-600 mr-2 select-none">
                    {(index + 1).toString().padStart(4, "0")}
                  </span>
                  {log}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
