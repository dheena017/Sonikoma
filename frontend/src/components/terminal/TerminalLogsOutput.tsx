import React from "react";
import { Terminal } from "lucide-react";

interface TerminalLogsOutputProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  filteredLogs: string[];
  searchQuery: string;
  activeFilter: string;
}

function getLogColor(log: string): string {
  // Priority 1: Errors & Fatal errors
  if (
    log.includes("[ERROR]") ||
    log.includes("ERROR]") ||
    log.includes("[Error]") ||
    log.includes("Error]")
  )
    return "text-red-400 font-semibold";
  if (log.includes("[FATAL]")) return "text-red-500 font-bold";
  if (log.includes(" 500 ") || log.includes("-> 500"))
    return "text-red-400 font-semibold";

  // Priority 2: Warnings
  if (
    log.includes("[WARNING]") ||
    log.includes("[WARN]") ||
    log.includes("[Warning]") ||
    log.includes("Warning]")
  )
    return "text-amber-400 font-semibold";
  if (
    log.includes(" 404 ") ||
    log.includes("-> 404") ||
    log.includes(" 429 ") ||
    log.includes("429 Too Many Requests") ||
    log.includes("-> 429")
  )
    return "text-amber-400 font-semibold";

  // Priority 3: Success requests and messages
  if (
    log.includes("[SUCCESS]") ||
    log.includes("completed cleanly") ||
    log.includes("Successfully")
  )
    return "text-emerald-400 font-medium";
  if (
    log.includes(" 200 ") ||
    log.includes(" 200 OK") ||
    log.includes("-> 200")
  )
    return "text-emerald-400 font-medium";

  // Specific components
  if (
    log.includes("[Proxy]") ||
    log.includes("[Proxy-image]") ||
    log.includes("proxy-image") ||
    log.includes("anivox.routes.proxy")
  )
    return "text-sky-300 font-medium";
  if (
    log.includes("[API]") ||
    log.includes("[Network]") ||
    log.includes("[HTTP]") ||
    log.includes("anivox.api")
  )
    return "text-sky-400";
  if (log.includes("[Vite]")) return "text-fuchsia-400 font-medium";
  if (log.includes("httpx") || log.includes("HTTP Request:")) {
    if (log.includes("POST")) return "text-amber-400 font-medium";
    if (log.includes("GET")) return "text-emerald-400 font-light";
    if (log.includes("PUT")) return "text-sky-400 font-light";
    if (log.includes("DELETE")) return "text-red-400 font-medium";
    return "text-purple-400 font-light";
  }

  if (
    log.includes("[AI Auto-Analysis]") ||
    log.includes("[AI Model]") ||
    log.includes("[Gemini]")
  )
    return "text-purple-300 font-medium";
  if (log.includes("[AI Smart Crop]")) return "text-violet-400 font-medium";
  if (
    log.includes("[OCR/CV Engine]") ||
    log.includes("[Vision OCR]") ||
    log.includes("[CV")
  )
    return "text-purple-300";
  if (log.includes("[Helper Scraper]")) return "text-cyan-300 font-medium";
  if (log.includes("[Scraper]")) return "text-cyan-400";
  if (log.includes("[Server]")) return "text-cyan-300 font-medium";
  if (
    log.includes("HUGGINGFACE") ||
    log.includes("injected env") ||
    log.includes("No HUGGINGFACE_API_KEY")
  )
    return "text-amber-300";
  if (log.includes("[Control]") || log.includes("[Pipeline]"))
    return "text-blue-400";
  if (
    log.includes("[MoviePy]") ||
    log.includes("[Video]") ||
    log.includes("[FFmpeg]")
  )
    return "text-amber-300";
  if (log.includes("[Image Editor]")) return "text-orange-400";
  if (
    log.includes("[Stitcher]") ||
    log.includes("Combined") ||
    log.includes("[Stitch]")
  )
    return "text-indigo-300";
  if (log.includes("[Auto Cropper]") || log.includes("[Crop]"))
    return "text-green-400";
  if (log.includes("[Speech Bubbles]")) return "text-pink-400";
  if (log.includes("[GUI]")) return "text-neutral-300";
  if (log.includes("[Preloader]")) return "text-neutral-500";
  if (log.includes("[Model]")) return "text-violet-300";
  if (log.includes("[Database]") || log.includes("[DB]"))
    return "text-emerald-400 font-bold";
  return "text-neutral-400";
}

