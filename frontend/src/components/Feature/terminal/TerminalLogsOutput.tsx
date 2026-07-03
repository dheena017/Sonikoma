import React from "react";
import { Terminal } from "lucide-react";
import { LogEntry } from "../../../types/logs";
import { getLogBorderColor, getLogColor, renderParsedLog } from "./utils";

interface TerminalLogsOutputProps {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  filteredLogs: LogEntry[];
  searchQuery: string;
  activeFilter: string;
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
      className="bg-neutral-950 rounded-xl p-4 border border-transparent h-72 md:h-56 overflow-auto font-mono text-[10px] space-y-1.5 scrollbar-thin shadow-inner"
    >
      {filteredLogs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-neutral-600 space-y-2">
          <Terminal className="h-6 w-6 opacity-30 animate-pulse" />
          <p className="text-[11px] font-mono">
            {searchQuery || activeFilter !== "all"
              ? "No search results match query filters"
              : "Waiting for activity..."}
          </p>
          <p className="text-[9px] text-neutral-700">
            {searchQuery || activeFilter !== "all"
              ? "Try clearing the search query or tabs filter"
              : "Logs will print here on active script actions"}
          </p>
        </div>
      ) : (
        [...filteredLogs].reverse().map((log, index) => {
          const logColor = getLogColor(log);
          const borderColor = getLogBorderColor(log);
          const logKey = log.id || `l-${index}-${log.timestamp}`;

          return (
            <div
              key={logKey}
              className={`leading-relaxed border-l-2 pl-2 hover:bg-neutral-900/30 rounded-r transition-colors ${logColor} ${borderColor}`}
            >
              <span className="text-neutral-600 mr-2 select-none w-10 inline-block">
                {log.timestamp}
              </span>
              <span className="text-neutral-500 mr-2 select-none">
                [{log.module}]
              </span>
              {renderParsedLog(log.message)}
            </div>
          );
        })
      )}
    </div>
  );
}
