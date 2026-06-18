/**
 * frontend/src/utils/logger.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Global browser console logger interceptor.
 * Standardizes time, category, log level, filename, and details formatting.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const originalLog = console.log;
const originalWarn = console.warn;
const originalError = console.error;
const originalDebug = console.debug;

function getCallerFile(): string {
  const stack = new Error().stack;
  if (!stack) return "unknown";
  const lines = stack.split("\n");

  for (let i = 2; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Skip libraries, logger, and react internal call trace frames
    if (
      line.includes("node_modules") ||
      line.includes("@vite") ||
      line.includes("@react-refresh") ||
      line.includes("logger.ts") ||
      line.includes("react-dom") ||
      line.includes("react.development")
    ) {
      continue;
    }

    // Extract filename and line info
    const match = line.match(/\/([^\/\?]+)(?:\?|:\d+:\d+|\))/);
    if (match && match[1]) {
      return match[1].replace(/:\d+:\d+$/, "").replace(/\)$/, "");
    }
  }
  return "unknown";
}

function getFormattedTime(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false });
}

function formatMessage(level: string, filename: string, args: any[]): any[] {
  const time = getFormattedTime();

  // Exclude logs that are already fully formatted from getting double-prefixed
  if (
    typeof args[0] === "string" &&
    /^\d{2}:\d{2}:\d{2} \[[A-Z_0-9]+\]/.test(args[0])
  ) {
    return args;
  }

  const prefix = `%c${time} %c[FRONTEND] %c[${level}] %c[${filename}]`;
  const timeStyle = "color: #888888; font-weight: normal;";
  const categoryStyle = "color: #ff00ff; font-weight: bold;"; // Magenta

  let levelColor = "#00ffff"; // Cyan
  if (level === "WARN") levelColor = "#ffff00"; // Yellow
  if (level === "ERROR") levelColor = "#ff0000"; // Red

  const levelStyle = `color: ${levelColor}; font-weight: bold;`;
  const fileStyle = "color: #00ffcc; font-style: italic;";

  if (typeof args[0] === "string") {
    return [
      prefix + " " + args[0],
      timeStyle,
      categoryStyle,
      levelStyle,
      fileStyle,
      ...args.slice(1),
    ];
  } else {
    return [prefix, timeStyle, categoryStyle, levelStyle, fileStyle, ...args];
  }
}

console.log = (...args: any[]) => {
  const filename = getCallerFile();
  originalLog(...formatMessage("INFO", filename, args));
};

console.warn = (...args: any[]) => {
  const filename = getCallerFile();
  originalWarn(...formatMessage("WARN", filename, args));
};

console.error = (...args: any[]) => {
  const filename = getCallerFile();
  originalError(...formatMessage("ERROR", filename, args));
};

console.debug = (...args: any[]) => {
  const filename = getCallerFile();
  originalDebug(...formatMessage("DEBUG", filename, args));
};
