import React from "react";
import { Coins, Download, RefreshCw, BarChart3 } from "lucide-react";

interface APITokenLedgerAndCostsProps {
  tokenLogs: any[];
  runHistory: any[];
  loadingTokenLogs: boolean;
  tokenLogsError: string | null;
  fetchTokenLogs: () => Promise<void>;
  addNotification: (
    msg: string,
    type: "success" | "info" | "warning" | "error"
  ) => void;
}

export default function APITokenLedgerAndCosts({
  tokenLogs,
  runHistory,
  loadingTokenLogs,
  tokenLogsError,
  fetchTokenLogs,
  addNotification,
}: APITokenLedgerAndCostsProps) {
  return (
    <div className="bg-neutral-950/40 border border-neutral-900 rounded-3xl p-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-24 bg-indigo-650/5 blur-[85px] rounded-full pointer-events-none" />

      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 border border-indigo-500/20 p-2.5 rounded-2xl">
              <Coins className="h-5 w-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                API Token Ledger & Costs
              </h2>
              <p className="text-[10px] text-neutral-500 font-mono mt-0.5">
                Monitor Gemini API consumption across your projects
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(tokenLogs.length > 0 ||
              runHistory.some((r: any) => r.success)) && (
              <button
                onClick={() => {
                  const playgroundLogs = runHistory
                    .filter((r: any) => r.success)
                    .map((r: any, idx: number) => ({
                      id: `playground-${idx}-${r.timestamp}`,
                      project_id: "playground",
                      title: `Playground: ${r.model}`,
                      input_tokens: r.inputTokens || 0,
                      output_tokens: r.outputTokens || 0,
                      total_tokens:
                        (r.inputTokens || 0) + (r.outputTokens || 0),
                      estimated_cost_usd: r.cost || 0,
                      created_at: r.timestamp,
                    }));
                  const fullLedger = [...tokenLogs, ...playgroundLogs].sort(
                    (a: any, b: any) =>
                      new Date(b.created_at).getTime() -
                      new Date(a.created_at).getTime()
                  );
                  const dataStr =
                    "data:text/json;charset=utf-8," +
                    encodeURIComponent(JSON.stringify(fullLedger, null, 2));
                  const downloadAnchor = document.createElement("a");
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute(
                    "download",
                    `api_token_ledger_${
                      new Date().toISOString().split("T")[0]
                    }.json`
                  );
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  addNotification(
                    "Exported API token ledger logs successfully!",
                    "success"
                  );
                }}
                className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-[10px] font-bold text-neutral-450"
                title="Export Ledger logs to JSON"
              >
                <Download className="h-3.5 w-3.5" /> Export Logs
              </button>
            )}
            <button
              onClick={fetchTokenLogs}
              disabled={loadingTokenLogs}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Token Ledger"
            >
              <RefreshCw
                className={`h-4 w-4 text-neutral-450 ${
                  loadingTokenLogs ? "animate-spin text-indigo-400" : ""
                }`}
              />
            </button>
          </div>
        </div>

        {loadingTokenLogs ? (
          <div className="flex flex-col items-center justify-center py-12 text-neutral-500 font-mono text-xs">
            <RefreshCw className="h-8 w-8 animate-spin mb-3 text-indigo-555" />
            <span>Loading token ledger...</span>
          </div>
        ) : (
          (() => {
            const combinedLogs = [
              ...tokenLogs,
              ...runHistory
                .filter((r: any) => r.success)
                .map((r: any, idx: number) => ({
                  id: `playground-${idx}-${r.timestamp}`,
                  project_id: "playground",
                  title: `Playground: ${r.model}`,
                  input_tokens: r.inputTokens || 0,
                  output_tokens: r.outputTokens || 0,
                  total_tokens: (r.inputTokens || 0) + (r.outputTokens || 0),
                  estimated_cost_usd: r.cost || 0,
                  created_at: r.timestamp,
                })),
            ].sort(
              (a: any, b: any) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
            );

            if (combinedLogs.length === 0) {
              return (
                <div className="flex flex-col items-center justify-center py-16 text-neutral-600 font-mono text-xs text-center">
                  <BarChart3 className="h-12 w-12 mb-3 text-neutral-850 stroke-[1.5]" />
                  <p className="font-bold text-neutral-500">
                    No token usage logged yet.
                  </p>
                </div>
              );
            }

            return (
              <div className="space-y-6 font-mono text-xs">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-2xl relative overflow-hidden">
                    <p className="text-[9px] uppercase text-neutral-500 font-bold mb-1">
                      Total Tokens Used
                    </p>
                    <p className="text-2xl font-black text-indigo-400">
                      {combinedLogs
                        .reduce((sum, log) => sum + log.total_tokens, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-neutral-900/30 border border-neutral-900 p-4 rounded-2xl relative overflow-hidden">
                    <p className="text-[9px] uppercase text-neutral-500 font-bold mb-1">
                      Estimated API Cost
                    </p>
                    <p className="text-2xl font-black text-emerald-400">
                      $
                      {combinedLogs
                        .reduce((sum, log) => sum + log.estimated_cost_usd, 0)
                        .toFixed(4)}
                    </p>
                  </div>
                </div>

                {/* Breakdown Bar Chart */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-900 pb-2">
                    Usage by Project
                  </h3>
                  <div className="space-y-3">
                    {(() => {
                      const projectAggregates = combinedLogs.reduce(
                        (acc, log) => {
                          const key = log.project_id;
                          if (!acc[key]) {
                            acc[key] = {
                              title:
                                log.title || log.project_id.substring(0, 8),
                              total_tokens: 0,
                              cost: 0,
                            };
                          }
                          acc[key].total_tokens += log.total_tokens;
                          acc[key].cost += log.estimated_cost_usd;
                          return acc;
                        },
                        {} as Record<
                          string,
                          { title: string; total_tokens: number; cost: number }
                        >
                      );

                      const chartData = Object.keys(projectAggregates)
                        .map((key) => projectAggregates[key])
                        .sort((a, b) => b.total_tokens - a.total_tokens);
                      const maxTokens = Math.max(
                        ...chartData.map((d) => d.total_tokens),
                        1
                      );

                      return chartData.map((d, i) => (
                        <div key={i} className="space-y-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-neutral-350 truncate max-w-[250px] font-bold">
                              {d.title}
                            </span>
                            <span className="text-neutral-500 font-bold">
                              {d.total_tokens.toLocaleString()} tokens ($
                              {d.cost.toFixed(4)})
                            </span>
                          </div>
                          <div className="w-full bg-neutral-950 border border-neutral-900 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                              style={{
                                width: `${(d.total_tokens / maxTokens) * 100}%`,
                              }}
                            />
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>

                {/* Detailed Log Table */}
                <div className="space-y-3">
                  <h3 className="text-[10px] font-bold text-neutral-450 uppercase tracking-wider border-b border-neutral-900 pb-2">
                    Recent Activity Ledger
                  </h3>
                  <div className="border border-neutral-900 rounded-2xl overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead>
                        <tr className="bg-neutral-900 border-b border-neutral-850 text-neutral-500 font-bold uppercase text-[8px] tracking-wider sticky top-0 z-[5]">
                          <th className="p-3">Date</th>
                          <th className="p-3">Project / Chapter</th>
                          <th className="p-3 text-right">Input Tokens</th>
                          <th className="p-3 text-right">Output Tokens</th>
                          <th className="p-3 text-right">Total Tokens</th>
                          <th className="p-3 text-right">Est. Cost</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinedLogs.map((log, idx) => (
                          <tr
                            key={idx}
                            className="border-b border-neutral-900/60 hover:bg-neutral-900/10 transition-all"
                          >
                            <td className="p-3 text-neutral-500 whitespace-nowrap">
                              {new Date(log.created_at).toLocaleDateString()}{" "}
                              {new Date(log.created_at).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td
                              className="p-3 text-white font-bold max-w-[180px] truncate"
                              title={log.title || log.project_id}
                            >
                              {log.title || log.project_id.substring(0, 8)}
                            </td>
                            <td className="p-3 text-right text-indigo-300 font-bold">
                              {log.input_tokens.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-purple-300 font-bold">
                              {log.output_tokens.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-cyan-300 font-bold">
                              {log.total_tokens.toLocaleString()}
                            </td>
                            <td className="p-3 text-right text-emerald-455 font-bold">
                              ${log.estimated_cost_usd.toFixed(4)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()
        )}
      </div>
    </div>
  );
}
