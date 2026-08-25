import { useState, useCallback } from "react";
import { LogEntry, normalizeLog } from "@/types/logs";

export function useAppLogs() {
  const [consoleLogs, setRawConsoleLogs] = useState<LogEntry[]>([]);

  const addConsoleLog = useCallback((raw: any) => {
    const entry = normalizeLog(raw);
    setRawConsoleLogs((prev) => [...prev.slice(-499), entry]); // Keep latest 500 logs
  }, []);

  const clearLogs = useCallback(() => {
    setRawConsoleLogs([]);
  }, []);

  return {
    consoleLogs,
    setRawConsoleLogs,
    addConsoleLog,
    clearLogs,
  };
}
