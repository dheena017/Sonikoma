import React, { useEffect, useRef, useState } from "react";
import { TerminalLogsHeader } from "./TerminalLogsHeader.js";
import { TerminalLogsFilter } from "./TerminalLogsFilter.js";
import { TerminalLogsOutput } from "./TerminalLogsOutput.js";

interface TerminalLogsProps {
  consoleLogs: string[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
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

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    // when not paused, keep visible count in sync
    if (!paused) {
      setLastVisibleCount(consoleLogs.length);
    }
  }, [consoleLogs, autoScroll, searchQuery, activeFilter]);

  const handleCopyAll = () => {
    const allLogs = consoleLogs.join("\n");
    navigator.clipboard.writeText(allLogs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyVisible = () => {
    const visible = (
      paused ? consoleLogs.slice(0, lastVisibleCount) : consoleLogs
    ).join("\n");
    navigator.clipboard.writeText(visible).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([consoleLogs.join("\n")], {
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
      `[GUI] ${getTimestamp()} — Active shell cleared at user prompt.`,
    ]);
  };

  // Filter and search logic
  const filteredLogs = consoleLogs.filter((log) => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = query === "" || log.toLowerCase().includes(query);

    if (!matchesQuery) return false;

    if (activeFilter === "errors") {
      return (
        log.includes("[ERROR]") ||
        log.includes("ERROR]") ||
        log.includes("[FATAL]")
      );
    }
    if (activeFilter === "warnings") {
      return log.includes("[WARNING]") || log.includes("[WARN]");
    }
    if (activeFilter === "ai") {
      return (
        log.includes("[AI") ||
        log.includes("[Gemini]") ||
        log.includes("Gemini")
      );
    }
    if (activeFilter === "success") {
      return (
        log.includes("[SUCCESS]") ||
        log.includes("Successfully") ||
        log.includes("completed cleanly")
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
      log.includes("[ERROR]") ||
      log.includes("ERROR]") ||
      log.includes("[FATAL]")
  ).length;
  const warningCount = consoleLogs.filter(
    (log) => log.includes("[WARNING]") || log.includes("[WARN]")
  ).length;
  const successCount = consoleLogs.filter(
    (log) => log.includes("[SUCCESS]") || log.includes("Successfully")
  ).length;
  const aiCount = consoleLogs.filter(
    (log) => log.includes("[AI") || log.includes("[Gemini]")
  ).length;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5">
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