function getLogBorderColor(log: string): string {
  if (
    log.includes("[ERROR]") ||
    log.includes("ERROR]") ||
    log.includes("[Error]") ||
    log.includes("Error]") ||
    log.includes("[FATAL]")
  )
    return "border-red-500/60";
  if (log.includes(" 500 ") || log.includes("-> 500"))
    return "border-red-500/60";
  if (log.includes("[SUCCESS]") || log.includes("Successfully"))
    return "border-emerald-500/60";
  if (
    log.includes(" 200 ") ||
    log.includes(" 200 OK") ||
    log.includes("-> 200")
  )
    return "border-emerald-500/60";
  if (
    log.includes("[WARNING]") ||
    log.includes("[WARN]") ||
    log.includes("[Warning]") ||
    log.includes("Warning]")
  )
    return "border-amber-500/60";
  if (
    log.includes(" 404 ") ||
    log.includes("-> 404") ||
    log.includes(" 429 ") ||
    log.includes("429 Too Many Requests") ||
    log.includes("-> 429")
  )
    return "border-amber-500/60";
  if (
    log.includes("[Proxy]") ||
    log.includes("[Proxy-image]") ||
    log.includes("proxy-image") ||
    log.includes("anivox.routes.proxy")
  )
    return "border-sky-500/40";
  if (
    log.includes("[API]") ||
    log.includes("[Network]") ||
    log.includes("[HTTP]") ||
    log.includes("anivox.api")
  )
    return "border-sky-500/40";
  if (log.includes("[Vite]")) return "border-fuchsia-500/50";
  if (log.includes("httpx") || log.includes("HTTP Request:")) {
    if (log.includes("POST")) return "border-amber-500/40";
    if (log.includes("GET")) return "border-emerald-500/40";
    if (log.includes("PUT")) return "border-sky-500/40";
    if (log.includes("DELETE")) return "border-red-500/40";
    return "border-purple-500/40";
  }
  if (log.includes("[AI") || log.includes("[Gemini]"))
    return "border-purple-500/50";
  if (log.includes("[Helper Scraper]")) return "border-cyan-400/40";
  if (log.includes("[Scraper]")) return "border-cyan-500/40";
  if (log.includes("[Server]")) return "border-cyan-500/40";
  if (
    log.includes("HUGGINGFACE") ||
    log.includes("injected env") ||
    log.includes("No HUGGINGFACE_API_KEY")
  )
    return "border-amber-500/40";
  if (log.includes("[Control]") || log.includes("[Pipeline]"))
    return "border-blue-500/40";
  if (log.includes("[Database]") || log.includes("[DB]"))
    return "border-emerald-500/60";
  return "border-neutral-800";
}

function renderTokenizedPrefix(prefix: string) {
  if (!prefix) return null;
  const parts = prefix.split(/(\s+|:|\[|\])/);
  return (
    <>
      {parts.map((part, idx) => {
        if (!part) return null;
        if (/^\s+$/.test(part)) return <span key={idx}>{part}</span>;

        const clean = part.trim();
        if (clean === "INFO")
          return (
            <span key={idx} className="text-neutral-500 font-semibold">
              {part}
            </span>
          );
        if (clean === "httpx")
          return (
            <span key={idx} className="text-violet-400 font-semibold">
              {part}
            </span>
          );
        if (clean === "HTTP")
          return (
            <span key={idx} className="text-purple-400">
              {part}
            </span>
          );
        if (clean === "Request")
          return (
            <span key={idx} className="text-purple-400/80">
              {part}
            </span>
          );
        if (clean === ":" || clean === "[" || clean === "]")
          return (
            <span key={idx} className="text-neutral-600">
              {part}
            </span>
          );

        return (
          <span key={idx} className="text-neutral-500">
            {part}
          </span>
        );
      })}
    </>
  );
}

function renderTokenizedUrl(url: string) {
  if (!url) return null;

  // Check if it's a Gemini API URL
  const geminiMatch = url.match(
    /^(https?:\/\/)(generativelanguage\.googleapis\.com)(\/v1beta\/models\/)?([a-zA-Z0-9.\-_]+)?(:[a-zA-Z0-9]+)?(.*)$/
  );
  if (geminiMatch) {
    const [_, protocol, host, modelsPath, model, action, rest] = geminiMatch;
    return (
      <>
        <span className="text-cyan-600/80">{protocol}</span>
        <span className="text-cyan-400/90 font-medium">{host}</span>
        {modelsPath && <span className="text-neutral-500">{modelsPath}</span>}
        {model && (
          <span className="text-violet-400 font-semibold">{model}</span>
        )}
        {action && (
          <span className="text-amber-400 font-semibold">{action}</span>
        )}
        {rest && <span className="text-neutral-400">{rest}</span>}
      </>
    );
  }

  // Generic URL tokenizer
  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol + "//";
    const host = parsed.host;
    const pathname = parsed.pathname;
    const search = parsed.search;
    const hash = parsed.hash;

    // Highlight last segment of path
    const pathSegments = pathname.split("/");
    const lastSegment = pathSegments.pop() || "";
    const prefixPath = pathSegments.join("/") + "/";

    return (
      <>
        <span className="text-cyan-600/80">{protocol}</span>
        <span className="text-cyan-400/90 font-medium">{host}</span>
        <span className="text-neutral-500">{prefixPath}</span>
        <span className="text-teal-400 font-medium">{lastSegment}</span>
        {search && <span className="text-amber-500/80">{search}</span>}
        {hash && <span className="text-purple-500/80">{hash}</span>}
      </>
    );
  } catch (e) {
    return (
      <span className="text-cyan-400/90 font-light select-all">{url}</span>
    );
  }
}

