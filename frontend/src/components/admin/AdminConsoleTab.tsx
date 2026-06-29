import React, { useState, useEffect, useRef } from "react";
import { Terminal, Trash2, Download, Pause, Play, Search, Filter } from "lucide-react";

export function AdminConsoleTab() {
  const [logs, setLogs] = useState<any[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");
  const scrollRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    let ev: EventSource | null = null;
    let reconnectTimeout: any = null;

    const connect = () => {
      if (ev) ev.close();
      ev = new EventSource("/api/health/system-logs/stream");

      ev.onmessage = (event) => {
        if (isPaused) return;
        try {
          const log = JSON.parse(event.data);
          setLogs((prev) => [...prev, log].slice(-500)); // Keep last 500 lines
        } catch (err) {
          // Heartbeats or malformed JSON
        }
      };

      ev.onerror = () => {
        if (ev) ev.close();
        reconnectTimeout = setTimeout(connect, 3000); // Reconnect
      };

      eventSourceRef.current = ev;
    };

    connect();

    return () => {
      if (ev) ev.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      eventSourceRef.current = null;
    };
  }, [isPaused]);

  useEffect(() => {
    if (!isPaused && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isPaused]);

  const filteredLogs = logs.filter((log) => {
    const matchesFilter = log.message?.toLowerCase().includes(filter.toLowerCase());
    const matchesLevel = levelFilter === "ALL" || log.level === levelFilter;
    return matchesFilter && matchesLevel;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case "ERROR": return "text-red-400";
      case "WARNING": return "text-amber-400";
      case "DEBUG": return "text-blue-400";
      default: return "text-emerald-400";
    }
  };

  return (
    <div className="flex flex-col h-[700px] bg-[#0b0b0e] border border-neutral-800 rounded-xl overflow-hidden animate-[fadeIn_0.2s_ease-out]">
      {/* Header */}
      <div className="p-4 border-b border-neutral-800 bg-[#111115] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white leading-tight">System Console</h3>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold">Real-time Service Logs</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-500" />
            <input
              type="text"
              placeholder="Filter logs..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-[#0b0b0e] border border-neutral-800 text-xs text-neutral-300 rounded-lg pl-9 pr-4 py-2 focus:outline-none focus:border-purple-500/50 w-48"
            />
          </div>

          <select
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value)}
            className="bg-[#0b0b0e] border border-neutral-800 text-xs text-neutral-300 rounded-lg px-3 py-2 focus:outline-none focus:border-purple-500/50"
          >
            <option value="ALL">All Levels</option>
            <option value="INFO">Info</option>
            <option value="WARNING">Warning</option>
            <option value="ERROR">Error</option>
            <option value="DEBUG">Debug</option>
          </select>

          <div className="h-6 w-px bg-neutral-800 mx-2" />

          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`p-2 rounded-lg transition-colors ${isPaused ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20" : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"}`}
            title={isPaused ? "Resume" : "Pause"}
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setLogs([])}
            className="p-2 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 rounded-lg transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              const text = logs.map(l => `[${l.timestamp}] [${l.level}] ${l.logger}: ${l.message}`).join("\n");
              const blob = new Blob([text], { type: "text/plain" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `system_logs_${new Date().toISOString()}.txt`;
              a.click();
            }}
            className="p-2 bg-neutral-800 text-neutral-400 hover:bg-neutral-700 rounded-lg transition-colors"
            title="Download Logs"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-auto p-4 font-mono text-[13px] selection:bg-purple-500/30 whitespace-pre"
      >
        {filteredLogs.length === 0 ? (
          <div className="h-full flex items-center justify-center text-neutral-600 italic">
            {isPaused ? "Console paused. Resume to see new entries." : "Waiting for incoming logs..."}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredLogs.map((log, i) => (
              <div key={i} className="flex gap-4 group">
                <span className="text-neutral-600 shrink-0 select-none">
                  [{new Date(log.timestamp * 1000).toLocaleTimeString()}]
                </span>
                <span className={`font-bold shrink-0 w-16 select-none ${getLevelColor(log.level)}`}>
                  {log.level}
                </span>
                <span className="text-neutral-500 shrink-0 w-24 truncate select-none" title={log.logger}>
                  {log.logger}
                </span>
                <span className="text-neutral-300 break-all">
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="px-4 py-2 bg-[#111115] border-t border-neutral-800 flex items-center justify-between text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isPaused ? "bg-amber-500" : "bg-emerald-500 animate-pulse"}`} />
            {isPaused ? "Paused" : "Live Streaming"}
          </span>
          <span>Showing {filteredLogs.length} of {logs.length} cached lines</span>
        </div>
        <div>
          Auto-scroll Enabled
        </div>
      </div>
    </div>
  );
}
