import React, { useState } from "react";
import {
  Search,
  Bell,
  Clock,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";

interface AdminNavbarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  stats: any;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ navigateTo, stats }) => {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="h-16 bg-[#070709] border-b border-white/5 sticky top-0 z-40 px-8 flex items-center justify-between">
      {/* Left: Admin Label */}
      <div className="flex items-center gap-3 shrink-0">
        <Shield className="w-5 h-5 text-violet-500 fill-violet-500/10" />
        <span className="text-sm font-bold text-white font-mono tracking-tight">Admin</span>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-2xl mx-12">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-600" />
          </div>
          <input
            type="text"
            placeholder="Search Command Center... (CMD+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#0d0d12] border border-white/10 text-xs text-neutral-300 pl-11 pr-4 py-2.5 rounded-xl focus:border-violet-500/30 focus:bg-[#111118] focus:outline-none transition-all placeholder:text-neutral-700 font-mono shadow-inner"
          />
        </div>
      </div>

      {/* Right: Stats & Actions */}
      <div className="flex items-center gap-8 shrink-0">
        {/* Platform Indicators */}
        <div className="flex items-center gap-10">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              <Zap className="w-3 h-3 text-amber-500 fill-amber-500/20" /> Queue Depth
            </div>
            <div className="text-xs font-black text-white font-mono leading-tight">
              {stats.queueDepth || 0} tasks
            </div>
          </div>

          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono">
              <Clock className="w-3 h-3 text-emerald-500" /> Uptime
            </div>
            <div className="text-xs font-black text-white font-mono leading-tight">
              {stats.uptime || "0h 0m 0s"}
            </div>
          </div>
        </div>

        {/* Notifications */}
        <button className="p-2.5 rounded-xl bg-[#0d0d12] border border-white/10 text-neutral-400 hover:text-white transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#070709]" />
        </button>

        <div className="w-px h-6 bg-white/10" />

        {/* App Bridge */}
        <button
          onClick={() => navigateTo("/dashboard")}
          className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-[#0d0d12] border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 transition-all text-xs font-black font-mono"
        >
          <ExternalLink className="w-4 h-4" />
          App
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;
