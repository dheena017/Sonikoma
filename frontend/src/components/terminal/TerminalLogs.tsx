import React, { useEffect, useRef, useState } from "react";
import { TerminalLogsHeader } from "./TerminalLogsHeader.js";
import { TerminalLogsFilter } from "./TerminalLogsFilter.js";
import { TerminalLogsOutput } from "./TerminalLogsOutput.js";
import { LogEntry, normalizeLog } from "../../types/logs";

interface TerminalLogsProps {
  consoleLogs: LogEntry[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function TerminalLogs({
  consoleLogs,
  setConsoleLogs,
}: TerminalLogsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [paused, setPaused] = useState(false);
  const [lastVisibleCount, setLastVisibleCount] = useState<number>(
    consoleLogs.length
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<
    "all" | "errors" | "warnings" | "ai" | "success"
  >("all");

  // Auto-scroll to top when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    // when not paused, keep visible count in sync
    if (!paused) {
      setLastVisibleCount(consoleLogs.length);
    }
  }, [consoleLogs, autoScroll, searchQuery, activeFilter]);

  const handleCopyAll = () => {
    const allLogs = consoleLogs.map(l => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(allLogs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyVisible = () => {
    const visible = (
      paused ? consoleLogs.slice(0, lastVisibleCount) : consoleLogs
    ).map(l => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(visible).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([consoleLogs.map(l => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`).join("\n")], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `compilation_logs_${getTimestamp().replace(/:/g, "-")}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    setConsoleLogs([
      normalizeLog(`[GUI] Active shell cleared at user prompt.`)
    ]);
  };

  // Filter and search logic
  const filteredLogs = consoleLogs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = query === "" ||
      log.message.toLowerCase().includes(query) ||
      log.module.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (activeFilter === "errors") {
      return (
        log.level === "ERROR" ||
        log.message.toLowerCase().includes("fail")
      );
    }
    if (activeFilter === "warnings") {
      return log.level === "WARN" || log.level === "WARNING";
    }
    if (activeFilter === "ai") {
      return (
        log.module.toLowerCase().includes("ai") ||
        log.module.toLowerCase().includes("gemini")
      );
    }
    if (activeFilter === "success") {
      return (
        log.level === "SUCCESS" ||
        log.message.toLowerCase().includes("success")
      );
    }

    return true;
  });

  // When paused, only show up to `lastVisibleCount` logs to avoid UI jumping
  const displayedLogs = paused
    ? filteredLogs.slice(
        0,
        Math.max(0, Math.min(lastVisibleCount, filteredLogs.length))
      )
    : filteredLogs;

  // Calculate statistics counts
  const errorCount = consoleLogs.filter(
    (log) =>
      log.level === "ERROR" ||
      log.message.toLowerCase().includes("fail")
  ).length;
  const warningCount = consoleLogs.filter(
    (log) => log.level === "WARN" || log.level === "WARNING"
  ).length;
  const successCount = consoleLogs.filter(
    (log) => log.level === "SUCCESS" || log.message.toLowerCase().includes("success")
  ).length;
  const aiCount = consoleLogs.filter(
    (log) => log.module.toLowerCase().includes("ai") || log.module.toLowerCase().includes("gemini")
  ).length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5 min-w-0 w-full overflow-hidden">
      <TerminalLogsHeader
        consoleLogs={consoleLogs}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        paused={paused}
        setPaused={setPaused}
        copied={copied}
        handleCopyAll={handleCopyAll}
        handleCopyVisible={handleCopyVisible}
        handleDownloadLogs={handleDownloadLogs}
        handleClear={handleClear}
      />

      <TerminalLogsFilter
        consoleLogs={consoleLogs}
        activeFilter={activeFilter}
        setActiveFilter={setActiveFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        errorCount={errorCount}
        warningCount={warningCount}
        aiCount={aiCount}
        successCount={successCount}
      />

      <TerminalLogsOutput
        scrollRef={scrollRef}
        filteredLogs={displayedLogs}
        searchQuery={searchQuery}
        activeFilter={activeFilter}
      />
    </div>
  );
}
