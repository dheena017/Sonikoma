import React, { useRef, useEffect } from "react";
import { Terminal, Trash2, Copy, Sparkles } from "lucide-react";

interface TerminalLogsProps {
  consoleLogs: string[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

/** Generates a HH:MM:SS timestamp string for the current moment. */
function getTimestamp(): string {
  const now = new Date();
  return [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

/** Returns Tailwind classes + optional border-accent for a given log line. */
function getLogStyle(log: string): { text: string; border: string; icon?: string } {
  // — Errors (highest priority)
  if (log.startsWith("[ERROR]"))
    return { text: "text-red-400 font-semibold", border: "border-red-500/60" };

  // — Warnings
  if (log.startsWith("[WARNING]"))
    return { text: "text-amber-400 font-bold", border: "border-amber-500/60" };

  // — Success / completion
  if (log.startsWith("[SUCCESS]") || log.includes("completed cleanly"))
    return { text: "text-emerald-400 font-medium", border: "border-emerald-500/50" };

  // — Scraper
  if (log.startsWith("[Scraper]"))
    return { text: "text-cyan-400", border: "border-cyan-500/40" };

  // — Control
  if (log.startsWith("[Control]"))
    return { text: "text-blue-400", border: "border-blue-500/40" };

  // — MoviePy
  if (log.startsWith("[MoviePy]"))
    return { text: "text-amber-300", border: "border-amber-400/40" };

  // — Vision OCR / OCR CV Engine
  if (log.startsWith("[Vision OCR]") || log.startsWith("[OCR/CV Engine]"))
    return { text: "text-indigo-400", border: "border-indigo-500/40" };

  // — Image Editor
  if (log.startsWith("[Image Editor]"))
    return { text: "text-orange-400", border: "border-orange-500/40" };

  // — Stitcher
  if (log.startsWith("[Stitcher]") || log.startsWith("[STITCH]") || log.includes("Combined"))
    return { text: "text-indigo-300", border: "border-indigo-400/40" };

  // — Auto Cropper
  if (log.startsWith("[Auto Cropper]"))
    return { text: "text-green-400", border: "border-green-500/40" };

  // — Speech Bubbles
  if (log.startsWith("[Speech Bubbles]"))
    return { text: "text-pink-400", border: "border-pink-500/40" };

  // — AI Auto-Analysis (sparkle treatment applied via icon below)
  if (log.startsWith("[AI Auto-Analysis]"))
    return { text: "text-purple-400 font-medium", border: "border-purple-500/50", icon: "sparkle" };

  // — SCIME (legacy)
  if (log.startsWith("[SCIME]"))
    return { text: "text-purple-300", border: "border-purple-400/40" };

  // — Preloader
  if (log.startsWith("[Preloader]"))
    return { text: "text-neutral-500", border: "border-neutral-700" };

  // — GUI
  if (log.startsWith("[GUI]"))
    return { text: "text-neutral-300", border: "border-neutral-700" };

  // — Default
  return { text: "text-neutral-400", border: "border-neutral-800" };
}

export default function TerminalLogs({ consoleLogs, setConsoleLogs }: TerminalLogsProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const timestampCache = useRef<Map<number, string>>(new Map());

  // Auto-scroll to bottom whenever new logs arrive
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [consoleLogs.length]);

  // Stable timestamp per log index – assigned once when a log entry first appears
  const getStableTimestamp = (index: number): string => {
    if (!timestampCache.current.has(index)) {
      timestampCache.current.set(index, getTimestamp());
    }
    return timestampCache.current.get(index)!;
  };

  // Reset timestamp cache when logs are cleared (length shrinks)
  useEffect(() => {
    if (consoleLogs.length <= 1) {
      timestampCache.current.clear();
    }
  }, [consoleLogs.length]);

  const handleCopyAll = async () => {
    const allText = consoleLogs.join("\n");
    try {
      await navigator.clipboard.writeText(allText);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = allText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5">
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-purple-400" />
          <div>
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              Real-Time Compilation Shell Logs
              {consoleLogs.length > 0 && (
                <span className="text-[9px] font-mono font-normal bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded-full">
                  {consoleLogs.length}
                </span>
              )}
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono">Live background status of parser compiles</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy All */}
          <button
            onClick={handleCopyAll}
            disabled={consoleLogs.length === 0}
            className="text-[10px] text-neutral-400 hover:text-blue-400 font-mono border border-neutral-800/80 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-900 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Copy className="h-3 w-3" />
            Copy All
          </button>

          {/* Clear Logs */}
          <button
            onClick={() => {
              timestampCache.current.clear();
              setConsoleLogs(["[GUI] Active shell cleared at user prompt."]);
            }}
            className="text-[10px] text-neutral-400 hover:text-red-400 font-mono border border-neutral-800/80 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-900 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear Logs
          </button>
        </div>
      </div>

      {/* Log Output Area — always visible */}
      <div
        ref={scrollRef}
        className="bg-neutral-950 rounded-xl p-4 border border-neutral-850 h-52 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin"
      >
        {consoleLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600 select-none gap-1.5">
            <Terminal className="h-5 w-5 opacity-40" />
            <span className="text-[11px]">No logs yet — waiting for activity…</span>
          </div>
        ) : (
          consoleLogs.map((log, index) => {
            const style = getLogStyle(log);
            const ts = getStableTimestamp(index);

            return (
              <div
                key={index}
                className={`leading-relaxed border-l-2 pl-2 hover:border-purple-500/50 transition-colors ${style.border} ${style.text}`}
              >
                <span className="text-neutral-600 select-none mr-1.5">{ts}</span>
                {style.icon === "sparkle" && (
                  <Sparkles className="inline h-2.5 w-2.5 mr-1 text-purple-400 animate-pulse" />
                )}
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
