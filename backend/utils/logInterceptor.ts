/**
 * backend/utils/logInterceptor.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Intercepts console.log, console.warn, and console.error globally.
 * Stores them in a rolling memory buffer and notifies active subscribers (SSE).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { inspect } from 'util';

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
}

const MAX_LOGS = 500;
const logBuffer: LogEntry[] = [];
let logSeq = 0;

type LogListener = (entry: LogEntry) => void;
const listeners = new Set<LogListener>();

// Store original console methods
const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;

let isIntercepting = false;

function formatTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function stripAnsi(str: string): string {
  return str.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
}

function formatArgs(args: unknown[]): string {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return arg;
    }
    // Deep formatting of objects / errors / arrays without colors
    return inspect(arg, { depth: 4, colors: false, breakLength: 100 });
  }).join(' ');
}

function pushLog(prefix: string, args: unknown[]) {
  // Reentrancy guard to prevent infinite loops if formatting or listener logs
  if (isIntercepting) return;
  isIntercepting = true;

  try {
    const rawMsg = stripAnsi(formatArgs(args));
    const timestamp = formatTimestamp();
    
    // Format the message with appropriate category tag if not present
    let formattedMsg = rawMsg;
    if (prefix === '[WARNING]') {
      if (!rawMsg.includes('[WARNING]') && !rawMsg.includes('[WARN]')) {
        formattedMsg = `[WARNING] ${rawMsg}`;
      }
    } else if (prefix === '[ERROR]') {
      if (!rawMsg.includes('[ERROR]') && !rawMsg.includes('[FATAL]')) {
        formattedMsg = `[ERROR] ${rawMsg}`;
      }
    } else {
      // General info logs.
      // If it doesn't have a category bracket prefix, default to [Backend]
      if (!rawMsg.startsWith('[')) {
        formattedMsg = `[Backend] ${rawMsg}`;
      }
    }

    logSeq++;
    const entry: LogEntry = {
      id: logSeq,
      timestamp,
      message: formattedMsg
    };

    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) {
      logBuffer.shift();
    }

    // Notify all active SSE streams
    listeners.forEach(listener => {
      try {
        listener(entry);
      } catch (err) {
        // Safe catch for any listener errors
      }
    });
  } catch (err) {
    originalError('[Logger Interceptor Error] Failed to process log:', err);
  } finally {
    isIntercepting = false;
  }
}

// Override console methods globally
console.log = (...args: unknown[]) => {
  originalLog.apply(console, args);
  pushLog('[INFO]', args);
};

console.warn = (...args: unknown[]) => {
  originalWarn.apply(console, args);
  pushLog('[WARNING]', args);
};

console.error = (...args: unknown[]) => {
  originalError.apply(console, args);
  pushLog('[ERROR]', args);
};

// Export APIs to be consumed by routes
export function getLogs(since = 0): LogEntry[] {
  return logBuffer.filter(entry => entry.id > since);
}

export function addLogListener(listener: LogListener) {
  listeners.add(listener);
}

export function removeLogListener(listener: LogListener) {
  listeners.delete(listener);
}
