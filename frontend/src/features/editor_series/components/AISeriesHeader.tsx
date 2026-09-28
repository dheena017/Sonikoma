import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Bell,
  BellOff,
  Sparkles,
  Zap,
  Menu,
  Layers,
  Activity,
  Film,
  X,
  Compass,
  Users,
  Globe,
  BookOpen,
  LayoutGrid,
  Tv,
} from "lucide-react";
import { claimDailyCredits } from "@/api/endpoints/auth";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { HeaderCreditsPopover } from "@/features/ai_core";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { useBackendHealth } from "@/shared/hooks";
import { AIModelSelector } from "@/features/ai_core";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { SonikomaLogo } from "@/shared/ui/branding";

export interface AISeriesHeaderProps {
  currentPath: string;
  navigateTo: (path: string) => void;
  fetchWithInterceptor?: any;
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

export const AISeriesHeader: React.FC<AISeriesHeaderProps> = ({
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

  const { status: backendStatus, checkHealth: recheckBackend } =
    useBackendHealth();

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
      if (addNotification) {
        addNotification("Failed to claim daily bonus", "error");
      }
    }
  };

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
      label: "AI Series Hub",
      path: "/ai-series",
      desc: "Franchise library & multi-session overview",
      icon: Layers,
    },
    {
      label: "Creator Cockpit",
      path: "/series-generator",
      desc: "Architect a brand new AI series with turbo chapter 1",
      icon: Zap,
    },
    {
      label: "Manhwa Webtoon Studio",
      path: "/studio/manhwa/active",
      desc: "Vertical strip infinite scroll panel production",
      icon: BookOpen,
    },
    {
      label: "Comic & Manga Studio",
      path: "/studio/comic/active",
      desc: "Paginated multi-panel spreads & screentones",
      icon: LayoutGrid,
    },
    {
      label: "Anime Cinema Studio",
      path: "/studio/anime/active",
      desc: "24fps kinetic sakuga & camera sweeps",
      icon: Tv,
    },
    {
      label: "Character DNA Vault",
      path: "/series/active/cast",
      desc: "Persistent faces, scars, and outfit palette",
      icon: Users,
    },
    {
      label: "World & Lore Bible",
      path: "/series/active/world",
      desc: "Continuity memory, factions, and realm rules",
      icon: Globe,
    },
    {
      label: "Series Arc Director",
      path: "/series/active/timeline",
      desc: "Multi-season roadmap & 0-cliffhanger epilogue",
      icon: Compass,
    },
  ];

  const filteredNavItems = quickNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="ai_series_header_pane"
      className="w-full min-w-0 h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 pr-3 sm:pr-6 md:pr-8 flex items-center justify-between gap-1 sm:gap-3 selection:bg-[#2A2A2A] shadow-md shadow-black/20 select-none"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-1 sm:gap-2.5 shrink-0 min-w-0 h-full">
        <div className="w-9 sm:w-14 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-3">
          <button
            onClick={onToggleSidebar}
            className="h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Toggle AI Series Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <SonikomaLogo
          size="sm"
          badge="AI Series"
          onClick={() => navigateTo("/ai-series")}
        />
      </div>

      {/* Center: Global Quick Finder */}
      <div
        ref={searchRef}
        className="hidden md:flex flex-1 max-w-md mx-4 relative"
      >
        <div className="relative w-full">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            placeholder="Search AI Series Studios, Cast, World Bible..."
            className="w-full h-8.5 pl-8.5 pr-8 bg-[#18191E] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500 transition-all font-medium"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dropdown Results */}
        {showSearchDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#121316] border border-neutral-800 rounded-xl shadow-2xl p-2 z-50 max-h-80 overflow-y-auto custom-purple-scrollbar">
            <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider px-2 py-1">
              AI Series Navigation
            </div>
            {filteredNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => {
                    setShowSearchDropdown(false);
                    navigateTo(item.path);
                  }}
                  className="w-full p-2 rounded-lg hover:bg-neutral-800/80 flex items-center gap-2.5 text-left transition-colors cursor-pointer group"
                >
                  <div className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 group-hover:text-violet-400 group-hover:border-violet-500/40">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-white group-hover:text-violet-400">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-neutral-400 truncate">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side: Standardized Controls Suite */}
      <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 shrink-0 overflow-x-visible pr-0.5 sm:pr-1">
        {/* Server Status Indicator */}
        <div className="hidden min-[480px]:block">
          <ServerStatusIndicator
            status={backendStatus}
            onClick={recheckBackend}
          />
        </div>

        {/* Global AI Model Selector */}
        <AIModelSelector compact className="flex shrink-0" />

        {/* Credits Pill & Popover */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <Tooltip text="Credits & Rewards" placement="bottom">
              <button
                onClick={() => {
                  setShowCreditsPopover(!showCreditsPopover);
                  setShowNotifications(false);
                }}
                className={`h-8.5 flex items-center gap-1 px-2.5 sm:px-3 rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-xs font-medium text-white transition-all shadow-2xs select-none shrink-0 cursor-pointer active:scale-95 ${
                  showCreditsPopover
                    ? "ring-2 ring-violet-500/40 border-violet-500/60 bg-[#282a32]"
                    : ""
                }`}
              >
                <Zap className="h-3.5 w-3.5 fill-violet-400 text-violet-400 shrink-0" />
                <span className="font-bold text-violet-300 font-mono text-[11px]">
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
          <Tooltip text="Series Notifications" placement="bottom">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowCreditsPopover(false);
              }}
              className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative ${
                showNotifications
                  ? "ring-2 ring-violet-500/40 border-violet-500 bg-[#282a32]"
                  : ""
              }`}
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

        {/* User Profile Avatar */}
        <Tooltip text="View Profile & Settings" placement="bottom">
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-neutral-700 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95"
          >
            <span className="text-xs font-bold text-white group-hover:text-violet-400 truncate max-w-[130px] hidden md:inline font-sans px-2.5 py-1 rounded-lg bg-[#24252c] border border-white/5">
              {activeUser?.full_name ||
                activeUser?.username ||
                "Series Director"}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-violet-500 bg-[#201833] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.35)] flex items-center justify-center">
              <img
                src={getUserAvatarUrl(activeUser)}
                onError={(e) => {
                  const target = e.currentTarget as HTMLImageElement;
                  target.onerror = null;
                  target.src = DEFAULT_USER_AVATAR_DATA_URI;
                }}
                alt="User Avatar"
                className="w-full h-full object-cover"
              />
            </div>
          </button>
        </Tooltip>
      </div>
    </header>
  );
};

export default AISeriesHeader;
