import React, { useState, useEffect, useRef } from "react";
import { Terminal, RefreshCw, X, ChevronDown, ChevronUp } from "lucide-react";
import * as api from "../../api/index.js";

export function ScraperLogStream() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isMinimized, setIsMinimized] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource(api.getPySystemLogsStreamUrl());

    eventSource.onopen = () => setIsConnected(true);
    eventSource.onmessage = (event) => {
      if (event.data === ": ping") return;
      try {
        const log = JSON.parse(event.data);
        setLogs((prev) => [...prev.slice(-49), log]);
      } catch {}
    };
    eventSource.onerror = () => setIsConnected(false);

    return () => eventSource.close();
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  return (
    <div
      className={`fixed bottom-24 right-6 z-[110] w-80 transition-all duration-500 flex flex-col ${
        isMinimized ? "h-10 opacity-60 hover:opacity-100" : "h-64"
      }`}
    >
      <div
        onClick={() => setIsMinimized(!isMinimized)}
        className={`flex items-center justify-between px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-t-xl cursor-pointer hover:bg-neutral-800 transition-colors ${
          isMinimized ? "rounded-xl shadow-lg" : ""
        }`}
      >
        <div className="flex items-center gap-2">
          <Terminal
            className={`h-3.5 w-3.5 ${
              isConnected ? "text-emerald-400" : "text-neutral-500"
            }`}
          />
          <span className="text-[10px] font-mono font-bold text-white uppercase tracking-wider">
            Live System Stream
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`w-1.5 h-1.5 rounded-full ${
              isConnected
                ? "bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"
                : "bg-neutral-700"
            }`}
          />
          {isMinimized ? (
            <ChevronUp className="h-3 w-3 text-neutral-500" />
          ) : (
            <ChevronDown className="h-3 w-3 text-neutral-500" />
          )}
        </div>
      </div>

      {!isMinimized && (
        <div className="flex-1 bg-[#08080c]/95 border-x border-b border-neutral-800 rounded-b-xl overflow-hidden flex flex-col shadow-2xl backdrop-blur-md">
          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin"
          >
            {logs.length === 0 ? (
              <div className="h-full flex items-center justify-center opacity-20">
                <span className="text-[8px] font-mono text-white">
                  WAITING FOR BACKEND LOGS...
                </span>
              </div>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className="text-[8px] font-mono leading-relaxed border-l-2 border-neutral-800 pl-2 py-0.5"
                >
                  <span className="text-neutral-600 mr-2">[{log.time}]</span>
                  <span
                    className={
                      log.level === "ERROR"
                        ? "text-red-400"
                        : log.level === "WARNING"
                        ? "text-amber-400"
                        : "text-neutral-400"
                    }
                  >
                    {log.message}
                  </span>
                </div>
              ))
            )}
          </div>
          <div className="px-3 py-1.5 bg-neutral-950/80 border-t border-neutral-800 flex justify-between items-center">
            <span className="text-[7px] text-neutral-600 font-mono">
              SSE_TUNNEL: {isConnected ? "ACTIVE" : "OFFLINE"}
            </span>
            <button
              onClick={() => setLogs([])}
              className="text-[7px] text-neutral-500 hover:text-white uppercase font-bold"
            >
              Clear Buffer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

