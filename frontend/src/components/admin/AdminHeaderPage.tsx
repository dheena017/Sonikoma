import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  BellOff,
  Shield,
  Zap,
  Menu,
  Cpu,
  Database,
  Activity,
  Settings,
  Volume2,
  VolumeX,
} from "lucide-react";
import * as api from "@/api";
import NotificationDropdown from "../notification/NotificationDropdown";

export interface AdminHeaderPageProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor: any;
  onToggleSidebar?: () => void;
  notifications?: any[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  isSidebarOpen?: boolean;
}

const AdminHeaderPage: React.FC<AdminHeaderPageProps> = ({
  currentPath,
  navigateTo,
  fetchWithInterceptor,
  onToggleSidebar,
  notifications = [],
  markNotificationAsRead = () => {},
  markAllNotificationsAsRead = () => {},
  deleteNotification = () => {},
  clearAllNotifications = () => {},
  notificationsMuted = false,
  setNotificationsMuted,
  isSidebarOpen = false,
}) => {
  const [stats, setStats] = useState<any>({
    cpu: 0,
    memory: "0MB",
    dbLatency: 0,
    gpu: { total: 0, busy: 0, idle: 0 },
    uptime: "",
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTelemetryPopover, setShowTelemetryPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchStats = async () => {
    try {
      const data = await api.getMetrics(fetchWithInterceptor);
      setStats({
        cpu: data.memory?.cpuPct || 0,
        memory: `${data.memory?.rssMB || 0}MB`,
        dbLatency: data.database?.dbLatencyMs || 0,
        gpu: data.database?.gpuWorkers || { total: 0, busy: 0, idle: 0 },
        uptime: data.server?.uptime || "",
      });
    } catch (err) {
      console.error("Failed to fetch header stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (telemetryRef.current && !telemetryRef.current.contains(target)) {
        setShowTelemetryPopover(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const quickNavItems = [
    { label: "Dashboard", path: "/admin", keyword: "home index dashboard overview" },
    { label: "Announcements", path: "/admin/announcements", keyword: "announcements broadcast email message" },
    { label: "User Accounts", path: "/admin/users", keyword: "users accounts creators login" },
    { label: "Scrapers Configuration", path: "/admin/scrapers", keyword: "scrapers webtoon scraping episode" },
    { label: "System settings", path: "/admin/settings", keyword: "settings parameters config reset cache" },
    { label: "Database Explorer", path: "/admin/explorer", keyword: "database query table explorer sql" },
    { label: "System Health", path: "/admin/health", keyword: "health server uptime cpu memory latency" },
    { label: "Audit Logs", path: "/admin/activity", keyword: "audit logs security activity actions" },
    { label: "Interactive Console", path: "/admin/console", keyword: "console terminal prompt execute" },
  ];

  const filteredNavItems = quickNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="header_pane"
      className="fixed top-0 left-0 w-full border-b border-neutral-900 bg-neutral-955/80 backdrop-blur-md z-50 pl-4 lg:pl-0 pr-6 md:pr-8 py-3 flex items-center justify-between gap-4"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-auto lg:w-20 flex items-center justify-center shrink-0">
          <button
            onClick={onToggleSidebar}
            className="icon-pill cursor-pointer hover:icon-pill--purple transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex items-center gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={() => navigateTo("/admin")}
        >
          <img
            src="/logo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            className="h-10 w-10 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover transition-all duration-300 animate-[fadeIn_0.3s_ease-out] group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]"
            alt="Sonikoma Logo"
          />
          <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
            Sonikoma
          </span>
        </div>
      </div>

      {/* Middle side: Search Command Palette */}
      <div className="hidden md:flex flex-1 max-w-sm lg:max-w-md relative" ref={searchRef}>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </div>
          <input
            type="text"
            placeholder="Quick Find (Ctrl+K or /)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full bg-neutral-900 text-xs text-neutral-205 pl-9 pr-8 py-2 rounded-xl border border-neutral-850 focus:border-purple-500/60 focus:bg-neutral-900/90 focus:outline-none transition-all placeholder:text-neutral-500 font-sans shadow-inner shadow-black/45"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-neutral-500 bg-neutral-950 border border-neutral-850 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[360px] overflow-y-auto scrollbar-thin">
            <div className="p-2 border-b border-neutral-850/60">
              <span className="px-3 py-1.5 text-[9px] font-extrabold font-sans text-purple-400 tracking-wider uppercase block">
                Jump To Page
              </span>
              <div className="space-y-0.5">
                {filteredNavItems.map((item) => (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigateTo(item.path);
                      setShowSearchDropdown(false);
                      setSearchQuery("");
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800/80 flex items-center justify-between group transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                        {item.label}
                      </p>
                    </div>
                    <span className="text-[9px] text-neutral-600 font-normal uppercase">
                      {item.path}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Controls matching main header layout */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Server: ONLINE badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-full text-xs font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server: ONLINE</span>
        </div>

        {/* Saved badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-neutral-900 border border-neutral-850 rounded-full text-xs font-bold text-neutral-400">
          <span>Saved</span>
        </div>

        {/* Audio Volume Slider */}
        <div className="hidden xl:flex items-center gap-2 bg-neutral-900/50 border border-neutral-850/40 px-3 py-1 rounded-full">
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="text-neutral-400 hover:text-white cursor-pointer"
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-neutral-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="100"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setIsMuted(false);
            }}
            className="w-16 accent-purple-500 h-1 bg-neutral-850 rounded-lg appearance-none cursor-pointer"
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`icon-pill cursor-pointer relative transition-all ${
              showNotifications ? "icon-pill--active" : ""
            }`}
            title="Notifications"
          >
            {notificationsMuted ? (
              <BellOff className="h-4 w-4 text-rose-455" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-neutral-950">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onClose={() => setShowNotifications(false)}
              onMarkAsRead={markNotificationAsRead}
              onMarkAllAsRead={markAllNotificationsAsRead}
              onDelete={deleteNotification}
              onClearAll={clearAllNotifications}
              onNavigateToAll={() => {
                setShowNotifications(false);
                navigateTo("/notifications");
              }}
              notificationsMuted={notificationsMuted}
              onToggleMute={() =>
                setNotificationsMuted &&
                setNotificationsMuted(!notificationsMuted)
              }
            />
          )}
        </div>

        {/* Telemetry/Activity Popover */}
        <div className="relative" ref={telemetryRef}>
          <button
            onClick={() => setShowTelemetryPopover(!showTelemetryPopover)}
            className={`icon-pill cursor-pointer transition-all ${
              showTelemetryPopover ? "icon-pill--active" : ""
            }`}
            title="Telemetry monitors"
          >
            <Activity className="h-4 w-4" />
          </button>

          {showTelemetryPopover && (
            <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-mono">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Host Telemetry
              </h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-500">CPU LOAD</span>
                    <span className="text-neutral-300 font-bold">{stats.cpu}%</span>
                  </div>
                  <div className="w-full bg-[#0b0b0f] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${stats.cpu}%` }} />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-neutral-500">RSS MEMORY</span>
                  <span className="text-neutral-300 font-bold">{stats.memory}</span>
                </div>

                {stats.gpu?.total > 0 && (
                  <div className="flex justify-between text-[10px] items-center">
                    <span className="text-neutral-500">GPU WORKERS</span>
                    <span className="text-amber-500 font-bold">{stats.gpu.busy}/{stats.gpu.total} busy</span>
                  </div>
                )}

                <div className="flex justify-between text-[10px] items-center border-t border-neutral-800/80 pt-2">
                  <span className="text-neutral-500">DB LATENCY</span>
                  <span className="text-blue-400 font-bold">{stats.dbLatency}ms</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={() => navigateTo("/admin/settings")}
          className="icon-pill cursor-pointer transition-all"
          title="Admin Settings"
        >
          <Settings className="h-4 w-4" />
        </button>

        {/* User profile identifier (Admin badge) */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 px-3 py-1 rounded-full select-none cursor-pointer" onClick={() => navigateTo("/admin/settings")}>
          <div className="w-5 h-5 rounded-full bg-violet-600 flex items-center justify-center text-[10px] text-white font-extrabold uppercase shadow shadow-violet-600/30">
            A
          </div>
          <span className="text-xs text-neutral-300 font-bold hidden sm:inline">admin</span>
        </div>



      </div>
    </header>
  );
};

export default AdminHeaderPage;
