import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  BellOff,
  Sparkles,
  Zap,
  Menu,
  FolderOpen,
  FolderSync,
  Activity,
  Film,
  X,
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
import { SonikomaLogo } from "@/shared/ui/branding";

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
  user?: any;
  addNotification?: (message: string, type?: string) => void;
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
  user,
  addNotification,
}) => {
  // Resolve live user from prop or LocalStorage session cache
  const activeUser = React.useMemo(() => {
    if (user && Object.keys(user).length > 0) return user;
    try {
      const stored =
        localStorage.getItem("sonikoma_user") ||
        localStorage.getItem("user") ||
        sessionStorage.getItem("sonikoma_user");
      if (stored) return JSON.parse(stored);
    } catch {}
    return null;
  }, [user]);

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    activeUser?.credits !== undefined ? activeUser.credits : null
  );

  const { activeProjectId, activeProjectData, projectState, setDrawerOpen } =
    useProjectStore();
  const { status: backendStatus, checkHealth: recheckBackend } = useBackendHealth();

  const notificationsRef = useRef<HTMLDivElement>(null);
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
      label: "Creative Dashboard",
      path: "/creative-suite",
      keyword: "home dashboard overview creative suite hub",
    },
    {
      label: "AI Video Optimizer",
      path: "/creative-suite/ai-optimizer",
      keyword: "video optimizer resolution pacing scenes compile",
    },
    {
      label: "AI Panel Assistant",
      path: "/creative-suite/panel-assistant",
      keyword: "panel editing speech bubble clean crop repaint",
    },
    {
      label: "AI Voice & Sound Studio",
      path: "/creative-suite/ai-voice",
      keyword:
        "voice synthesis narrator sound design bgm sfx casting speed pitch",
    },
    {
      label: "YouTube Publisher Studio",
      path: "/creative-suite/youtube",
      keyword: "youtube upload publish export draft title",
    },
  ];

  const filteredNavItems = quickNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="creative_header_pane"
      className="w-full min-w-0 h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 selection:bg-[#2A2A2A] shadow-md shadow-black/20 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0 h-full">
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-4">
          <button
            onClick={onToggleSidebar}
            className="h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Toggle Creative Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <SonikomaLogo
          size="sm"
          badge="Creative"
          onClick={() => navigateTo("/creative-suite")}
        />
      </div>



      {/* Right side: Standardized Controls Suite */}
      <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3 shrink-0 overflow-x-visible">
        {/* Server Status Indicator - Hidden on ultra-small screens (<480px) */}
        <div className="hidden min-[480px]:block">
          <ServerStatusIndicator status={backendStatus} onClick={recheckBackend} />
        </div>

        {/* 🤖 Global AI Model Selector */}
        <AIModelSelector compact className="flex shrink-0" />

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
                className={`h-8.5 flex items-center gap-1.5 px-3 rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-xs font-medium text-white transition-all shadow-2xs select-none shrink-0 cursor-pointer active:scale-95 ${
                  showCreditsPopover ? "ring-2 ring-amber-500/40 border-amber-500/60 bg-[#282a32]" : ""
                }`}
              >
                <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                <span className="font-bold text-amber-300 font-mono text-[11px]">{credits.toLocaleString()}</span>
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
          <Tooltip text="Creative Notifications" placement="bottom">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowCreditsPopover(false);
              }}
              className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative ${
                showNotifications ? "ring-2 ring-blue-500/40 border-blue-500 bg-[#282a32]" : ""
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
                ? `Active Project: ${activeProjectData.project?.title || "Active"}`
                : "Select Active Project"
            }
            placement="bottom"
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className="icon-pill cursor-pointer transition-all relative hover:bg-[#3B82F6]/20 hover:text-[#93C5FD]"
              aria-label="Active Project Selector"
            >
              <FolderSync className="h-4 w-4 text-[#3B82F6]" />
              {activeProjectId && activeProjectData && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* User Profile Pill at Far Right End (Image 2 Style) */}
        <Tooltip text="View Profile & Settings" placement="bottom">
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-[#3B82F6]/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080c]"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-white group-hover:text-[#3B82F6] truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-lg bg-[#24252c] border border-white/5">
              {activeUser?.full_name ||
                activeUser?.username ||
                (activeUser?.email ? activeUser.email.split("@")[0] : "Studio Creator")}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#8b5cf6] bg-[#201833] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.35)] flex items-center justify-center group-hover:border-[#60A5FA] transition-all duration-300">
              <img
                key={activeUser?.avatar_url || activeUser?.full_name || "avatar"}
                src={getUserAvatarUrl(activeUser)}
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

export default CreativeSuiteHeader;
