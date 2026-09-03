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
  Key,
  CreditCard,
  BarChart3,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  X,
} from "lucide-react";
import * as api from "@/api";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import HeaderCreditsPopover from "./HeaderCreditsPopover";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { SonikomaLogo } from "@/shared/ui/branding";
import { useBackendHealth } from "@/shared/hooks";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { AIModelSelector } from "@/features/ai_core";

export interface AICoreHeaderProps {
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

export default function AICoreHeader({
  currentPath,
  navigateTo,
  fetchWithInterceptor,
  onToggleSidebar,
  notifications = [],
  markNotificationAsRead = () => { },
  markAllNotificationsAsRead = () => { },
  deleteNotification = () => { },
  clearAllNotifications = () => { },
  notificationsMuted = false,
  setNotificationsMuted,
  isSidebarOpen = false,
  user,
  addNotification,
}: AICoreHeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    user?.credits !== undefined ? user.credits : null
  );

  const { activeProjectId, activeProjectData, setDrawerOpen } = useProjectStore();
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
      label: "AI Command Center",
      path: "/ai-core",
      keyword: "home dashboard overview ai core hub intelligence",
    },
    {
      label: "API Keys & Provider Vault",
      path: "/ai-core/api-keys",
      keyword: "keys gemini openai claude elevenlabs huggingface groq deepseek",
    },
    {
      label: "Model Routing & Fallbacks",
      path: "/ai-core/models",
      keyword: "routing models fallback hyperparameters temperature",
    },
    {
      label: "Tokens by Model & API Key",
      path: "/ai-core/tokens",
      keyword: "tokens models quotas tpm rpm limits pricing calculation",
    },
    {
      label: "AI Token Analytics & Ledger",
      path: "/ai-core/analytics",
      keyword: "analytics tokens telemetry prompt output latency cost",
    },
    {
      label: "Billing & Credit Wallet",
      path: "/ai-core/billing",
      keyword: "billing wallet credits topup rates packages",
    },
    {
      label: "Safety & Quota Limits",
      path: "/ai-core/safety-quotas",
      keyword: "safety rpm quota content id copyright filter",
    },
  ];

  const filteredNavItems = quickNavItems.filter(
    (item) =>
      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.keyword.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <header
      id="ai_core_header_pane"
      className="w-full h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 selection:bg-purple-600/30 shadow-md shadow-black/20"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-4">
          <button
            onClick={onToggleSidebar}
            className="h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
            title="Toggle AI Core Menu"
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>

        <SonikomaLogo
          size="sm"
          badge="AI Core"
          onClick={() => navigateTo("/ai-core")}
        />
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
            <button
              onClick={() => {
                setShowCreditsPopover(!showCreditsPopover);
                setShowNotifications(false);
              }}
              title="Your credit balance & daily rewards — click to view"
              className={`h-8.5 flex items-center gap-1.5 px-3 rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-xs font-medium text-white transition-all shadow-2xs select-none shrink-0 cursor-pointer active:scale-95 ${
                showCreditsPopover ? "ring-2 ring-amber-500/40 border-amber-500/60 bg-[#282a32]" : ""
              }`}
            >
              <Zap className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
              <span className="font-bold text-amber-300 font-mono text-[11px]">{credits.toLocaleString()}</span>
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
                    navigateTo("/ai-core/billing");
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
            className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative ${
              showNotifications ? "ring-2 ring-blue-500/40 border-blue-500 bg-[#282a32]" : ""
            }`}
            title="Notifications"
          >
            {notificationsMuted ? (
              <BellOff className="h-4 w-4 text-rose-500" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#FF2D55] text-[10px] font-black text-white ring-2 ring-[#18191e] shadow-xs">
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
            className="h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-neutral-300 hover:text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative"
            title={
              activeProjectId && activeProjectData
                ? `Active Project: ${
                    activeProjectData.project?.title || "Active"
                  } — Click to switch`
                : "Select Active Project"
            }
          >
            <FolderSync className="h-4 w-4" />
            {activeProjectId && activeProjectData && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0D0E12] animate-pulse" />
            )}
          </button>
        </div>

        {/* User Profile Pill at Far Right End */}
        <button
          onClick={() => navigateTo && navigateTo("/profile")}
          className="h-8.5 flex items-center gap-2 pl-3 pr-1.5 rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] transition-all cursor-pointer select-none group shrink-0 shadow-2xs active:scale-95"
          title="View Profile & Account Settings"
          aria-label="Open User profile"
        >
          <span className="text-xs font-semibold text-neutral-200 group-hover:text-white truncate max-w-[120px] hidden sm:inline">
            {user?.full_name ||
              user?.username ||
              (user?.email ? user.email.split("@")[0] : "Studio Creator")}
          </span>
          <div className="relative w-6 h-6 rounded-lg overflow-hidden border border-[#33353e] bg-black shrink-0 flex items-center justify-center">
            <img
              key={user?.avatar_url || user?.full_name || "avatar"}
              src={getUserAvatarUrl(user)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
              alt="User Avatar"
            />
          </div>
        </button>
      </div>
    </header>
  );
}
