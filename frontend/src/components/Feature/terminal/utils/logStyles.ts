import type { LogEntry } from "@/types/logs";

export function getLogColor(log: LogEntry): string {
  const level = log.level.toUpperCase();
  const module = log.module.toLowerCase();
  const msg = log.message.toLowerCase();

  if (level === "ERROR" || msg.includes("fatal") || msg.includes("error]"))
    return "text-red-400 font-semibold";
  if (msg.includes(" 500 ") || msg.includes("-> 500"))
    return "text-red-400 font-semibold";

  if (level === "WARN" || level === "WARNING" || msg.includes("warning]"))
    return "text-amber-400 font-semibold";
  if (
    msg.includes(" 404 ") ||
    msg.includes("-> 404") ||
    msg.includes(" 429 ") ||
    msg.includes("429 too many requests") ||
    msg.includes("-> 429")
  )
    return "text-amber-400 font-semibold";

  if (
    level === "SUCCESS" ||
    msg.includes("completed cleanly") ||
    msg.includes("successfully")
  )
    return "text-emerald-400 font-medium";
  if (
    msg.includes(" 200 ") ||
    msg.includes(" 200 ok") ||
    msg.includes("-> 200")
  )
    return "text-emerald-400 font-medium";

  if (
    module === "proxy" ||
    msg.includes("proxy-image") ||
    msg.includes("sonikoma.routes.proxy")
  )
    return "text-sky-300 font-medium";
  if (
    module === "api" ||
    module === "network" ||
    module === "http" ||
    msg.includes("sonikoma.api")
  )
    return "text-sky-400";
  if (module === "vite" || msg.includes("[vite]"))
    return "text-fuchsia-400 font-medium";
  if (msg.includes("httpx") || msg.includes("http request:")) {
    if (msg.includes("post")) return "text-amber-400 font-medium";
    if (msg.includes("get")) return "text-emerald-400 font-light";
    if (msg.includes("put")) return "text-sky-400 font-light";
    if (msg.includes("delete")) return "text-red-400 font-medium";
    return "text-purple-400 font-light";
  }

  if (module === "ai" || module === "engine" || module === "gemini")
    return "text-purple-300 font-medium";

  if (module === "crop" || module === "autocrop" || msg.includes("[smart crop]"))
    return "text-violet-400 font-medium";

  if (module === "ocr" || module === "vision" || module === "cv")
    return "text-purple-300";

  if (module === "downloader") return "text-cyan-400";
  if (module === "server") return "text-cyan-300 font-medium";

  if (module === "pipeline" || module === "control") return "text-blue-400";

  if (module === "video" || module === "moviepy" || module === "ffmpeg")
    return "text-amber-300";

  if (module === "image editor") return "text-orange-400";
  if (module === "stitcher" || module === "stitch") return "text-indigo-300";

  if (module === "bubbles" || module === "speech bubbles")
    return "text-pink-400";
  if (module === "gui") return "text-neutral-300";
  if (module === "preloader") return "text-neutral-500";
  if (module === "model") return "text-violet-300";
  if (module === "database" || module === "db")
    return "text-emerald-400 font-bold";

  return "text-neutral-400";
}

export function getLogBorderColor(log: LogEntry): string {
  const level = log.level.toUpperCase();
  const module = log.module.toLowerCase();
  const msg = log.message.toLowerCase();

  if (level === "ERROR" || msg.includes("fatal") || msg.includes("error]"))
    return "border-red-500/60";
  if (msg.includes(" 500 ") || msg.includes("-> 500"))
    return "border-red-500/60";
  if (level === "SUCCESS" || msg.includes("successfully"))
    return "border-emerald-500/60";
  if (
    msg.includes(" 200 ") ||
    msg.includes(" 200 ok") ||
    msg.includes("-> 200")
  )
    return "border-emerald-500/60";
  if (level === "WARN" || level === "WARNING" || msg.includes("warning]"))
    return "border-amber-500/60";
  if (
    msg.includes(" 404 ") ||
    msg.includes("-> 404") ||
    msg.includes(" 429 ") ||
    msg.includes("429 too many requests") ||
    msg.includes("-> 429")
  )
    return "border-amber-500/60";

  if (module === "proxy" || module === "api" || module === "network")
    return "border-sky-500/40";

  if (module === "vite") return "border-fuchsia-500/50";

  if (module === "system" || module === "gemini" || module === "ai")
    return "border-purple-500/50";

  if (module === "downloader") return "border-cyan-500/40";
  if (module === "server") return "border-cyan-500/40";

  if (module === "pipeline" || module === "control")
    return "border-blue-500/40";

  if (module === "database" || module === "db") return "border-emerald-500/60";

  return "border-neutral-800";
}
