import React, { useState, useEffect } from "react";
import { Server, Activity, Database, Cpu, HardDrive, ShieldCheck, AlertCircle } from "lucide-react";

export function AdminHealthTab({ fetchWithInterceptor }: any) {
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 10000); // Auto-refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchMetrics = async () => {
    try {
      const res = await fetchWithInterceptor("/api/health/metrics");
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error("Failed to fetch health metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-neutral-500">Loading system diagnostics...</div>;
  }

  const memoryPct = metrics?.memory?.systemUsedPct || "0%";
  const cpuPct = metrics?.memory?.cpuPct || 0;

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Core Server */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" /> API Server
            </h3>
            <span className="flex items-center gap-1.5 px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-wider border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" /> Operational
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Uptime</span>
              <span className="text-neutral-200 font-mono">{metrics?.server?.uptime}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">API Version</span>
              <span className="text-neutral-200 font-mono">{metrics?.server?.apiVersion}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Python</span>
              <span className="text-neutral-200 font-mono">{metrics?.server?.pythonVersion}</span>
            </div>
          </div>
        </div>

        {/* Resources */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" /> Resource Load
            </h3>
          </div>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 uppercase tracking-widest font-bold">CPU Usage</span>
                <span className="text-neutral-200">{cpuPct}%</span>
              </div>
              <div className="w-full bg-[#0b0b0e] h-1.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${cpuPct > 80 ? "bg-rose-500" : "bg-purple-500"}`}
                  style={{ width: `${cpuPct}%` }}
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500 uppercase tracking-widest font-bold">Memory (RSS)</span>
                <span className="text-neutral-200">{metrics?.memory?.rssMB} MB</span>
              </div>
              <div className="w-full bg-[#0b0b0e] h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-purple-500 h-full transition-all duration-1000"
                  style={{ width: memoryPct }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Database className="w-5 h-5 text-blue-400" /> Database
            </h3>
            <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded uppercase tracking-wider border border-blue-500/20">
              SQLite 3
            </span>
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Latency</span>
              <span className={`font-mono ${metrics?.database?.dbLatencyMs > 50 ? "text-rose-400" : "text-emerald-400"}`}>
                {metrics?.database?.dbLatencyMs}ms
              </span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Connections</span>
              <span className="text-neutral-200 font-mono">1 Active</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-neutral-500">Integrity</span>
              <span className="text-emerald-400 text-xs font-bold">OK</span>
            </div>
          </div>
        </div>
      </div>

      {/* Storage & Caches */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-amber-400" /> Storage & Cache
          </h3>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {Object.entries(metrics?.cache || {}).map(([name, stats]: any) => (
                <div key={name} className="flex justify-between items-center text-sm">
                  <span className="text-neutral-500 capitalize">{name.replace("_", " ")}</span>
                  <span className="text-neutral-200 font-mono">{stats.items} items</span>
                </div>
              ))}
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-[#0b0b0e] rounded-xl border border-neutral-800">
               <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2">Assets Storage</div>
               <div className="text-2xl font-bold text-white">
                 {Math.round((metrics?.storage?.usedBytes || 0) / 1024 / 1024)} MB
               </div>
               <div className="text-[10px] text-neutral-600 mt-1">
                 of {Math.round((metrics?.storage?.limitBytes || 0) / 1024 / 1024 / 1024)} GB Limit
               </div>
            </div>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <h3 className="font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" /> Pipeline Services
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500" />
                 <span className="text-sm text-neutral-300">Image Scraper</span>
               </div>
               <span className="text-[10px] font-bold text-neutral-500 uppercase">Idle</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-sm text-neutral-300">GPU Inference Worker</span>
               </div>
               <span className="text-[10px] font-bold text-emerald-500 uppercase">Polling</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
               <div className="flex items-center gap-3">
                 <div className="w-2 h-2 rounded-full bg-amber-500" />
                 <span className="text-sm text-neutral-300">Audio Synth (TTS)</span>
               </div>
               <span className="text-[10px] font-bold text-neutral-500 uppercase">Standby</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
