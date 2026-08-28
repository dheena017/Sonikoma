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
  FolderSync,
} from "lucide-react";
import * as api from "@/api";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { HeaderCreditsPopover } from "@/features/ai_core";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { useBackendHealth } from "@/shared/hooks";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { AIModelSelector } from "@/features/ai_core";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

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
  user?: any;
  addNotification?: (message: string, type?: string) => void;
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
  user,
  addNotification,
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
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    user?.credits !== undefined ? user.credits : null
  );

  const { activeProjectId, activeProjectData, setDrawerOpen } =
    useProjectStore();
  const { status: backendStatus, checkHealth: recheckBackend } = useBackendHealth();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const telemetryRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleClaimDailyBonus = async () => {
    if (!fetchWithInterceptor) return;
    try {
      const res = await claimDailyCredits(fetchWithInterceptor);
      if (res.success && typeof res.new_balance === "number") {
        setCredits(res.new_balance);
        if (addNotification) {
          addNotification(res.message || "Claimed daily bonus!", "success");
        }
      }
    } catch {
      // silent
    }
  };

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
    if (user?.credits !== undefined) {
      setCredits(user.credits);
    }
  }, [user?.credits]);

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
      if (creditsRef.current && !creditsRef.current.contains(target)) {
        setShowCreditsPopover(false);
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
    {
      label: "Dashboard",
      path: "/admin",
      keyword: "home index dashboard overview",
    },
    {
      label: "Announcements",
      path: "/admin/announcements",
      keyword: "announcements broadcast email message",
    },
    {
      label: "User Accounts",
      path: "/admin/users",
      keyword: "users accounts creators login",
    },
    {
      label: "Scrapers Configuration",
      path: "/admin/scrapers",
      keyword: "scrapers webtoon scraping episode",
    },
    {
      label: "System settings",
      path: "/admin/settings",
      keyword: "settings parameters config reset cache",
    },
    {
      label: "Database Explorer",
      path: "/admin/explorer",
      keyword: "database query table explorer sql",
    },
    {
      label: "System Health",
      path: "/admin/health",
      keyword: "health server uptime cpu memory latency",
    },
    {
      label: "Audit Logs",
      path: "/admin/activity",
      keyword: "audit logs security activity actions",
    },
    {
      label: "Interactive Console",
      path: "/admin/console",
      keyword: "console terminal prompt execute",
    },
  ];

  const filteredNavItems = quickNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="header_pane"
      className="w-full h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 shadow-md shadow-black/20"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-4">
          <button
            onClick={onToggleSidebar}
            className="icon-pill cursor-pointer hover:icon-pill--blue transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={() => navigateTo("/admin")}
        >
          <div className="relative shrink-0 rounded-full border border-[#2F2F2F] group-hover/brand:border-[#3B82F6] p-0.5 bg-[#1E1E1E] transition-colors">
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shrink-0 object-cover transition-transform duration-300 group-hover/brand:scale-105"
              alt="Sonikoma Logo"
            />
          </div>
          <span className="font-black text-base sm:text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF] transition-all duration-300 font-sans hidden sm:inline-block">
            Sonikoma
          </span>
        </div>
      </div>

      {/* Middle side: Search Command Palette */}
      <div
        className="hidden md:flex flex-1 max-w-sm lg:max-w-md relative"
        ref={searchRef}
      >
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
            className="w-full bg-[#121212] text-xs text-[#E5E5E5] pl-9 pr-8 py-2 rounded-xl border border-[#2F2F2F] focus:border-[#3B82F6] focus:outline-none transition-all placeholder:text-[#6B7280] font-sans"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#6B7280] bg-[#181818] border border-[#2F2F2F] rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#181818] border border-[#2F2F2F] rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[360px] overflow-y-auto">
            <div className="p-2 border-b border-[#2F2F2F]">
              <span className="px-3 py-1.5 text-[9px] font-extrabold font-sans text-[#3B82F6] tracking-wider uppercase block">
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
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
        {/* Server Status Indicator */}
        <ServerStatusIndicator status={backendStatus} onClick={recheckBackend} />

        {/* 🤖 Global AI Model Selector */}
        <AIModelSelector className="flex" />

        {/* ⚡ Credits Pill & Popover (Image 1 Style) */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <Tooltip text="Credits & Daily Bonus" placement="bottom">
              <button
                onClick={() => {
                  setShowCreditsPopover(!showCreditsPopover);
                  setShowNotifications(false);
                }}
                aria-label="Your credit balance & daily rewards"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#2b2d35] bg-[#18191e] hover:bg-[#202127] text-amber-400 hover:border-amber-500/40 text-[10px] sm:text-xs font-black font-mono select-none cursor-pointer transition-all shadow-sm"
              >
                <Zap className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0 fill-amber-400 text-amber-400" />
                <span>{credits.toLocaleString()}</span>
              </button>
            </Tooltip>

            {showCreditsPopover && (
              <div className="absolute right-0 top-full mt-2 z-50">
                <HeaderCreditsPopover
                  credits={credits}
                  hasClaimedToday={user?.has_claimed_today}
                  streakDays={user?.streak_days || 1}
                  onClaimDaily={handleClaimDailyBonus}
                  onNavigateToBilling={() => {
                    setShowCreditsPopover(false);
                    navigateTo("/profile?tab=billing");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <Tooltip text="System Notifications" placement="bottom">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowCreditsPopover(false);
              }}
              className={`icon-pill cursor-pointer relative transition-all ${
                showNotifications ? "icon-pill--active" : ""
              }`}
              aria-label="Notifications"
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
          </Tooltip>

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

        {/* Active Project Selector Icon Button */}
        <div className="relative">
          <Tooltip
            text={
              activeProjectId && activeProjectData
                ? `Active Project: ${activeProjectData.project?.title || "Active"}`
                : "Select Active Project"
            }
            placement="bottom"
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className="icon-pill cursor-pointer transition-all relative hover:bg-[#1E1E1E] hover:text-[#3B82F6]"
              aria-label="Active Project Selector"
            >
              <FolderSync className="h-4 w-4 text-[#3B82F6]" />
              {activeProjectId && activeProjectData && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#10B981] ring-2 ring-black animate-pulse" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* User Profile Pill at Far Right End */}
        <Tooltip text="View Profile & Settings" placement="bottom">
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#181818] border border-[#2F2F2F] hover:border-[#3B82F6]/60 hover:bg-[#262626] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-[#E5E5E5] group-hover:text-white truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-lg bg-[#141414] border border-[#2F2F2F]">
              {user?.full_name ||
                user?.username ||
                (user?.email ? user.email.split("@")[0] : "Admin")}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#3B82F6] bg-[#1E1E1E] shrink-0 flex items-center justify-center group-hover:border-[#60A5FA] transition-all duration-300">
              <img
                key={user?.avatar_url || user?.full_name || "avatar"}
                src={getUserAvatarUrl(user)}
                referrerPolicy="no-referrer"
                onLoad={(e) => {
                  e.currentTarget.classList.remove("opacity-0");
                  e.currentTarget.classList.add("opacity-100");
                }}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = DEFAULT_USER_AVATAR_DATA_URI;
                  target.classList.remove("opacity-0");
                  target.classList.add("opacity-100");
                }}
                alt="User Avatar"
                className="w-full h-full object-cover opacity-0 transition-opacity duration-300"
              />
            </div>
          </button>
        </Tooltip>
      </div>
    </header>
  );
};

export default AdminHeaderPage;
