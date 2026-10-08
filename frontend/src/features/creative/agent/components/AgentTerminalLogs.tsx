import React, { useRef, useEffect, useState } from "react";
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { AgentLogMessage } from "../types";

interface AgentTerminalLogsProps {
  logs: AgentLogMessage[];
}

export const AgentTerminalLogs: React.FC<AgentTerminalLogsProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const handleCopyLogs = async () => {
    try {
      const formatted = logs
        .map(
          (l) =>
            `[${new Date(l.timestamp * 1000).toLocaleTimeString()}] [${l.stage.toUpperCase()}] ${l.message}`
        )
        .join("\n");
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard write failed
    }
  };

  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-[#121212] border border-[#2F2F2F] rounded-2xl overflow-hidden shadow-md">
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-[#1A1A1A] border-b border-[#2F2F2F] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80 inline-block" />
          </div>
          <span className="text-xs font-mono text-[#E5E5E5] font-bold flex items-center gap-1.5 pl-2">
            <Terminal className="w-3.5 h-3.5 text-[#3B82F6]" />
            agent_execution.log
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLogs}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525] transition-colors text-xs font-mono flex items-center gap-1 cursor-pointer"
            title="Copy logs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#E5E5E5] hover:bg-[#252525] transition-colors cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Body */}
      {isExpanded && (
        <div
          ref={scrollRef}
          className="p-4 max-h-56 overflow-y-auto font-mono text-xs space-y-1.5 select-text"
        >
          {logs.map((log, index) => {
            const timeStr = new Date(log.timestamp * 1000).toLocaleTimeString();
            let color = "text-neutral-300";
            if (log.level === "success") color = "text-emerald-400";
            if (log.level === "warning") color = "text-amber-400";
            if (log.level === "error") color = "text-rose-400";

            return (
              <div key={index} className="flex items-start gap-2.5 leading-relaxed">
                <span className="text-[10px] text-neutral-600 flex-shrink-0 select-none">
                  [{timeStr}]
                </span>
                <span className="text-[10px] uppercase font-bold text-blue-400/80 bg-blue-950/40 px-1.5 py-0.2 rounded flex-shrink-0 border border-blue-900/40">
                  {log.stage}
                </span>
                <span className={`${color} break-words`}>{log.message}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentTerminalLogs;
