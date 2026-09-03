import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Film,
  Menu,
  Bell,
  BellOff,
  X,
  Search,
  Activity,
  ChevronDown,
  Loader2,
  Sparkles,
  HelpCircle,
  FileText,
  Cloud,
  Zap,
  Cpu,
  FolderOpen,
  FolderSync,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { Notification } from "@/features/app_notification";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import { getProjects } from "@/api/endpoints/projects";
import { HeaderCreditsPopover } from "@/features/ai_core";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { AIModelSelector } from "@/features/ai_core";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { SonikomaLogo } from "@/shared/ui/branding";
import GlobalSearchBar from "./GlobalSearchBar";

interface HeaderProps {
  isProcessing: boolean;
  panels: GeneratedPanel[];
  totalCalculatedDuration: number;
  currentPath: string;
  editingImageIdx: number | null;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  cleanProgress?: { current: number; total: number } | null;
  batchProgress?: { current: number; total: number } | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  backendStatus: "online" | "offline" | "checking";
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  volume?: number;
  setVolume?: (vol: number) => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean) => void;
  user?: any;
  notifications: Notification[];
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
  projectId?: string | null;
  saveStatus?: string;
  isDirty?: boolean;
  onSave?: () => void;
  navigateTo?: (path: string) => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  fetchWithInterceptor?: any;
  addNotification?: (message: string, type?: string) => void;
}

