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
      className="w-full h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 selection:bg-purple-600/30 shadow-md shadow-black/20"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-4">
          <button
            onClick={onToggleSidebar}
            className="icon-pill cursor-pointer hover:icon-pill--purple transition-all"
            title="Toggle Creative Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={() => navigateTo("/creative-suite")}
        >
          <div className="relative shrink-0 rounded-full border border-[#2F2F2F] group-hover/brand:border-[#3B82F6] p-0.5 bg-[#1E1E1E] transition-colors">
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="h-9 w-9 rounded-full shrink-0 object-cover transition-transform duration-300 group-hover/brand:scale-105"
              style={{ background: "#000000" }}
              alt="Sonikoma Logo"
            />
          </div>
          <span className="font-black text-lg tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#3B82F6] via-[#A855F7] to-[#00FFFF] transition-all duration-300 font-sans hidden sm:inline-block">
            Sonikoma
          </span>
        </div>
      </div>



      {/* Right side: Standardized Controls Suite */}
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
          <Tooltip text="Creative Notifications" placement="bottom">
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
                <BellOff className="h-4 w-4 text-rose-500" />
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
              className="icon-pill cursor-pointer transition-all relative hover:bg-purple-500/20 hover:text-purple-300"
              aria-label="Active Project Selector"
            >
              <FolderSync className="h-4 w-4 text-purple-400" />
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
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-purple-500/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-white group-hover:text-purple-200 truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-lg bg-[#24252c] border border-white/5">
              {activeUser?.full_name ||
                activeUser?.username ||
                (activeUser?.email ? activeUser.email.split("@")[0] : "Studio Creator")}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#8b5cf6] bg-[#201833] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.35)] flex items-center justify-center group-hover:border-purple-400 transition-all duration-300">
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
