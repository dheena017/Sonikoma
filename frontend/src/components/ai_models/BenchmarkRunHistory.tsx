import React from "react";
import { History, Download } from "lucide-react";

interface BenchmarkRunHistoryProps {
  runHistory: any[];
  totalRuns: number;
  avgLatency: number;
  totalCost: number;
  totalTokens: number;
  clearHistory: () => void;
  exportRunHistory: () => void;
}

export default function BenchmarkRunHistory({
  runHistory,
  totalRuns,
  avgLatency,
  totalCost,
  totalTokens,
  clearHistory,
  exportRunHistory,
}: BenchmarkRunHistoryProps) {
  return (
    <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-3">
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="h-4 w-4 text-purple-400" />
              Benchmark Run Metrics & History
            </h2>
            <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
              Analyze session activity logs, prompt runs, estimated API expenditure, and latency averages.
            </p>
          </div>
          {runHistory.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={exportRunHistory}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-450 border border-neutral-800 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5"
                title="Export Run History to JSON"
              >
                <Download className="h-3.5 w-3.5" /> Export History
              </button>
              <button
                onClick={clearHistory}
                className="px-3 py-1.5 bg-neutral-900 hover:bg-rose-500/10 text-neutral-400 hover:text-rose-455 border border-neutral-800 hover:border-rose-500/20 rounded-xl text-[10px] font-mono font-bold transition-all cursor-pointer"
              >
                Clear History
              </button>
            </div>
          )}
        </div>

        {/* Session Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Runs", val: totalRuns, sub: "Single + Sandbox runs", color: "text-purple-400" },
            { label: "Avg Latency", val: `${avgLatency.toLocaleString()} ms`, sub: "Successful runs only", color: "text-cyan-400" },
            { label: "Est. Spend (USD)", val: `$${totalCost.toFixed(5)}`, sub: "Based on token pricing", color: "text-emerald-450" },
            { label: "Total Tokens", val: totalTokens.toLocaleString(), sub: "Input + Output volume", color: "text-amber-400" },
          ].map((stat, i) => (
            <div key={i} className="p-4 bg-neutral-900/30 border border-neutral-900 rounded-2xl font-mono text-center">
              <span className="text-[9px] text-neutral-500 block uppercase font-bold">{stat.label}</span>
              <span className={`text-lg font-bold block mt-1.5 ${stat.color}`}>{stat.val}</span>
              <span className="text-[8px] text-neutral-600 block mt-1">{stat.sub}</span>
            </div>
          ))}
        </div>

        {/* Run History List */}
        <div className="space-y-3">
          <h3 className="text-xs font-mono font-bold text-neutral-400 uppercase tracking-wider">
            Recent Queries Log
          </h3>
          {runHistory.length === 0 ? (
            <div className="p-6 bg-neutral-900/10 border border-neutral-900 border-dashed rounded-2xl text-center text-neutral-500 text-xs font-mono">
              No query history recorded yet. Run a latency test or execute a skill above.
            </div>
          ) : (
            <div className="border border-neutral-900 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
              <table className="w-full text-left font-mono text-[10px] border-collapse">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-850 text-neutral-500 font-bold uppercase text-[8px] tracking-wider sticky top-0 z-[5]">
                    <th className="p-3">Timestamp</th>
                    <th className="p-3">Model/Skill</th>
                    <th className="p-3">Inputs / Prompt</th>
                    <th className="p-3">Metrics</th>
                    <th className="p-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {runHistory.map((log, idx) => (
                    <tr key={idx} className="border-b border-neutral-900/60 hover:bg-neutral-900/10 transition-all">
                      <td className="p-3 text-neutral-500 whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </td>
                      <td className="p-3 text-white font-bold max-w-[150px] truncate" title={log.model}>
                        {log.model}
                      </td>
                      <td className="p-3 text-neutral-400 max-w-[280px] truncate" title={log.prompt}>
                        {log.prompt}
                      </td>
                      <td className="p-3 text-neutral-400 whitespace-nowrap">
                        {log.success ? (
                          <span>{log.latencyMs}ms | {log.inputTokens + log.outputTokens} tok | ${log.cost.toFixed(5)}</span>
                        ) : (
                          <span className="text-rose-500 truncate max-w-[150px] block" title={log.error}>{log.error || "Failed"}</span>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                          log.success
                            ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/30"
                            : "bg-rose-950/40 text-rose-400 border border-rose-900/30"
                        }`}>
                          {log.success ? "Success" : "Error"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
