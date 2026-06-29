export type LogLevel =
  | "INFO"
  | "SUCCESS"
  | "WARN"
  | "WARNING"
  | "ERROR"
  | "CRITICAL"
  | "DEBUG"
  | "SYSTEM";

export interface LogEntry {
  id?: number;
  timestamp: string; // HH:MM:SS
  message: string;
  level: LogLevel;
  module: string;
  details?: string;
  correlation_id?: string;
  user_id?: string;
  snapshot?: any; // JSON object or string
  created_at?: string; // ISO String for historical
}

/**
 * Normalizes an incoming log (which could be a raw string, a partial object, or a DB record)
 * into a standard LogEntry structure for the UI.
 */
export function normalizeLog(log: any): LogEntry {
  const now = new Date();
  const defaultTimestamp = now.toLocaleTimeString("en-US", { hour12: false });

  // If it's already a well-formed object from the backend
  if (typeof log === "object" && log !== null) {
    if (log.message && log.level && log.timestamp) {
      return {
        ...log,
        level: (log.level || "INFO").toUpperCase() as LogLevel,
        snapshot:
          typeof log.snapshot === "string" && log.snapshot.startsWith("{")
            ? JSON.parse(log.snapshot)
            : log.snapshot,
      };
    }

    // Handle database row format
    if (log.message) {
      let snapshot = log.snapshot;
      if (typeof snapshot === "string" && snapshot.startsWith("{")) {
        try {
          snapshot = JSON.parse(snapshot);
        } catch {
          /* ignore */
        }
      }
      return {
        id: log.id,
        message: log.message,
        level: (log.level || "INFO").toUpperCase() as LogLevel,
        module: log.module || "System",
        timestamp: log.timestamp || defaultTimestamp,
        details: log.details || "",
        correlation_id: log.correlation_id,
        user_id: log.user_id,
        snapshot: snapshot,
        created_at: log.created_at,
      };
    }
  }

  // Handle raw string logs (legacy fallback)
  const logStr = String(log);
  let level: LogLevel = "INFO";
  let module = "App";
  let message = logStr;

  // Extract metadata if formatted as "[Module] [LEVEL] Message"
  const bracketMatch = logStr.match(
    /^\[([^\]]+)\]\s*(?:\[([^\]]+)\])?\s*(.*)$/
  );
  if (bracketMatch) {
    const firstTag = bracketMatch[1];
    const secondTag = bracketMatch[2];
    const rest = bracketMatch[3];

    if (
      secondTag &&
      [
        "INFO",
        "DEBUG",
        "WARN",
        "WARNING",
        "ERROR",
        "CRITICAL",
        "SUCCESS",
      ].includes(secondTag.toUpperCase())
    ) {
      level = secondTag.toUpperCase() as LogLevel;
      module = firstTag;
      message = rest;
    } else if (
      [
        "INFO",
        "DEBUG",
        "WARN",
        "WARNING",
        "ERROR",
        "CRITICAL",
        "SUCCESS",
      ].includes(firstTag.toUpperCase())
    ) {
      level = firstTag.toUpperCase() as LogLevel;
      message = secondTag ? `[${secondTag}] ${rest}` : rest;
    } else {
      module = firstTag;
      message = secondTag ? `[${secondTag}] ${rest}` : rest;
    }
  }

  // Final level inference from message content
  const lowerMsg = message.toLowerCase();
  if (
    lowerMsg.includes("error") ||
    lowerMsg.includes("failed") ||
    lowerMsg.includes("critical")
  )
    level = "ERROR";
  else if (lowerMsg.includes("warn")) level = "WARN";
  else if (lowerMsg.includes("success")) level = "SUCCESS";

  return {
    timestamp: defaultTimestamp,
    message,
    level,
    module,
  };
}
