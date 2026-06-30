import React, { useState, useEffect } from "react";
import {
  Search,
  Bell,
  Cpu,
  Clock,
  ArrowUpRight,
  ChevronRight,
  ExternalLink,
  Shield,
  Activity,
  Zap,
} from "lucide-react";

interface AdminNavbarProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  stats: any;
}

const AdminNavbar: React.FC<AdminNavbarProps> = ({ currentPath, navigateTo, stats }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Helper to format breadcrumbs
  const getBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    return parts.map((part, index) => {
      const path = "/" + parts.slice(0, index + 1).join("/");
      return {
        label: part.charAt(0).toUpperCase() + part.slice(1),
        path,
        active: index === parts.length - 1,
      };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-16 bg-[#070709]/80 backdrop-blur-md border-b border-violet-900/10 sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Left: Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-mono">
        <Shield className="w-4 h-4 text-violet-500 mr-1" />
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.path}>
            {idx > 0 && <ChevronRight className="w-3 h-3 text-neutral-600" />}
            <button
              onClick={() => navigateTo(crumb.path)}
              className={`hover:text-violet-400 transition-colors ${
                crumb.active ? "text-white font-bold" : "text-neutral-500"
              }`}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* Center: Search */}
      <div className="hidden md:flex flex-1 max-w-xl mx-8">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </div>
          <input
            type="text"
            placeholder="Search Command Center... (CMD+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-violet-950/10 border border-violet-900/20 text-xs text-white pl-9 pr-4 py-2 rounded-xl focus:border-violet-500/50 focus:bg-violet-950/20 focus:outline-none transition-all placeholder:text-neutral-600 font-mono shadow-inner"
          />
        </div>
      </div>

      {/* Right: Stats & Actions */}
      <div className="flex items-center gap-6">
        {/* Platform Indicators */}
        <div className="hidden lg:flex items-center gap-4">
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              <Zap className="w-3 h-3 text-amber-500" /> Queue Depth
            </div>
            <div className="text-xs font-bold text-white font-mono">
              {stats.queueDepth || 0} tasks
            </div>
          </div>
          <div className="w-px h-8 bg-violet-900/10" />
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-2 text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
              <Clock className="w-3 h-3 text-emerald-500" /> Uptime
            </div>
            <div className="text-xs font-bold text-white font-mono">
              {stats.uptime || "0h 0m"}
            </div>
          </div>
        </div>

        {/* Global Notifications */}
        <button className="p-2 rounded-xl border border-violet-900/20 text-neutral-400 hover:text-white hover:bg-violet-600/10 transition-all relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border-2 border-[#070709]" />
        </button>

        <div className="w-px h-6 bg-violet-900/20" />

        <button
          onClick={() => navigateTo("/dashboard")}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-violet-500/30 text-violet-400 hover:text-white hover:bg-violet-600 transition-all text-xs font-bold font-mono"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          App
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;
