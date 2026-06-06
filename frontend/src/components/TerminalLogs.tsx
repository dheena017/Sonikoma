import React, { useEffect, useRef } from "react";
import { Terminal, Trash2, Copy, Check, ChevronDown } from "lucide-react";

interface TerminalLogsProps {
  consoleLogs: string[];
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
}

function getTimestamp(): string {
  const now = new Date();
  return now.toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getLogColor(log: string): string {
  // Error states
  if (log.includes("[ERROR]") || log.includes("ERROR]")) return "text-red-400 font-semibold";
  if (log.includes("[FATAL]")) return "text-red-500 font-bold";

  // Success states
  if (log.includes("[SUCCESS]") || log.includes("completed cleanly") || log.includes("Successfully")) return "text-emerald-400 font-medium";

  // Warning states
  if (log.includes("[WARNING]") || log.includes("[WARN]")) return "text-amber-400 font-semibold";

  // AI / Model related
  if (log.includes("[AI Auto-Analysis]") || log.includes("[AI Model]") || log.includes("[Gemini]")) return "text-purple-300 font-medium";
  if (log.includes("[AI Smart Crop]")) return "text-violet-400 font-medium";

  // OCR / Vision
  if (log.includes("[OCR/CV Engine]") || log.includes("[Vision OCR]") || log.includes("[CV")) return "text-purple-300";

  // Scraper
  if (log.includes("[Scraper]")) return "text-cyan-400";

  // Control / Pipeline
  if (log.includes("[Control]") || log.includes("[Pipeline]")) return "text-blue-400";

  // MoviePy / Video
  if (log.includes("[MoviePy]") || log.includes("[Video]") || log.includes("[FFmpeg]")) return "text-amber-300";

  // Image Editor
  if (log.includes("[Image Editor]")) return "text-orange-400";

  // Stitcher
  if (log.includes("[Stitcher]") || log.includes("Combined") || log.includes("[Stitch]")) return "text-indigo-300";

  // Auto Cropper
  if (log.includes("[Auto Cropper]") || log.includes("[Crop]")) return "text-green-400";

  // Speech Bubbles
  if (log.includes("[Speech Bubbles]")) return "text-pink-400";

  // Network / API
  if (log.includes("[API]") || log.includes("[Network]") || log.includes("[HTTP]")) return "text-sky-400";

  // GUI / User actions
  if (log.includes("[GUI]")) return "text-neutral-300";

  // Preloader
  if (log.includes("[Preloader]")) return "text-neutral-500";

  // Model info
  if (log.includes("[Model]")) return "text-violet-300";

  // Database
  if (log.includes("[Database]") || log.includes("[DB]")) return "text-teal-400";

  return "text-neutral-400";
}

function getLogBorderColor(log: string): string {
  if (log.includes("[ERROR]") || log.includes("ERROR]") || log.includes("[FATAL]")) return "border-red-500/60";
  if (log.includes("[SUCCESS]") || log.includes("Successfully")) return "border-emerald-500/60";
  if (log.includes("[WARNING]") || log.includes("[WARN]")) return "border-amber-500/60";
  if (log.includes("[AI") || log.includes("[Gemini]")) return "border-purple-500/50";
  if (log.includes("[Scraper]")) return "border-cyan-500/40";
  if (log.includes("[Control]") || log.includes("[Pipeline]")) return "border-blue-500/40";
  return "border-neutral-800";
}

export default function TerminalLogs({ consoleLogs, setConsoleLogs }: TerminalLogsProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [copied, setCopied] = React.useState(false);
  const [autoScroll, setAutoScroll] = React.useState(true);

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [consoleLogs, autoScroll]);

  const handleCopyAll = () => {
    const allLogs = consoleLogs.join("\n");
    navigator.clipboard.writeText(allLogs).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-3.5">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-purple-400" />
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white">Real-Time Compilation Shell Logs</h3>
              {consoleLogs.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 font-mono font-bold bg-purple-950/60 text-purple-400 rounded border border-purple-800/40">
                  {consoleLogs.length} entries
                </span>
              )}
            </div>
            <p className="text-[10px] text-neutral-400 font-mono">Live background status of parser compiles &amp; AI operations</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Auto-scroll toggle */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`text-[10px] font-mono border px-2 py-1 rounded-lg cursor-pointer flex items-center gap-1 transition-colors ${
              autoScroll
                ? "text-purple-400 border-purple-800/50 bg-purple-950/30 hover:bg-purple-950/50"
                : "text-neutral-500 border-neutral-800/80 bg-neutral-950 hover:bg-neutral-900"
            }`}
            title={autoScroll ? "Auto-scroll enabled" : "Auto-scroll disabled"}
          >
            <ChevronDown className="h-3 w-3" />
            Auto
          </button>
          {/* Copy All */}
          <button
            onClick={handleCopyAll}
            disabled={consoleLogs.length === 0}
            className="text-[10px] text-neutral-400 hover:text-blue-400 font-mono border border-neutral-800/80 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-900 cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy All
              </>
            )}
          </button>
          {/* Clear */}
          <button
            onClick={() => setConsoleLogs([`[GUI] ${getTimestamp()} — Active shell cleared at user prompt.`])}
            className="text-[10px] text-neutral-400 hover:text-red-400 font-mono border border-neutral-800/80 px-2.5 py-1 rounded-lg bg-neutral-950 hover:bg-neutral-900 cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear Logs
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="bg-neutral-950 rounded-xl p-4 border border-neutral-850 h-52 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin"
      >
        {consoleLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
            <Terminal className="h-6 w-6 opacity-40" />
            <p className="text-[11px] font-mono">Waiting for pipeline activity...</p>
            <p className="text-[9px] text-neutral-700">Console logs will appear here when operations start</p>
          </div>
        ) : (
          consoleLogs.map((log, index) => {
            const logColor = getLogColor(log);
            const borderColor = getLogBorderColor(log);

            return (
              <div
                key={index}
                className={`leading-relaxed border-l-2 pl-2 hover:bg-neutral-900/30 rounded-r transition-colors ${logColor} ${borderColor}`}
              >
                <span className="text-neutral-600 mr-1.5 select-none">{String(consoleLogs.length - index).padStart(3, '0')}</span>
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
