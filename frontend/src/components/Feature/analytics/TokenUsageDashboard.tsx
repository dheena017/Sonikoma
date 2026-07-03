import React, { useState, useEffect } from "react";
import { Coins, Loader2, AlertTriangle, BarChart3 } from "lucide-react";
import * as api from "@/api";

interface TokenLog {
  id: string;
  project_id: string;
  title?: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  estimated_cost_usd: number;
  created_at: string;
}

interface TokenUsageDashboardProps {
  addNotification?: (msg: string, type: any) => void;
}

export default function TokenUsageDashboard({
  addNotification,
}: TokenUsageDashboardProps) {
  const [logs, setLogs] = useState<TokenLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token =
        localStorage.getItem("sonikoma_token") ||
        sessionStorage.getItem("sonikoma_token");
      const res = await fetch("/api/projects/analytics/tokens", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();
      if (data.success && data.token_logs) {
        setLogs(data.token_logs);
      } else {
        throw new Error(data.message || "Failed to load logs");
      }
    } catch (err: any) {
      setError(err.message);
      if (addNotification) addNotification(err.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const totalCost = logs.reduce((sum, log) => sum + log.estimated_cost_usd, 0);
  const totalTokens = logs.reduce((sum, log) => sum + log.total_tokens, 0);

  // Group by project to show aggregated bars
  const projectAggregates = logs.reduce((acc, log) => {
    const key = log.project_id;
    if (!acc[key]) {
      acc[key] = {
        title: log.title || log.project_id.substring(0, 8),
        total_tokens: 0,
        cost: 0,
      };
    }
    acc[key].total_tokens += log.total_tokens;
    acc[key].cost += log.estimated_cost_usd;
    return acc;
  }, {} as Record<string, { title: string; total_tokens: number; cost: number }>);

  const chartData = Object.values(projectAggregates).sort(
    (a, b) => b.total_tokens - a.total_tokens
  );
  const maxTokens = Math.max(...chartData.map((d) => d.total_tokens), 1);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 space-y-6">
      <div className="flex items-center gap-3 border-b border-neutral-800 pb-4">
        <div className="bg-indigo-500/20 p-2 rounded-lg">
          <Coins className="h-5 w-5 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
            API Token Ledger & Costs
          </h3>
          <p className="text-xs text-neutral-400">
            Monitor Gemini API consumption across your projects
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
          <Loader2 className="h-8 w-8 animate-spin mb-3 text-indigo-500" />
          <span className="text-xs font-mono">Loading token ledger...</span>
        </div>
      ) : error ? (
        <div className="bg-red-950/40 border border-red-900/50 p-4 rounded-lg flex items-center gap-3">
          <AlertTriangle className="h-5 w-5 text-red-400" />
          <p className="text-xs text-red-200 font-mono">{error}</p>
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-10 text-neutral-500">
          <BarChart3 className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-xs font-mono">No token usage logged yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg">
              <p className="text-[10px] uppercase text-neutral-500 font-bold mb-1">
                Total Tokens Used
              </p>
              <p className="text-2xl font-black text-indigo-400 font-mono">
                {totalTokens.toLocaleString()}
              </p>
            </div>
            <div className="bg-neutral-950 border border-neutral-850 p-4 rounded-lg">
              <p className="text-[10px] uppercase text-neutral-500 font-bold mb-1">
                Estimated API Cost
              </p>
              <p className="text-2xl font-black text-emerald-400 font-mono">
                ${totalCost.toFixed(4)}
              </p>
            </div>
          </div>

          {/* Bar Chart */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase mb-4 border-b border-neutral-800 pb-2">
              Usage by Project
            </h4>
            <div className="space-y-3">
              {chartData.map((d, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-[10px] font-mono">
                    <span className="text-neutral-300 truncate max-w-[200px]">
                      {d.title}
                    </span>
                    <span className="text-neutral-500">
                      {d.total_tokens.toLocaleString()} tokens ($
                      {d.cost.toFixed(4)})
                    </span>
                  </div>
                  <div className="w-full bg-neutral-950 rounded-full h-2 overflow-hidden border border-neutral-850">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${(d.total_tokens / maxTokens) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Log Table */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase mb-3 border-b border-neutral-800 pb-2">
              Recent Activity
            </h4>
            <div className="overflow-hidden rounded-lg border border-neutral-850">
              <table className="w-full text-left border-collapse text-[10px] font-mono">
                <thead>
                  <tr className="bg-neutral-900 border-b border-neutral-850 text-neutral-500 uppercase">
                    <th className="p-2">Date</th>
                    <th className="p-2">Project</th>
                    <th className="p-2 text-right">Input</th>
                    <th className="p-2 text-right">Output</th>
                    <th className="p-2 text-right">Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-850">
                  {logs.slice(0, 10).map((log, i) => (
                    <tr key={i} className="hover:bg-neutral-900/50">
                      <td className="p-2 text-neutral-400">
                        {new Date(log.created_at).toLocaleDateString()}{" "}
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="p-2 text-neutral-300 truncate max-w-[100px]">
                        {log.title || log.project_id.substring(0, 8)}
                      </td>
                      <td className="p-2 text-right text-indigo-300">
                        {log.input_tokens.toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-purple-300">
                        {log.output_tokens.toLocaleString()}
                      </td>
                      <td className="p-2 text-right text-emerald-400">
                        ${log.estimated_cost_usd.toFixed(4)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {logs.length > 10 && (
                <div className="bg-neutral-900 p-2 text-center text-[10px] text-neutral-500 font-mono">
                  Showing 10 most recent logs out of {logs.length}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
