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
import { getUserAvatarUrl, DEFAULT_USER_AVATAR_DATA_URI } from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import HeaderCreditsPopover from "@/features/user_billing/components/HeaderCreditsPopover";
import { useProjectStore } from "@/store/useProjectStore";

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

  const { activeProjectId, activeProjectData, setDrawerOpen } = useProjectStore();

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
      className="fixed top-0 left-0 w-full h-16 border-b border-neutral-900 bg-neutral-955/80 backdrop-blur-md z-50 pl-4 lg:pl-0 pr-6 md:pr-8 flex items-center justify-between gap-4"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-3 shrink-0 h-full">
        <div className="w-auto lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900 h-full mr-4">
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
            src="/logo-dark.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
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
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        
        {/* Server: ONLINE badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded-full text-xs font-bold font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>Server: ONLINE</span>
        </div>

        {/* ⚡ Credits Pill & Popover */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <button
              onClick={() => {
                setShowCreditsPopover(!showCreditsPopover);
                setShowNotifications(false);
              }}
              title="Your credit balance & daily rewards — click to view"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono select-none cursor-pointer transition-all ${
                credits < 20
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                  : "bg-neutral-900 border-neutral-850 text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
              }`}
            >
              <Zap className="h-3.5 w-3.5 shrink-0 fill-amber-400" />
              {credits.toLocaleString()}
            </button>

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
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowCreditsPopover(false);
            }}
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

        {/* Active Project Selector Icon Button */}
        <div className="relative">
          <button
            onClick={() => setDrawerOpen(true)}
            className="icon-pill cursor-pointer transition-all relative hover:bg-purple-500/20 hover:text-purple-300"
            title={
              activeProjectId && activeProjectData
                ? `Active Project: ${activeProjectData.project?.title || "Active"} — Click to switch`
                : "Select Active Project"
            }
          >
            <FolderSync className="h-4 w-4 text-purple-400" />
            {activeProjectId && activeProjectData && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
            )}
          </button>
        </div>

        {/* User Profile Pill at Far Right End (Image 3 Style) */}
        <button
          onClick={() => navigateTo && navigateTo("/profile")}
          className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-850 transition-all cursor-pointer select-none group shrink-0 ml-1 shadow-sm active:scale-95"
          title="View Profile & Account Settings"
          aria-label="Open User profile"
        >
          <span className="text-xs font-bold text-neutral-300 group-hover:text-white truncate max-w-[120px] hidden sm:inline font-sans px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-750">
            {user?.full_name || user?.username || (user?.email ? user.email.split("@")[0] : "Admin")}
          </span>
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-purple-500/40 bg-purple-950/40 shrink-0 shadow-xs ring-1 ring-white/10 group-hover:border-purple-400 group-hover:ring-purple-500/30 transition-all duration-300">
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
      </div>
    </header>
  );
};

export default AdminHeaderPage;
