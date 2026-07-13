import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  BellOff,
  Sparkles,
  Zap,
  Menu,
  Cpu,
  Volume2,
  VolumeX,
  Sliders,
  Activity,
} from "lucide-react";
import * as api from "@/api";
import { getUserCreditsPayload } from "@/api/auth";
import NotificationDropdown from "../notification/NotificationDropdown";

export interface CreativeSuiteHeaderProps {
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

const CreativeSuiteHeader: React.FC<CreativeSuiteHeaderProps> = ({
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
    gpu: { total: 4, busy: 1, idle: 3 },
    uptime: "",
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTelemetryPopover, setShowTelemetryPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [credits, setCredits] = useState<number | null>(null);

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
        gpu: data.database?.gpuWorkers || { total: 4, busy: 1, idle: 3 },
        uptime: data.server?.uptime || "",
      });
    } catch (err) {
      console.error("Failed to fetch creative header stats:", err);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!fetchWithInterceptor) return;
    const pollCredits = async () => {
      try {
        const payload = await getUserCreditsPayload(fetchWithInterceptor);
        if (payload !== null) setCredits(payload.credits);
      } catch {
        // silent
      }
    };
    pollCredits();
    const interval = setInterval(pollCredits, 30_000);
    return () => clearInterval(interval);
  }, [fetchWithInterceptor]);

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
    { label: "Creative Dashboard", path: "/creative-suite", keyword: "home dashboard overview creative suite hub" },
    { label: "AI Video Optimizer", path: "/ai-optimizer", keyword: "video optimizer resolution pacing scenes compile" },
    { label: "AI Panel Assistant", path: "/panel-assistant", keyword: "panel editing speech bubble clean crop repaint" },
    { label: "AI Character DB", path: "/ai-characters", keyword: "characters profile sheet database prompts reference" },
    { label: "AI Translation Studio", path: "/ai-translation", keyword: "translation language subtitles dialogue script" },
    { label: "AI Sound Design Lab", path: "/ai-audio-lab", keyword: "sound design audio lab music themes soundtrack sfx" },
    { label: "AI Thumbnail Studio", path: "/ai-thumbnails", keyword: "thumbnails extraction titles overlay templates" },
    { label: "AI Community Coach", path: "/ai-engagement", keyword: "engagement analytics comments coach feedback" },
    { label: "AI Voice Casting", path: "/ai-voice", keyword: "voice synthesis narrator casting speed pitch" },
    { label: "CTR Performance Predictor", path: "/ai-analytics", keyword: "ctr analytics heatmap visual scores predictions" },
    { label: "YouTube Publisher Studio", path: "/youtube", keyword: "youtube upload publish export draft title" },
  ];

  const filteredNavItems = quickNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="creative_header_pane"
      className="fixed top-0 left-0 w-full h-16 border-b border-neutral-900 bg-[#050507]/80 backdrop-blur-md z-50 pl-4 lg:pl-0 pr-6 md:pr-8 flex items-center justify-between gap-4 selection:bg-purple-650"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-3 shrink-0 h-full">
        <div className="w-auto lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900 h-full mr-4">
          <button
            onClick={onToggleSidebar}
            className="icon-pill cursor-pointer hover:icon-pill--purple transition-all"
            title="Toggle Creative Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex items-center gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={() => navigateTo("/creative-suite")}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40 shrink-0 transition-all duration-300 animate-[fadeIn_0.3s_ease-out] group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
            Creative Suite
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
            placeholder="Search Creative Tools (Ctrl+K or /)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full bg-neutral-900 text-xs text-neutral-200 pl-9 pr-8 py-2 rounded-xl border border-neutral-850 focus:border-purple-500/60 focus:bg-neutral-900/90 focus:outline-none transition-all placeholder:text-neutral-500 font-sans shadow-inner shadow-black/45"
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
                Launch Creative Tool
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
                {filteredNavItems.length === 0 && (
                  <div className="px-3 py-4 text-center text-xs text-neutral-500 font-mono">
                    No matching creative tools found
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Controls matching creative layout */}
      <div className="flex items-center gap-3 shrink-0">
        
        {/* Creative Node Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-purple-550/10 text-purple-400 border border-purple-550/15 rounded-full text-xs font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
          <span>AI Engine: ACTIVE</span>
        </div>

        {/* ⚡ Credits Pill */}
        {credits !== null && (
          <button
            onClick={() => navigateTo("/profile?tab=billing")}
            title="Your credit balance — click to top up"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono select-none cursor-pointer transition-all ${
              credits < 20
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                : "bg-neutral-900 border-neutral-850 text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/5"
            }`}
          >
            <Zap className="h-3.5 w-3.5 shrink-0" />
            {credits.toLocaleString()}
          </button>
        )}

        {/* Volume Controller */}
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
              <BellOff className="h-4 w-4 text-rose-500" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-neutral-950">
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

        {/* Telemetry/Creative Processing Queue Popover */}
        <div className="relative" ref={telemetryRef}>
          <button
            onClick={() => setShowTelemetryPopover(!showTelemetryPopover)}
            className={`icon-pill cursor-pointer transition-all ${
              showTelemetryPopover ? "icon-pill--active" : ""
            }`}
            title="Creative Pipeline telemetry"
          >
            <Activity className="h-4 w-4" />
          </button>

          {showTelemetryPopover && (
            <div className="absolute right-0 mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150 font-mono">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
                <Cpu className="h-4 w-4" /> Creative Engine
              </h3>
              <div className="space-y-3 text-xs">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-neutral-500">AI WORKER LOAD</span>
                    <span className="text-neutral-300 font-bold">{stats.cpu}%</span>
                  </div>
                  <div className="w-full bg-[#0b0b0f] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-purple-500 h-full transition-all duration-300" style={{ width: `${stats.cpu}%` }} />
                  </div>
                </div>

                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-neutral-500">AUDIO BUFFER MEMORY</span>
                  <span className="text-neutral-300 font-bold">{stats.memory}</span>
                </div>

                <div className="flex justify-between text-[10px] items-center border-t border-neutral-800/80 pt-2">
                  <span className="text-neutral-500">DB TELEMETRY SYNC</span>
                  <span className="text-purple-400 font-bold">{stats.dbLatency}ms</span>
                </div>

                <div className="flex justify-between text-[10px] items-center">
                  <span className="text-neutral-500">GPU CORE WORKERS</span>
                  <span className="text-indigo-400 font-bold">
                    {stats.gpu?.busy || 1}/{stats.gpu?.total || 4} active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Settings Icon */}
        <button
          onClick={() => navigateTo("/settings")}
          className="icon-pill cursor-pointer transition-all"
          title="Creative Settings"
        >
          <Sliders className="h-4 w-4" />
        </button>

        {/* User profile identifier (Creative Suite badge) */}
        <div className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 px-3 py-1 rounded-full select-none cursor-pointer" onClick={() => navigateTo("/profile")}>
          <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-[10px] text-white font-extrabold uppercase shadow shadow-purple-900/30">
            C
          </div>
          <span className="text-xs text-neutral-300 font-bold hidden sm:inline">creator</span>
        </div>
      </div>
    </header>
  );
};

export default CreativeSuiteHeader;