/** Format seconds into a readable "Xm Ys" string */
function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const HeaderInner = ({
  isProcessing,
  panels,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles,
  cleanProgress,
  batchProgress,
  onToggleSidebar,
  isSidebarOpen = false,
  backendStatus,
  selectedModel = "",
  setSelectedModel,
  volume = 0.8,
  setVolume,
  isMuted = false,
  setIsMuted,
  user,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  projectId = null,
  saveStatus = "idle",
  isDirty = false,
  onSave,
  navigateTo: routerNavigateTo,
  notificationsMuted = false,
  setNotificationsMuted,
  fetchWithInterceptor,
  addNotification,
}: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const {
    activeProjectId,
    activeProjectData,
    projectState,
    missingProjectInfo,
    setDrawerOpen,
    clearActiveProject,
  } = useProjectStore();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { modelsByProvider } = useAIModels();

  // Credits state — polled from server every 30 s and on mount
  const [credits, setCredits] = useState<number | null>(
    user?.credits !== undefined ? user.credits : null
  );

  const handleClaimDailyBonus = async () => {
    if (!fetchWithInterceptor) return;
    try {
      const res = await claimDailyCredits(fetchWithInterceptor);
      if (res.success && typeof res.new_balance === "number") {
        setCredits(res.new_balance);
        if (addNotification) {
          addNotification(res.message || "Claimed daily bonus!", "success");
        }
      } else if (addNotification) {
        addNotification(res.message || "Failed to claim bonus", "info");
      }
    } catch {
      if (addNotification) {
        addNotification("Error claiming daily bonus", "error");
      }
    }
  };

  // Tracks whether we've already shown the low-balance toast this browser session.
  const sessionWarningFiredRef = useRef(false);

  useEffect(() => {
    if (!fetchWithInterceptor) return;
    const pollCredits = async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const payload = await getUserCreditsPayload(fetchWithInterceptor);
        if (payload !== null) {
          setCredits(payload.credits);
          // Fire a one-shot low-balance warning toast per session
          if (
            payload.low_balance &&
            !sessionWarningFiredRef.current &&
            addNotification
          ) {
            sessionWarningFiredRef.current = true;
            addNotification(
              `⚡ Low credits: ${payload.credits} remaining. Top up to keep generating.`,
              "warning"
            );
          }
        }
      } catch {
        // silent — polling errors should not break the header
      }
    };
    pollCredits();
    const interval = setInterval(pollCredits, 30_000);
    const handleVisibilityChange = () => {
      if (!document.hidden) pollCredits();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchWithInterceptor, addNotification]);

  // Also sync with user prop when it changes (e.g., after daily claim)
  useEffect(() => {
    if (user?.credits !== undefined) {
      setCredits(user.credits);
    }
  }, [user?.credits]);

  // Search & Navigation Palette states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Keyboard shortcut for Command Palette focus (Ctrl/Cmd + K or /)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "s" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        // Ctrl+S / Cmd+S: save the project
        event.preventDefault();
        if (onSave && saveStatus !== "saving") {
          onSave();
        }
      } else if (
        event.key === "/" &&
        document.activeElement !== searchInputRef.current
      ) {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          event.preventDefault();
          searchInputRef.current?.focus();
          setShowSearchDropdown(true);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener for all custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (statsRef.current && !statsRef.current.contains(target)) {
        setShowStats(false);
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

  const navigateTo = async (path: string) => {
    if (routerNavigateTo) {
      routerNavigateTo(path);
    } else if ((window as any).navigateTo) {
      (window as any).navigateTo(path);
    } else {
      if (isDirty) {
        const confirm = (window as any).confirmAsync || window.confirm;
        const confirmed = await confirm(
          "You have unsaved changes. Are you sure you want to navigate away? Your changes will be lost."
        );
        if (!confirmed) {
          return;
        }
      }
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  // Metrics details calculations
  const totalWithSpeech = panels.filter(
    (p) => p.speech_text && p.speech_text.trim()
  ).length;
  const totalWithAudio = panels.filter((p) => p.audio_url).length;
  const progressPercent =
    panels.length > 0
      ? Math.round(
          ((totalWithSpeech + totalWithAudio) / (panels.length * 2)) * 100
        )
      : 0;

  // Dynamically computed quality scores — derived from real panel properties
  const audienceRetentionPct =
    panels.length === 0
      ? 0
      : Math.min(
          100,
          Math.round(40 + progressPercent * 0.55 + (totalWithAudio > 0 ? 5 : 0))
        );
  const audienceRetentionLabel =
    audienceRetentionPct >= 75
      ? "High"
      : audienceRetentionPct >= 50
      ? "Medium"
      : audienceRetentionPct > 0
      ? "Low"
      : "—";

  const avgWordsPerPanel =
    totalWithSpeech > 0
      ? panels.reduce((sum, p) => {
          const words = p.speech_text
            ? p.speech_text.trim().split(/\s+/).length
            : 0;
          return sum + words;
        }, 0) / totalWithSpeech
      : 0;
  const ctrScore =
    panels.length === 0
      ? 0
      : Math.min(
          10,
          parseFloat(
            (
              3 +
              Math.min(avgWordsPerPanel / 8, 1) * 5 +
              (progressPercent / 100) * 2
            ).toFixed(1)
          )
        );

  const lastPanel = panels.length > 0 ? panels[panels.length - 1] : null;
  const cliffhangerScore = (() => {
    if (!lastPanel) return "—";
    const hasText =
      lastPanel.speech_text && lastPanel.speech_text.trim().length > 10;
    const hasSfx = lastPanel.sfx && lastPanel.sfx.trim().length > 0;
    const dynamicMotion = [
      "zoom_in",
      "zoom_out",
      "pan_left",
      "pan_right",
    ].includes(lastPanel.motion_type);
    const score =
      (hasText ? 1 : 0) + (hasSfx ? 1 : 0) + (dynamicMotion ? 1 : 0);
    if (score === 3) return "Strong";
    if (score === 2) return "Moderate";
    if (score === 1) return "Weak";
    return panels.length > 0 ? "Weak" : "—";
  })();
  const cliffhangerColor =
    cliffhangerScore === "Strong"
      ? "text-emerald-400"
      : cliffhangerScore === "Moderate"
      ? "text-amber-400"
      : cliffhangerScore === "—"
      ? "text-neutral-500"
      : "text-rose-400";

  // Real Live Search Data
  const [allProjects, setAllProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (fetchWithInterceptor) {
      setIsLoadingProjects(true);
      getProjects(fetchWithInterceptor)
        .then((res: any) => {
          if (isMounted && res?.data) {
            setAllProjects(Array.isArray(res.data) ? res.data : []);
          }
        })
        .catch(() => {})
        .finally(() => {
          if (isMounted) setIsLoadingProjects(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [fetchWithInterceptor]);

  const q = searchQuery.trim().toLowerCase();

  const matchedProjects = q
    ? allProjects
        .filter((p) => {
          const title = (p.title || p.name || "").toLowerCase();
          const genre = (p.genre || "").toLowerCase();
          const synopsis = (p.synopsis || p.description || "").toLowerCase();
          const author = (p.author || "").toLowerCase();
          return (
            title.includes(q) ||
            genre.includes(q) ||
            synopsis.includes(q) ||
            author.includes(q)
          );
        })
        .slice(0, 5)
    : [];

  const matchedPanels = q
    ? panels
        .filter((panel, idx) => {
          const idxStr = String(idx + 1);
          const idStr = String(panel.id || "");
          const speech = (panel.speech_text || "").toLowerCase();
          const narrative = (panel.narrative || "").toLowerCase();
          const sfx = (panel.sfx || "").toLowerCase();
          return (
            idxStr === q ||
            idStr.includes(q) ||
            speech.includes(q) ||
            narrative.includes(q) ||
            sfx.includes(q)
          );
        })
        .slice(0, 5)
    : [];

  const hasAnyResults = matchedProjects.length > 0 || matchedPanels.length > 0;

  return (
    <header
      id="header_pane"
      className="w-full h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 select-none shadow-md shadow-black/20"
    >
      {/* Left side: Hamburger, Brand, and User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        {/* NEW: Wrapper added here to perfectly match the 80px (w-20) width of the mini sidebar */}
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-4">
          <Tooltip text="Toggle Navigation Menu" placement="bottom" shortcut="Ctrl+B">
            <button
              onClick={onToggleSidebar}
              className="h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              <Menu className="h-4 w-4" />
            </button>
          </Tooltip>
        </div>

        <SonikomaLogo
          size="sm"
          onClick={() => navigateTo("/dashboard")}
        />
      </div>

      {/* Center Side: Global Search Bar */}
      <GlobalSearchBar className="hidden md:flex flex-1 max-w-xs lg:max-w-sm mx-4" />

      {/* Right side: Volume, Notifications, Stats, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
        {/* Server Status Pill */}
        <ServerStatusIndicator status={backendStatus} />

        {/* 🤖 Global AI Model Selector */}
        <AIModelSelector className="flex" />

        {/* 🧼 Speech Bubble Cleaning Processing Pill */}
        {isCleaningBubbles && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-[10px] font-bold font-sans text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] animate-pulse select-none">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400 shrink-0" />
            <span>
              {cleanProgress
                ? `Cleaning Bubbles (${cleanProgress.current}/${cleanProgress.total})`
                : "Cleaning Bubbles..."}
            </span>
          </div>
        )}

        {/* ✂️ Auto-Cropping Panels Processing Pill */}
        {isBatchCropping && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-[10px] font-bold font-sans text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse select-none">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
            <span>
              {batchProgress
                ? `Cropping Panels (${batchProgress.current}/${batchProgress.total})`
                : "Cropping Panels..."}
            </span>
          </div>
        )}

        {/* ⚡ Credits Pill & Popover */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <Tooltip text="Credits & Daily Rewards" placement="bottom">
              <button
                onClick={() => {
                  setShowCreditsPopover(!showCreditsPopover);
                  setShowNotifications(false);
                  setShowStats(false);
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
          <Tooltip text="Notifications" placement="bottom">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowStats(false);
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
              projectState === "missing"
                ? `Project Unavailable: ${missingProjectInfo?.missingId || activeProjectId}`
                : projectState === "loading"
                ? "Loading project workspace..."
                : projectState === "active"
                ? `Active Project: ${activeProjectData?.project?.title || "Active"}`
                : "Select Active Project"
            }
            placement="bottom"
          >
            <button
              onClick={() => setDrawerOpen(true)}
              className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative ${
                projectState === "active"
                  ? "text-blue-400 border-blue-500/40 bg-blue-500/10"
                  : projectState === "missing"
                  ? "text-rose-400 border-rose-500/40 bg-rose-500/10"
                  : ""
              }`}
              aria-label="Active Project Selector"
            >
              {projectState === "missing" ? (
                <AlertCircle className="h-4 w-4 text-rose-400" />
              ) : projectState === "loading" ? (
                <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
              ) : (
                <FolderSync className="h-4 w-4" />
              )}

              {projectState === "active" && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[#0D0E12] animate-pulse" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* User Profile Pill at Far Right End */}
        <Tooltip text="View Profile & Settings" placement="bottom">
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="h-8.5 flex items-center gap-2 pl-3 pr-1.5 rounded-xl bg-[#202127] hover:bg-[#282a32] border border-[#33353e] hover:border-[#4b4e5c] transition-all cursor-pointer select-none group shrink-0 shadow-2xs active:scale-95"
            aria-label="Open User profile"
          >
            <span className="text-xs font-semibold text-white truncate max-w-[120px] hidden sm:inline">
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
        </Tooltip>
      </div>
    </header>
  );
};

const Header = React.memo(HeaderInner);
export default Header;
