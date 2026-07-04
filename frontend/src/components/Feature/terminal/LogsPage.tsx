import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { LogEntry, normalizeLog } from "../../../types/logs";
import { LogsPageConsole } from "./LogsPageConsole";
import { LogsPageHelpBanner } from "./LogsPageHelpBanner";
import { LogsPageHeader } from "./LogsPageHeader";
import { LogsPageStats } from "./LogsPageStats";
import { LogsPageToolbar } from "./LogsPageToolbar";

interface LogsPageProps {
  consoleLogs: LogEntry[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
  onNavigateHome: () => void;
}

const LogsPageInner = ({
  consoleLogs,
  setConsoleLogs,
  onNavigateHome,
}: LogsPageProps) => {
  const [viewMode, setViewMode] = useState<"live" | "historical">("live");
  const [isPaused, setIsPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<number | string | null>(
    null
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<
    "ALL" | "INFO" | "SUCCESS" | "WARN" | "ERROR"
  >("ALL");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [highlightPattern, setHighlightPattern] = useState("");

  const [historicalLogs, setHistoricalLogs] = useState<LogEntry[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyLimit] = useState(50);

  const scrollRef = useRef<HTMLDivElement>(null);

  const stats = useMemo(() => {
    const logs = viewMode === "live" ? consoleLogs : historicalLogs;
    return {
      total: logs.length,
      errors: logs.filter((l) => l.level === "ERROR" || l.level === "CRITICAL")
        .length,
      warnings: logs.filter((l) => l.level === "WARN" || l.level === "WARNING")
        .length,
      success: logs.filter((l) => l.level === "SUCCESS").length,
    };
  }, [consoleLogs, historicalLogs, viewMode]);

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
  }, [
    viewMode,
    historyPage,
    historyLimit,
    levelFilter,
    moduleFilter,
    searchQuery,
  ]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleDownloadLogs = () => {
    const logs = viewMode === "live" ? consoleLogs : historicalLogs;
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`)
      .join("\n");

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
    const confirmFn = (window as any).confirmAsync || window.confirm;
    const confirmed = await confirmFn("Clear the live console buffer?");
    if (confirmed) {
      setConsoleLogs([]);
    }
  };

  const handleWipeDatabase = async () => {
    const confirmFn = (window as any).confirmAsync || window.confirm;
    const confirmed = await confirmFn(
      "PERMANENTLY delete all logs from the database?"
    );
    if (!confirmed) return;

    try {
      const res = await fetch("/api/system-logs", { method: "DELETE" });
      if (res.ok) {
        if (viewMode === "historical") fetchHistory();
        alert("Database logs wiped.");
      }
    } catch (err) {
      alert("Wipe failed.");
    }
  };

  const filteredLiveLogs = useMemo(() => {
    if (viewMode !== "live") return [];

    const query = searchQuery.toLowerCase();
    return consoleLogs.filter((log) => {
      const matchesSearch =
        log.message.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query) ||
        (log.correlation_id &&
          log.correlation_id.toLowerCase().includes(query));

      if (!matchesSearch) return false;
      if (levelFilter !== "ALL") {
        if (levelFilter === "WARN" && log.level === "WARNING") return true;
        if (levelFilter === "ERROR" && log.level === "CRITICAL") return true;
        if (log.level !== levelFilter) return false;
      }
      if (moduleFilter !== "ALL" && log.module !== moduleFilter) return false;
      return true;
    });
  }, [consoleLogs, searchQuery, levelFilter, moduleFilter, viewMode]);

  const displayedLogs = viewMode === "live" ? filteredLiveLogs : historicalLogs;

  useEffect(() => {
    if (autoScroll && !isPaused && viewMode === "live" && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, autoScroll, isPaused, viewMode]);

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
${
  snapshot
    ? `- **Platform:** ${snapshot.platform?.system || "Unknown"} ${
        snapshot.platform?.release || ""
      }
- **Memory:** ${snapshot.process?.memory_rss_mb || "?"} MB (Process) / ${
        snapshot.system?.memory_percent || "?"
      }% (System)
- **CPU:** ${snapshot.system?.cpu_percent || "?"}% Load
`
    : "- No system snapshot available for this entry."
}

<details>
<summary>📦 Raw Diagnostic Data</summary>

\`\`\`json
${JSON.stringify(
  {
    log_entry: {
      message: log.message,
      level: log.level,
      module: log.module,
      timestamp: log.timestamp,
      details: log.details,
    },
    correlation_id: log.correlation_id,
    user_id: log.user_id,
    snapshot: log.snapshot,
  },
  null,
  2
)}
\`\`\`

</details>

---
*Generated by Sonikoma Autonomous Diagnostic Suite*`;

    navigator.clipboard.writeText(report).then(() => {
      alert(
        "Markdown diagnostic report copied to clipboard! You can now paste it into your support ticket or GitHub issue."
      );
    });
  };

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10 flex flex-col space-y-6 animate-[fadeIn_0.22s_ease-out]">
      <LogsPageHeader
        viewMode={viewMode}
        onViewModeChange={(mode) => {
          setViewMode(mode);
          if (mode === "historical") {
            setHistoryPage(0);
          }
        }}
        onDownloadLogs={handleDownloadLogs}
        onClearLive={handleClearLive}
        onWipeDatabase={handleWipeDatabase}
        onNavigateHome={onNavigateHome}
      />

      <LogsPageStats
        total={stats.total}
        errors={stats.errors}
        warnings={stats.warnings}
        success={stats.success}
        viewMode={viewMode}
        isPaused={isPaused}
      />

      <LogsPageToolbar
        viewMode={viewMode}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        highlightPattern={highlightPattern}
        setHighlightPattern={setHighlightPattern}
        levelFilter={levelFilter}
        setLevelFilter={setLevelFilter}
        moduleFilter={moduleFilter}
        setModuleFilter={setModuleFilter}
        consoleLogs={consoleLogs}
        historicalLogs={historicalLogs}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        fetchHistory={fetchHistory}
        isHistoryLoading={isHistoryLoading}
      />

      <LogsPageConsole
        displayedLogs={displayedLogs}
        isHistoryLoading={isHistoryLoading}
        viewMode={viewMode}
        historyPage={historyPage}
        historyLimit={historyLimit}
        historicalLogs={historicalLogs}
        scrollRef={scrollRef}
        expandedLogId={expandedLogId}
        setExpandedLogId={setExpandedLogId}
        highlightPattern={highlightPattern}
        handleReportIssue={handleReportIssue}
        setHistoryPage={setHistoryPage}
      />

      <LogsPageHelpBanner />
    </div>
  );
};

const LogsPage = React.memo(LogsPageInner);
export default LogsPage;
