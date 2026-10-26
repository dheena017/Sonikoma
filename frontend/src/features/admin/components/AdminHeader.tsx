import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  BellOff,
  Zap,
  Menu,
  FolderSync,
} from "lucide-react";
import { getUserCreditsPayload, claimDailyCredits } from "@/features/auth/api/auth";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/platform/notifications/components/NotificationDropdown";
import { HeaderCreditsPopover } from "@/features/intelligence/core";
import ServerStatusIndicator from "@/shared/ui/status/ServerStatusIndicator";
import { useBackendHealth } from "@/shared/api/hooks/useBackendHealth";
import { useProjectStore } from "@/features/platform/projects/store/useProjectStore";
import { AIModelSelector } from "@/features/intelligence/core";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface AdminHeaderProps {
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

export const AdminHeader: React.FC<AdminHeaderProps> = ({
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTelemetryPopover, setShowTelemetryPopover] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    user?.credits !== undefined ? user.credits : null
  );

  const { activeProjectId, activeProjectData, setDrawerOpen } =
    useProjectStore();
  const { status: backendStatus, checkHealth: recheckBackend } =
    useBackendHealth();

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
      label: "Growth Analytics",
      path: "/admin/analytics",
      keyword: "analytics bi metrics charts kpi",
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
      label: "Superuser Console",
      path: "/admin/console",
      keyword: "console terminal logs shell superuser",
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
      label: "AI Training",
      path: "/admin/training",
      keyword: "ai yolo training bubble dataset ml",
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
      className="w-full h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-3 sm:pl-4 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 shadow-md shadow-black/20"
    >
      {/* Left side: Hamburger (mobile only) and Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        {/* Mobile-only menu toggle */}
        <div className="lg:hidden flex items-center justify-center shrink-0">
          <button
            onClick={onToggleSidebar}
            className="icon-pill cursor-pointer hover:icon-pill--blue transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <SonikomaLogo
          size="sm"
          badge="Admin"
          onClick={() => navigateTo("/admin")}
        />
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
            className="w-full bg-[#121212] text-xs text-[#E5E5E5] pl-9 pr-8 py-2 rounded-xl border border-[#2F2F2F] focus:border-neutral-600 focus:outline-none transition-all placeholder:text-[#6B7280] font-sans"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-[#6B7280] bg-[#181818] border border-[#2F2F2F] rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {showSearchDropdown && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#181818]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[360px] overflow-y-auto">
            {filteredNavItems.length > 0 ? (
              <div className="p-2">
                <span className="px-3 py-1.5 text-[9px] font-extrabold font-sans text-[#3B82F6] tracking-wider uppercase block">
                  Admin Navigation
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
                      <span className="text-[9px] text-neutral-500 font-mono uppercase">
                        {item.path}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-neutral-400 font-mono text-xs select-none">
                <p className="text-neutral-300 font-bold">
                  No results found for &ldquo;{searchQuery}&rdquo;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side: Controls matching main header layout */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0">
        {/* Server Status Indicator */}
        <div className="hidden min-[480px]:block">
          <ServerStatusIndicator
            status={backendStatus}
            onClick={recheckBackend}
          />
        </div>

        {/* Global AI Model Selector */}
        <AIModelSelector className="flex" />

        {/* Credits Pill & Popover */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <Tooltip text="Credits & Daily Bonus" placement="bottom">
              <button
                onClick={() => {
                  setShowCreditsPopover(!showCreditsPopover);
                  setShowNotifications(false);
                }}
                aria-label="Your credit balance & daily rewards"
                className={`h-10 flex items-center gap-2 px-3.5 rounded-xl bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 text-xs sm:text-[13px] font-bold text-white transition-all shadow-sm select-none shrink-0 cursor-pointer active:scale-95 ${
                  showCreditsPopover
                    ? "border-amber-500/60 bg-[#2A2A2A]"
                    : ""
                }`}
              >
                <Zap className="h-4 w-4 fill-amber-400 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 font-mono text-xs sm:text-[12.5px]">
                  {credits.toLocaleString()}
                </span>
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
              className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#141414] hover:bg-[#2A2A2A] border border-[#2F2F2F] hover:border-neutral-500 text-white transition-all shadow-sm cursor-pointer active:scale-95 shrink-0 relative ${
                showNotifications
                  ? "border-blue-500 bg-[#2A2A2A]"
                  : ""
              }`}
              aria-label="Notifications"
            >
              {notificationsMuted ? (
                <BellOff className="h-4 w-4 text-rose-400" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#FF2D55] text-[10px] font-black text-white ring-2 ring-[#18191e] shadow-xs">
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
                ? `Active Project: ${
                    activeProjectData.project?.title || "Active"
                  }`
                : "Select Active Project"
            }
            placement="bottom"
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#141414] hover:bg-[#2A2A2A] border transition-all shadow-sm cursor-pointer active:scale-95 shrink-0 relative group ${
                activeProjectId && activeProjectData
                  ? "border-[#383838] bg-[#1C1C1C] text-[#3B82F6] hover:border-neutral-500"
                  : "border-[#2F2F2F] hover:border-neutral-500 text-neutral-400 hover:text-white"
              }`}
              aria-label="Active Project Selector"
            >
              <FolderSync
                className={`h-4 w-4 transition-colors ${
                  activeProjectId && activeProjectData
                    ? "text-[#3B82F6]"
                    : "text-neutral-300 group-hover:text-white"
                }`}
              />
              {activeProjectId && activeProjectData && (
                <span className="absolute bottom-1 w-3.5 h-[2px] rounded-full bg-[#3B82F6]" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* User Profile Pill */}
        <Tooltip text="View Profile & Settings" placement="bottom">
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#141414] border border-[#2F2F2F] hover:border-neutral-500 hover:bg-[#2A2A2A] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95 focus-visible:outline-none"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-white truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-full bg-[#181818] border border-[#2F2F2F]">
              {user?.full_name ||
                user?.username ||
                (user?.email ? user.email.split("@")[0] : "Admin")}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border border-[#2F2F2F] bg-[#181818] shrink-0 flex items-center justify-center group-hover:border-neutral-400 transition-all duration-300">
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

export default AdminHeader;
