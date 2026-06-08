import React from "react";
import { Terminal } from "lucide-react";

interface TerminalLogsOutputProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  filteredLogs: string[];
  searchQuery: string;
  activeFilter: string;
}

function getLogColor(log: string): string {
  if (log.includes("[ERROR]") || log.includes("ERROR]") || log.includes("[Error]") || log.includes("Error]")) return "text-red-400 font-semibold";
  if (log.includes("[FATAL]")) return "text-red-500 font-bold";
  if (log.includes("[SUCCESS]") || log.includes("completed cleanly") || log.includes("Successfully")) return "text-emerald-400 font-medium";
  if (log.includes("[WARNING]") || log.includes("[WARN]") || log.includes("[Warning]") || log.includes("Warning]")) return "text-amber-400 font-semibold";
  if (log.includes("[AI Auto-Analysis]") || log.includes("[AI Model]") || log.includes("[Gemini]")) return "text-purple-300 font-medium";
  if (log.includes("[AI Smart Crop]")) return "text-violet-400 font-medium";
  if (log.includes("[OCR/CV Engine]") || log.includes("[Vision OCR]") || log.includes("[CV")) return "text-purple-300";
  if (log.includes("[Helper Scraper]")) return "text-cyan-300 font-medium";
  if (log.includes("[Scraper]")) return "text-cyan-400";
  if (log.includes("[Server]")) return "text-cyan-300 font-medium";
  if (log.includes("HUGGINGFACE") || log.includes("injected env") || log.includes("No HUGGINGFACE_API_KEY")) return "text-amber-300";
  if (log.includes("[Control]") || log.includes("[Pipeline]")) return "text-blue-400";
  if (log.includes("[MoviePy]") || log.includes("[Video]") || log.includes("[FFmpeg]")) return "text-amber-300";
  if (log.includes("[Image Editor]")) return "text-orange-400";
  if (log.includes("[Stitcher]") || log.includes("Combined") || log.includes("[Stitch]")) return "text-indigo-300";
  if (log.includes("[Auto Cropper]") || log.includes("[Crop]")) return "text-green-400";
  if (log.includes("[Speech Bubbles]")) return "text-pink-400";
  if (log.includes("[API]") || log.includes("[Network]") || log.includes("[HTTP]")) return "text-sky-400";
  if (log.includes("[GUI]")) return "text-neutral-300";
  if (log.includes("[Preloader]")) return "text-neutral-500";
  if (log.includes("[Model]")) return "text-violet-300";
  if (log.includes("[Database]") || log.includes("[DB]")) return "text-emerald-400 font-bold";
  return "text-neutral-400";
}

function getLogBorderColor(log: string): string {
  if (log.includes("[ERROR]") || log.includes("ERROR]") || log.includes("[Error]") || log.includes("Error]") || log.includes("[FATAL]")) return "border-red-500/60";
  if (log.includes("[SUCCESS]") || log.includes("Successfully")) return "border-emerald-500/60";
  if (log.includes("[WARNING]") || log.includes("[WARN]") || log.includes("[Warning]") || log.includes("Warning]")) return "border-amber-500/60";
  if (log.includes("[AI") || log.includes("[Gemini]")) return "border-purple-500/50";
  if (log.includes("[Helper Scraper]")) return "border-cyan-400/40";
  if (log.includes("[Scraper]")) return "border-cyan-500/40";
  if (log.includes("[Server]")) return "border-cyan-500/40";
  if (log.includes("HUGGINGFACE") || log.includes("injected env") || log.includes("No HUGGINGFACE_API_KEY")) return "border-amber-500/40";
  if (log.includes("[Control]") || log.includes("[Pipeline]")) return "border-blue-500/40";
  if (log.includes("[Database]") || log.includes("[DB]")) return "border-emerald-500/60";
  return "border-neutral-800";
}

export function TerminalLogsOutput({
  scrollRef,
  filteredLogs,
  searchQuery,
  activeFilter,
}: TerminalLogsOutputProps) {
  return (
    <div
      ref={scrollRef}
      className="bg-neutral-950 rounded-xl p-4 border border-transparent h-56 overflow-y-auto font-mono text-[10px] space-y-1.5 scrollbar-thin shadow-inner"
    >
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
          <Terminal className="h-6 w-6 opacity-30 animate-pulse" />
          <p className="text-[11px] font-mono">
            {searchQuery || activeFilter !== "all" ? "No search results match query filters" : "Waiting for pipeline activity..."}
          </p>
          <p className="text-[9px] text-neutral-700">
            {searchQuery || activeFilter !== "all" ? "Try clearing the search query or tabs filter" : "Logs will print here on active script actions"}
          </p>
        </div>
      ) : (
        filteredLogs.map((log, index) => {
          const logColor = getLogColor(log);
          const borderColor = getLogBorderColor(log);

          return (
            <div
              key={index}
              className={`leading-relaxed border-l-2 pl-2 hover:bg-neutral-900/30 rounded-r transition-colors ${logColor} ${borderColor}`}
            >
              <span className="text-neutral-600 mr-2 select-none">
                {String(filteredLogs.length - index).padStart(3, '0')}
              </span>
              {log}
            </div>
          );
        })
      )}
    </div>
  );
}
