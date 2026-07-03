import type { ReactNode } from "react";

function renderTokenizedPrefix(prefix: string): ReactNode {
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

function renderTokenizedUrl(url: string): ReactNode {
  if (!url) return null;

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

  try {
    const parsed = new URL(url);
    const protocol = parsed.protocol + "//";
    const host = parsed.host;
    const pathname = parsed.pathname;
    const search = parsed.search;
    const hash = parsed.hash;

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

function renderTokenizedStatus(status: string): ReactNode {
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

export function renderParsedLog(log: string): ReactNode {
  const ansi_escape = /\x1b\[[0-9;]*[mK]/g;
  const cleanLog = log.replace(ansi_escape, "");

  const generalHttpRegex =
    /^(.*?)(https?:\/\/[^"'()]+)(?:\s+(?:["']HTTP\/\d\.\d \d{3} .*?["']|\d{3}\b))?(.*)$/i;
  const match = cleanLog.match(generalHttpRegex);

  if (match) {
    const [_, rawPrefix, url, rest] = match;

    let method = "";
    let prefix = rawPrefix;
    const methodMatch = rawPrefix.match(/^(.*?\b)(POST|GET|PUT|DELETE)(\s*)$/i);
    if (methodMatch) {
      prefix = methodMatch[1];
      method = methodMatch[2];
    }

    let methodColor = "text-purple-400";
    if (method.toUpperCase() === "POST") methodColor = "text-amber-400 font-bold";
    else if (method.toUpperCase() === "GET") methodColor = "text-emerald-400 font-bold";
    else if (method.toUpperCase() === "PUT") methodColor = "text-sky-400 font-bold";
    else if (method.toUpperCase() === "DELETE") methodColor = "text-red-400 font-bold";

    const statusMatch = rest.match(/^(?:\s+(?:["']HTTP\/\d\.\d \d{3} .*?["']|(\d{3})\b))?/i);
    const status = statusMatch?.[0]?.trim() || "";
    const suffix = rest.slice(statusMatch?.[0]?.length || 0);

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

  const serverLogRegex =
    /^(.*?)(\[.*?[a-f0-9]+.*?\]\s+)(GET|POST|PUT|DELETE)(\s+\S+)(\s+->\s+)(\d{3})(\s+\(.*?\))?$/i;
  const serverMatch = cleanLog.match(serverLogRegex);
  if (serverMatch) {
    const [_, prefix, reqId, method, path, arrow, status, duration] = serverMatch;

    let methodColor = "text-purple-400";
    if (method.toUpperCase() === "POST") methodColor = "text-amber-400 font-bold";
    else if (method.toUpperCase() === "GET") methodColor = "text-emerald-400 font-bold";
    else if (method.toUpperCase() === "PUT") methodColor = "text-sky-400 font-bold";
    else if (method.toUpperCase() === "DELETE") methodColor = "text-red-400 font-bold";

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

  if (cleanLog.includes("httpx") || cleanLog.includes("HTTP Request:")) {
    const standaloneHttpRegex = /^(.*?)\b(POST|GET|PUT|DELETE)\b(.*)$/i;
    const standaloneMatch = cleanLog.match(standaloneHttpRegex);
    if (standaloneMatch) {
      const [_, prefix, method, suffix] = standaloneMatch;
      let methodColor = "text-purple-400";
      if (method.toUpperCase() === "POST") methodColor = "text-amber-400 font-bold";
      else if (method.toUpperCase() === "GET") methodColor = "text-emerald-400 font-bold";
      else if (method.toUpperCase() === "PUT") methodColor = "text-sky-400 font-bold";
      else if (method.toUpperCase() === "DELETE") methodColor = "text-red-400 font-bold";

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
