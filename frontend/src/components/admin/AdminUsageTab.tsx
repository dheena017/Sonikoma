import React, { useState, useEffect } from "react";
import {
  Cpu,
  Coins,
  TrendingUp,
  History,
  Key,
  Activity,
  BarChart,
  Server,
} from "lucide-react";

export function AdminUsageTab({ fetchWithInterceptor, analytics }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const [resLogs, resKeys] = await Promise.all([
        fetchWithInterceptor(
          "/api/auth/admin/db/query?table=token_usage_logs&limit=50"
        ),
        fetchWithInterceptor(
          "/api/auth/admin/db/query?table=user_api_keys&limit=50"
        ),
      ]);

      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.data || []);
      }
      if (resKeys.ok) {
        const data = await resKeys.json();
        setApiKeys(data.data || []);
      }
    } catch (err) {
      console.error("Usage fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const tokenData = analytics?.tokens || { input: 0, output: 0, cost: 0 };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium">LLM Token Input</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {tokenData.input.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">
            Global consumption (Gemini/OpenAI)
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <BarChart className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium">LLM Token Output</h3>
          </div>
          <div className="text-3xl font-bold text-white mb-1">
            {tokenData.output.toLocaleString()}
          </div>
          <div className="text-xs text-neutral-500">
            Generated analysis & scripts
          </div>
        </div>

        <div className="bg-[#111115] border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-400">
              <Coins className="w-5 h-5" />
            </div>
            <h3 className="text-neutral-400 font-medium">Estimated AI Cost</h3>
          </div>
          <div className="text-3xl font-bold text-emerald-400 mb-1">
            ${tokenData.cost.toFixed(4)}
          </div>
          <div className="text-xs text-neutral-500">
            Direct API inference expenses
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-purple-400" /> Recent Usage Logs
            </h3>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-black/20 text-neutral-500 uppercase tracking-widest font-bold border-b border-neutral-800">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/50">
                {logs.map((log, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-neutral-500 font-mono">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-neutral-300 font-mono">
                      {log.project_id.substring(0, 8)}...
                    </td>
                    <td className="px-4 py-3 text-neutral-200">
                      {log.total_tokens}
                    </td>
                    <td className="px-4 py-3 text-emerald-500">
                      ${log.estimated_cost_usd.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex items-center justify-between">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" /> Managed API Keys
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {apiKeys.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">
                No developer keys registered.
              </div>
            ) : (
              apiKeys.map((k, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-[#0b0b0e] border border-neutral-800 rounded-lg group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-amber-500/10 rounded text-amber-500">
                      <Key className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-neutral-200">
                        {k.name}
                      </div>
                      <div className="text-[10px] text-neutral-500 font-mono">
                        User: {k.user_id.substring(0, 8)}...
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-emerald-500 font-bold uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      Active
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
