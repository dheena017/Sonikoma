import React, { useState, useEffect } from "react";
import { Search, Bell, Clock, ExternalLink, Shield, Zap, Menu } from "lucide-react";
import * as api from "@/api";

interface AdminHeaderPageProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
  onToggleSidebar?: () => void; // Added to trigger the sidebar from the header
}

interface AdminStats {
  users: number;
  projects: number;
  scenes: number;
  memory: string;
  dbLatencyMs: number;
  gpuWorkers: {
    total: number;
    busy: number;
    idle: number;
  };
  uptime: string;
  cpuPct: number;
  queueDepth: number;
}

const AdminHeaderPage: React.FC<AdminHeaderPageProps> = ({
  currentPath,
  navigateTo,
  fetchWithInterceptor,
  onToggleSidebar,
}) => {
  const [stats, setStats] = useState<AdminStats>({
    users: 0,
    projects: 0,
    scenes: 0,
    memory: "0MB",
    dbLatencyMs: 0,
    gpuWorkers: { total: 0, busy: 0, idle: 0 },
    uptime: "",
    cpuPct: 0,
    queueDepth: 0,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  const fetchStats = async () => {
    try {
      setIsLoadingStats(true);
      const data = await api.getMetrics(fetchWithInterceptor);
      setStats({
        users: data.database?.users || 0,
        projects: data.database?.projects || 0,
        scenes: data.database?.scenes || 0,
        memory: `${data.memory?.rssMB || 0}MB`,
        dbLatencyMs: data.database?.dbLatencyMs || 0,
        gpuWorkers: data.database?.gpuWorkers || { total: 0, busy: 0, idle: 0 },
        uptime: data.server?.uptime || "",
        cpuPct: data.memory?.cpuPct || 0,
        queueDepth: data.database?.activeJobs || 0,
      });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      {/* PREMIUM HEADER FIX: 
        1. Changed 'sticky top-16' to 'fixed top-0'
        2. Added glassmorphism (backdrop-blur-md)
        3. Removed horizontal padding (px-8) and replaced it with pr-6 so left edge is flush 
      */}
      <header className="h-16 bg-[#0a0a0e]/90 backdrop-blur-md border-b border-violet-900/20 fixed top-0 left-0 w-full z-50 flex items-center justify-between pr-6 md:pr-8">
        
        {/* Left side: Hamburger and Brand */}
        <div className="flex items-center shrink-0">
          {/* Exactly w-20 to perfectly align with the MiniSidebar below it */}
          <div className="w-auto lg:w-20 flex items-center justify-center shrink-0 pl-4 lg:pl-0">
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white cursor-pointer transition-colors"
              title="Toggle Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigateTo("/admin")}>
            <div className="p-1.5 bg-violet-600 rounded-lg shadow-lg shadow-violet-600/30">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-white tracking-tight block leading-none text-sm">Command</span>
              <span className="text-[9px] text-violet-400 font-mono uppercase tracking-widest block mt-0.5 leading-none">Center</span>
            </div>
          </div>
        </div>

        {/* Right side: Quick actions */}
        <div className="flex items-center gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-neutral-200 placeholder:text-neutral-600 focus:outline-none focus:border-violet-500/50 w-48 transition-all focus:w-64"
            />
          </div>

          <div className="hidden md:flex items-center gap-3 text-xs bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 text-green-500" />
              <span className="text-neutral-400 font-mono">{stats.cpuPct}%</span>
            </div>
            <div className="w-px h-3 bg-neutral-800" />
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-blue-500" />
              <span className="text-neutral-400 font-mono">{stats.dbLatencyMs}ms</span>
            </div>
          </div>

          <button className="p-2 rounded-lg bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800 text-neutral-400 hover:text-white transition-colors cursor-pointer">
            <Bell className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* --- Rest of your Stats overview grid stays exactly the same --- */}
      {/* Add a pt-16 margin here so the fixed header doesn't cover your stats */}
      <div className="pt-16 space-y-6">
         {/* ... Include your existing Stats Grid and Health Details here ... */}
      </div>
    </div>
  );
};

export default AdminHeaderPage;