function renderTokenizedStatus(status: string) {
  if (!status) return null;
  const cleanStatus = status.trim();
  const hasQuotes =
    (cleanStatus.startsWith('"') && cleanStatus.endsWith('"')) ||
    (cleanStatus.startsWith("'") && cleanStatus.endsWith("'"));
  const innerStatus = hasQuotes ? cleanStatus.slice(1, -1) : cleanStatus;

  const httpMatch = innerStatus.match(/^(HTTP\/\d\.\d)\s+(\d{3})\s*(.*)$/i);
  if (httpMatch) {
    const [_, httpVersion, code, message] = httpMatch;

    let codeColor = "text-neutral-400";
    let messageColor = "text-neutral-500";

    if (code.startsWith("2")) {
      codeColor = "text-emerald-400 font-bold";
      messageColor = "text-emerald-500/90 font-medium";
    } else if (code === "429") {
      codeColor = "text-amber-400 font-bold animate-pulse";
      messageColor = "text-amber-500 font-semibold";
    } else if (code.startsWith("4")) {
      codeColor = "text-amber-400 font-bold";
      messageColor = "text-amber-500/90 font-medium";
    } else if (code.startsWith("5")) {
      codeColor = "text-red-400 font-bold";
      messageColor = "text-red-500 font-semibold";
    }

    return (
      <>
        {hasQuotes && <span className="text-neutral-600">"</span>}
        <span className="text-sky-500/80 font-light">{httpVersion}</span>
        <span className="text-neutral-600"> </span>
        <span className={codeColor}>{code}</span>
        {message && (
          <>
            <span className="text-neutral-600"> </span>
            <span className={messageColor}>{message}</span>
          </>
        )}
        {hasQuotes && <span className="text-neutral-600">"</span>}
      </>
    );
  }

  if (/^\d{3}$/.test(innerStatus)) {
    let codeColor = "text-neutral-400";
    if (innerStatus.startsWith("2")) codeColor = "text-emerald-400 font-bold";
    else if (innerStatus === "429") codeColor = "text-amber-400 font-bold";
    else if (innerStatus.startsWith("4"))
      codeColor = "text-amber-400 font-bold";
    else if (innerStatus.startsWith("5")) codeColor = "text-red-400 font-bold";

    return (
      <>
        {hasQuotes && <span className="text-neutral-600">"</span>}
        <span className={codeColor}>{innerStatus}</span>
        {hasQuotes && <span className="text-neutral-600">"</span>}
      </>
    );
  }

  return <span className="text-neutral-400 font-medium">{status}</span>;
}

function renderParsedLog(log: string) {
  // Strip ANSI escape codes to parse clean text
  const ansi_escape = /\x1b\[[0-9;]*[mK]/g;
  const cleanLog = log.replace(ansi_escape, "");

  // Regex to check if the line contains a URL followed optionally by status code info
  const generalHttpRegex =
    /^(.*?)(https?:\/\/[^\s"'()]+)(?:\s+(["']HTTP\/\d\.\d \d{3} .*?["']|\d{3}\b))?(.*)$/i;
  const match = cleanLog.match(generalHttpRegex);

  if (match) {
    const [_, rawPrefix, url, status, suffix] = match;

    // Extract method from prefix if present (e.g. "POST", "GET", etc.)
    let method = "";
    let prefix = rawPrefix;
    const methodMatch = rawPrefix.match(/^(.*?\b)(POST|GET|PUT|DELETE)(\s*)$/i);
    if (methodMatch) {
      prefix = methodMatch[1];
      method = methodMatch[2];
    }

    let methodColor = "text-purple-400";
    if (method.toUpperCase() === "POST")
      methodColor = "text-amber-400 font-bold";
    else if (method.toUpperCase() === "GET")
      methodColor = "text-emerald-400 font-bold";
    else if (method.toUpperCase() === "PUT")
      methodColor = "text-sky-400 font-bold";
    else if (method.toUpperCase() === "DELETE")
      methodColor = "text-red-400 font-bold";

    return (
      <>
        {prefix && renderTokenizedPrefix(prefix)}
        {method && <span className={methodColor}>{method} </span>}
        {renderTokenizedUrl(url)}
        {status && (
          <>
            <span> </span>
            {renderTokenizedStatus(status)}
          </>
        )}
        {suffix && <span className="text-neutral-500">{suffix}</span>}
      </>
    );
  }

  // If it's a server-side request log, e.g. [a8f3b2d1] GET /api/health -> 200 (5.42ms)
  // We allow prefix (timestamp, [BACKEND], etc.) before the request ID block.
  const serverLogRegex =
    /^(.*?)(\[.*?[a-f0-9]+.*?\]\s+)(GET|POST|PUT|DELETE)(\s+\S+)(\s+->\s+)(\d{3})(\s+\(.*?\))?$/i;
  const serverMatch = cleanLog.match(serverLogRegex);
  if (serverMatch) {
    const [_, prefix, reqId, method, path, arrow, status, duration] =
      serverMatch;

    let methodColor = "text-purple-400";
    if (method.toUpperCase() === "POST")
      methodColor = "text-amber-400 font-bold";
    else if (method.toUpperCase() === "GET")
      methodColor = "text-emerald-400 font-bold";
    else if (method.toUpperCase() === "PUT")
      methodColor = "text-sky-400 font-bold";
    else if (method.toUpperCase() === "DELETE")
      methodColor = "text-red-400 font-bold";

    let statusColor = "text-neutral-400";
    if (status.startsWith("2")) statusColor = "text-emerald-400 font-medium";
    else if (status.startsWith("4")) statusColor = "text-amber-400 font-medium";
    else if (status.startsWith("5")) statusColor = "text-red-400 font-medium";

    return (
      <>
        {prefix && renderTokenizedPrefix(prefix)}
        <span className="text-neutral-500 font-semibold">{reqId}</span>
        <span className={methodColor}>{method}</span>
        <span className="text-cyan-400/90 font-light">{path}</span>
        <span className="text-neutral-500">{arrow}</span>
        <span className={statusColor}>{status}</span>
        {duration && (
          <span className="text-neutral-500 font-light">{duration}</span>
        )}
      </>
    );
  }

  // Standalone HTTP request check when no URL is present (or URL failed to match)
  if (cleanLog.includes("httpx") || cleanLog.includes("HTTP Request:")) {
    const standaloneHttpRegex = /^(.*?)\b(POST|GET|PUT|DELETE)\b(.*)$/i;
    const standaloneMatch = cleanLog.match(standaloneHttpRegex);
    if (standaloneMatch) {
      const [_, prefix, method, suffix] = standaloneMatch;
      let methodColor = "text-purple-400";
      if (method.toUpperCase() === "POST")
        methodColor = "text-amber-400 font-bold";
      else if (method.toUpperCase() === "GET")
        methodColor = "text-emerald-400 font-bold";
      else if (method.toUpperCase() === "PUT")
        methodColor = "text-sky-400 font-bold";
      else if (method.toUpperCase() === "DELETE")
        methodColor = "text-red-400 font-bold";

      return (
        <>
          {prefix && renderTokenizedPrefix(prefix)}
          <span className={methodColor}>{method}</span>
          {suffix && <span className="text-neutral-500">{suffix}</span>}
        </>
      );
    }
  }

  return log;
}

const LogRow = React.memo(({ log, index, total }: { log: string, index: number, total: number }) => {
  const logColor = getLogColor(log);
  const borderColor = getLogBorderColor(log);

  return (
    <div
      className={`leading-relaxed border-l-2 pl-2 hover:bg-neutral-900/30 rounded-r transition-colors ${logColor} ${borderColor}`}
    >
      <span className="text-neutral-600 mr-2 select-none">
        {String(total - index).padStart(3, "0")}
      </span>
      {renderParsedLog(log)}
    </div>
  );
});

export function TerminalLogsOutput({
  scrollRef,
  filteredLogs,
  searchQuery,
  activeFilter,
}: TerminalLogsOutputProps) {
  const reversedLogs = React.useMemo(() => [...filteredLogs].reverse(), [filteredLogs]);

  return (
    <div
      ref={scrollRef}
      className="bg-neutral-950 rounded-xl p-4 border border-transparent h-72 md:h-56 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin shadow-inner"
    >
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
          <Terminal className="h-6 w-6 opacity-30 animate-pulse" />
          <p className="text-[11px] font-mono">
            {searchQuery || activeFilter !== "all"
              ? "No search results match query filters"
              : "Waiting for pipeline activity..."}
          </p>
          <p className="text-[9px] text-neutral-700">
            {searchQuery || activeFilter !== "all"
              ? "Try clearing the search query or tabs filter"
              : "Logs will print here on active script actions"}
          </p>
        </div>
      ) : (
        reversedLogs.map((log, index) => (
          <LogRow
            key={`${log}-${filteredLogs.length - index}`}
            log={log}
            index={index}
            total={filteredLogs.length}
          />
        ))
      )}
    </div>
  );
}
