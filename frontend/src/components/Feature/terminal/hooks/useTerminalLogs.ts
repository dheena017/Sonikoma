import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { LogEntry, normalizeLog } from "../../../../types/logs";

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

interface UseTerminalLogsArgs {
  consoleLogs: LogEntry[];
  setConsoleLogs: Dispatch<SetStateAction<LogEntry[]>>;
}

export function useTerminalLogs({
  consoleLogs,
  setConsoleLogs,
}: UseTerminalLogsArgs) {
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

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    if (!paused) {
      setLastVisibleCount(consoleLogs.length);
    }
  }, [consoleLogs, autoScroll, paused, searchQuery, activeFilter]);

  const filteredLogs = useMemo(() => {
    return consoleLogs.filter((log) => {
      const query = searchQuery.toLowerCase().trim();
      const matchesQuery =
        query === "" ||
        log.message.toLowerCase().includes(query) ||
        log.module.toLowerCase().includes(query);

      if (!matchesQuery) return false;

      if (activeFilter === "errors") {
        return (
          log.level === "ERROR" || log.message.toLowerCase().includes("fail")
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
  }, [consoleLogs, searchQuery, activeFilter]);

  const displayedLogs = useMemo(() => {
    const logs = paused
      ? filteredLogs.slice(
          0,
          Math.max(0, Math.min(lastVisibleCount, filteredLogs.length))
        )
      : filteredLogs;

    return logs;
  }, [paused, filteredLogs, lastVisibleCount]);

  const errorCount = consoleLogs.filter(
    (log) => log.level === "ERROR" || log.message.toLowerCase().includes("fail")
  ).length;
  const warningCount = consoleLogs.filter(
    (log) => log.level === "WARN" || log.level === "WARNING"
  ).length;
  const successCount = consoleLogs.filter(
    (log) =>
      log.level === "SUCCESS" || log.message.toLowerCase().includes("success")
  ).length;
  const aiCount = consoleLogs.filter(
    (log) =>
      log.module.toLowerCase().includes("ai") ||
      log.module.toLowerCase().includes("gemini")
  ).length;

  const handleCopyAll = () => {
    const allLogs = consoleLogs
      .map((l) => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`)
      .join("\n");

    navigator.clipboard.writeText(allLogs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyVisible = () => {
    const visible = displayedLogs
      .map((l) => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`)
      .join("\n");

    navigator.clipboard.writeText(visible).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleDownloadLogs = () => {
    const blob = new Blob(
      [
        consoleLogs
          .map(
            (l) => `[${l.timestamp}] [${l.module}] [${l.level}] ${l.message}`
          )
          .join("\n"),
      ],
      {
        type: "text/plain;charset=utf-8",
      }
    );
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
      normalizeLog(`[GUI] Active shell cleared at user prompt.`),
    ]);
  };

  return {
    scrollRef,
    copied,
    autoScroll,
    setAutoScroll,
    paused,
    setPaused,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    displayedLogs,
    errorCount,
    warningCount,
    successCount,
    aiCount,
    handleCopyAll,
    handleCopyVisible,
    handleDownloadLogs,
    handleClear,
  };
}
