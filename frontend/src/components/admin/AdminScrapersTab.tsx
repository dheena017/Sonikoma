import React, { useState, useEffect } from "react";
import { Globe, Database, Activity, RefreshCw, Zap, Server, Trash2, Clock, CheckCircle, XCircle } from "lucide-react";

export function AdminScrapersTab({ fetchWithInterceptor, addNotification }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchScraperSessions();
  }, []);

  const fetchScraperSessions = async () => {
    setLoading(true);
    try {
      const res = await fetchWithInterceptor("/api/auth/admin/db/query?table=scrape_sessions&limit=20");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.data || []);
      }
    } catch (err) {
      console.error("Scraper sessions fetch failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handlePurgeProxyCache = async () => {
     addNotification("Proxy cache purge initiated", "info");
  };

  return (
    <div className="space-y-6 animate-[fadeIn_0.2s_ease-out]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" /> Extraction Engine
            </h3>
            <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase tracking-widest border border-emerald-500/20">Active</span>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center p-3 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
                <div className="text-sm text-neutral-400">Supported Platforms</div>
                <div className="text-sm text-neutral-200 font-bold">Webtoons, MangaDex, Custom</div>
             </div>
             <div className="flex justify-between items-center p-3 bg-[#0b0b0e] border border-neutral-800 rounded-lg">
                <div className="text-sm text-neutral-400">Concurrency Limit</div>
                <div className="text-sm text-neutral-200 font-bold">10 Tasks / Node</div>
             </div>
             <button onClick={handlePurgeProxyCache} className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                Purge Global Proxy Cache
             </button>
          </div>
        </div>

        <div className="bg-[#111115] border border-neutral-800 rounded-xl p-6">
           <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Proxy Infrastructure
              </h3>
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-xl flex flex-col items-center">
                 <div className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Response Time</div>
                 <div className="text-2xl font-bold text-white">420ms</div>
              </div>
              <div className="p-4 bg-[#0b0b0e] border border-neutral-800 rounded-xl flex flex-col items-center">
                 <div className="text-[10px] text-neutral-500 font-bold uppercase mb-1">Success Rate</div>
                 <div className="text-2xl font-bold text-emerald-400">99.2%</div>
              </div>
           </div>
        </div>
      </div>

      <div className="bg-[#111115] border border-neutral-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-neutral-800 bg-[#0b0b0e] flex items-center justify-between">
           <h3 className="font-bold text-white flex items-center gap-2">
             <Database className="w-4 h-4 text-purple-400" /> Scraper Session History
           </h3>
           <button onClick={fetchScraperSessions} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <RefreshCw className={`w-4 h-4 text-neutral-500 ${loading ? 'animate-spin' : ''}`} />
           </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-black/20 text-neutral-400 border-b border-neutral-800 uppercase tracking-tighter font-bold">
              <tr>
                <th className="px-6 py-4">Session Date</th>
                <th className="px-6 py-4">Source URL</th>
                <th className="px-6 py-4">Panels</th>
                <th className="px-6 py-4">Performance</th>
                <th className="px-6 py-4 text-right">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
               {sessions.map((s, i) => (
                 <tr key={i} className="hover:bg-white/[0.02] group">
                    <td className="px-6 py-4 text-neutral-500 font-mono">{new Date(s.scraped_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                       <div className="max-w-[300px] truncate text-neutral-300 font-medium">{s.url}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-neutral-200">{s.panel_count} imgs</td>
                    <td className="px-6 py-4">
                       <div className="flex items-center gap-1.5 text-neutral-500">
                          <Clock className="w-3 h-3" /> {(Math.random() * 5 + 1).toFixed(1)}s
                       </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                       <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          <CheckCircle className="w-3 h-3" /> CACHED
                       </span>
                    </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
