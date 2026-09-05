import React, { useEffect, useRef, useState } from "react";
import {
  Cloud,
  ChevronDown,
  Sparkles,
  Loader2,
  CheckCircle2,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Zap,
  Save,
  Menu,
  Film,
  FolderSync,
  Keyboard,
} from "lucide-react";
import VideoCustomizeLayoutModal from "./VideoCustomizeLayoutModal";
import VideoShortcutsHelpModal from "./VideoShortcutsHelpModal";
import ProjectConfirmModal from "@/shared/ui/modal/ProjectConfirmModal";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { HeaderCreditsPopover } from "@/features/ai_core";
import { Notification } from "@/features/app_notification";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { AIModelSelector } from "@/features/ai_core";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { SonikomaLogo } from "@/shared/ui/branding";
import { useBackendHealth } from "@/shared/hooks";

interface VideoEditorHeaderProps {
  seriesTitle?: string;
  chapterTitle?: string;
  chapterNumber?: string;
  onBackToApp: () => void;
  onExport?: () => void;
  isRendering?: boolean;
  renderProgress?: number;
  onSave?: () => void;
  isSaving?: boolean;
  isDirty?: boolean;
  userCredits?: number | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  backendOnline?: boolean;
  panelsCount?: number;
  notifications?: Notification[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  layoutConfig?: {
    mediaBin?: boolean;
    rightInspector?: boolean;
    timeline?: boolean;
  };
  onTogglePanel?: (panel: "mediaBin" | "rightInspector" | "timeline") => void;
  onNavigateToAll?: () => void;
  navigateTo?: (path: string) => void;
  fetchWithInterceptor?: any;
  user?: any;
  addNotification?: (message: string, type?: string) => void;
  layoutMode?: "standard" | "full_timeline" | "preview_only";
  onLayoutModeChange?: (mode: "standard" | "full_timeline" | "preview_only") => void;
}

const VideoEditorHeader: React.FC<VideoEditorHeaderProps> = ({
  seriesTitle,
  chapterTitle,
  chapterNumber,
  onBackToApp,
  onExport,
  isRendering = false,
  renderProgress = 0,
  onSave,
  isSaving = false,
  isDirty = false,
  userCredits,
  onToggleSidebar,
  isSidebarOpen = false,
  layoutConfig,
  onTogglePanel,
  backendOnline = true,
  panelsCount = 0,
  notifications = [],
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  notificationsMuted = false,
  setNotificationsMuted,
  onNavigateToAll,
  navigateTo,
  fetchWithInterceptor,
  user,
  addNotification,
  layoutMode = "standard",
  onLayoutModeChange,
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

  const [showCustomizeLayout, setShowCustomizeLayout] = useState(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [credits, setCredits] = useState<number | null>(
    userCredits !== undefined && userCredits !== null
      ? userCredits
      : activeUser?.credits !== undefined
      ? activeUser.credits
      : null
  );

  const { activeProjectId, activeProjectData, setDrawerOpen } =
    useProjectStore();
  const { status: backendStatus, checkHealth: recheckBackend } = useBackendHealth();

  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const creditsRef = useRef<HTMLDivElement | null>(null);

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
    if (userCredits !== undefined && userCredits !== null) {
      setCredits(userCredits);
    } else if (user?.credits !== undefined) {
      setCredits(user.credits);
    }
  }, [userCredits, user?.credits]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        creditsRef.current &&
        !creditsRef.current.contains(e.target as Node)
      ) {
        setShowCreditsPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const displayTitle =
    seriesTitle && chapterTitle
      ? `${seriesTitle} · ${chapterTitle}`
      : seriesTitle ?? "Cyberpunk Story";

  return (
    <>
      <header className="w-full min-w-0 h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 select-none shadow-md shadow-black/20 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden z-30">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
          <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-white/5 h-full mr-1 sm:mr-2">
            <button
              onClick={onToggleSidebar}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-[#3B82F6]/15 hover:border-[#3B82F6]/30 text-neutral-400 hover:text-[#93C5FD] transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
              title="Toggle Sidebar Drawer"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <SonikomaLogo
            size="sm"
            onClick={() => navigateTo && navigateTo("/dashboard")}
          />
        </div>

        {/* ── Studio Layout Mode Segmented Switcher ─────────────────────── */}
        <div className="hidden md:flex items-center p-1 bg-[#121212] border border-[#2F2F2F] rounded-2xl shadow-inner shrink-0">
          <button
            type="button"
            onClick={() => onLayoutModeChange?.("standard")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              layoutMode === "standard"
                ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            title="Standard Studio Split Mode"
          >
            <Film className="w-3.5 h-3.5" />
            <span>Studio</span>
          </button>
          <button
            type="button"
            onClick={() => onLayoutModeChange?.("full_timeline")}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              layoutMode === "full_timeline"
                ? "bg-[#3B82F6] text-white border border-[#60A5FA]/40 shadow-sm"
                : "text-neutral-400 hover:text-white hover:bg-neutral-800"
            }`}
            title="Full Page Multi-Track Timeline Mode"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Full Timeline</span>
          </button>
        </div>

        {/* Server Status Indicator */}
        <div className="flex items-center justify-center">
          <ServerStatusIndicator status={backendStatus} onClick={recheckBackend} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
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
                className={`h-8.5 flex items-center gap-1.5 px-3 rounded-xl bg-[#2A2A2A] hover:bg-[#2A2A2A] border border-[#2A2A2A] hover:border-[#2F2F2F] text-xs font-medium text-white transition-all shadow-2xs select-none shrink-0 cursor-pointer active:scale-95 ${
                  showCreditsPopover ? "ring-2 ring-amber-500/40 border-amber-500/60 bg-[#2A2A2A]" : ""
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
                      if (navigateTo) navigateTo("/profile?tab=billing");
                    }}
                  />
                </div>
              )}
            </div>
          )}

          <div className="hidden lg:flex items-center gap-1 p-1 bg-[#121212] border border-neutral-800/90 rounded-xl">
            <button
              type="button"
              onClick={() => setShowShortcutsModal(true)}
              className="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              title="Keyboard Shortcuts (?)"
            >
              <Keyboard className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setShowCustomizeLayout(true)}
              className="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              title="Customize Layout"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-none stroke-current stroke-2"
              >
                <rect x="3" y="4" width="4" height="16" rx="1" />
                <rect x="10" y="4" width="11" height="7" rx="1" />
                <rect x="10" y="13" width="11" height="7" rx="1" />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onTogglePanel?.("mediaBin")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                layoutConfig?.mediaBin
                  ? "bg-neutral-800 text-white border border-neutral-700/60 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={
                layoutConfig?.mediaBin
                  ? "Hide Media Bin (Left Panel)"
                  : "Show Media Bin (Left Panel)"
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-none stroke-current stroke-2"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <rect
                  x="3"
                  y="4"
                  width="8"
                  height="16"
                  rx="1"
                  className="fill-current stroke-none"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onTogglePanel?.("timeline")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                layoutConfig?.timeline
                  ? "bg-neutral-800 text-white border border-neutral-700/60 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={
                layoutConfig?.timeline
                  ? "Hide Timeline (Bottom Panel)"
                  : "Show Timeline (Bottom Panel)"
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-none stroke-current stroke-2"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <rect
                  x="3"
                  y="12"
                  width="18"
                  height="8"
                  rx="1"
                  className="fill-current stroke-none"
                />
              </svg>
            </button>

            <button
              type="button"
              onClick={() => onTogglePanel?.("rightInspector")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                layoutConfig?.rightInspector
                  ? "bg-neutral-800 text-white border border-neutral-700/60 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={
                layoutConfig?.rightInspector
                  ? "Hide Property Inspector (Right Panel)"
                  : "Show Property Inspector (Right Panel)"
              }
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4 fill-none stroke-current stroke-2"
              >
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <rect
                  x="13"
                  y="4"
                  width="8"
                  height="16"
                  rx="1"
                  className="fill-current stroke-none"
                />
              </svg>
            </button>
          </div>

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => {
                setShowNotifications((v) => !v);
                setShowCreditsPopover(false);
              }}
              title="Notifications"
              className={`h-8.5 w-8.5 flex items-center justify-center rounded-xl bg-[#2A2A2A] hover:bg-[#2A2A2A] border border-[#2A2A2A] hover:border-[#2F2F2F] text-neutral-300 hover:text-white transition-all shadow-2xs cursor-pointer active:scale-95 shrink-0 relative ${
                showNotifications ? "ring-2 ring-blue-500/40 border-blue-500 bg-[#2A2A2A]" : ""
              }`}
            >
              {notificationsMuted ? (
                <BellOff className="h-4 w-4 text-rose-400" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 flex h-4.5 w-4.5 min-w-[18px] items-center justify-center rounded-full bg-[#FF2D55] text-[10px] font-black text-white ring-2 ring-[#18181B] shadow-xs">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>
            {showNotifications && (
              <NotificationDropdown
                notifications={notifications}
                onClose={() => setShowNotifications(false)}
                onMarkAsRead={(id: number) => markNotificationAsRead?.(id)}
                onMarkAllAsRead={() => markAllNotificationsAsRead?.()}
                onDelete={(id: number) => deleteNotification?.(id)}
                onClearAll={() => clearAllNotifications?.()}
                onNavigateToAll={() => onNavigateToAll?.()}
                notificationsMuted={notificationsMuted}
                onToggleMute={() =>
                  setNotificationsMuted?.(!notificationsMuted)
                }
              />
            )}
          </div>

          {/* Active Project Selector Icon Button */}
          <div className="relative">
            <button
              onClick={() => setDrawerOpen(true)}
              className="w-9 h-9 rounded-xl border border-neutral-700/60 bg-neutral-800/80 text-neutral-300 hover:text-[#93C5FD] hover:bg-[#3B82F6]/10 transition-all cursor-pointer flex items-center justify-center relative shadow-sm"
              title={
                activeProjectId && activeProjectData
                  ? `Active Project: ${
                      activeProjectData.project?.title || "Active"
                    } — Click to switch`
                  : "Select Active Project"
              }
            >
              <FolderSync className="h-4 w-4 text-[#3B82F6]" />
              {activeProjectId && activeProjectData && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
              )}
            </button>
          </div>

          {/* User Profile Pill at Far Right End (Matches MainHeader) */}
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-[#3B82F6]/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8b5cf6] focus-visible:ring-offset-2 focus-visible:ring-offset-[#07080c]"
            title="View Profile & Account Settings"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-white group-hover:text-[#3B82F6] truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-lg bg-[#1E1E1E] border border-white/5">
              {activeUser?.full_name ||
                activeUser?.username ||
                (activeUser?.email ? activeUser.email.split("@")[0] : "Studio Creator")}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#3B82F6] bg-[#121212] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.35)] flex items-center justify-center group-hover:border-[#60A5FA] transition-all duration-300">
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
        </div>
      </header>

      <VideoCustomizeLayoutModal
        isOpen={showCustomizeLayout}
        onClose={() => setShowCustomizeLayout(false)}
      />

      <VideoShortcutsHelpModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />

      <ProjectConfirmModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        initialDetails={{
          seriesTitle: seriesTitle || activeProjectData?.project?.title || "",
          chapterNumber: chapterNumber || activeProjectData?.project?.chapterNumber || "",
          chapterTitle: chapterTitle || activeProjectData?.project?.chapterTitle || "",
          scrapedGenre: activeProjectData?.project?.genre || "",
          seriesAuthor: activeProjectData?.project?.author || "",
          seriesCoverImage:
            activeProjectData?.project?.cover_image ||
            activeProjectData?.project?.first_panel_image ||
            activeProjectData?.panels?.[0]?.image_url ||
            activeProjectData?.scrapedImages?.[0] ||
            "",
          seriesSynopsis: activeProjectData?.project?.synopsis || "",
          status: activeProjectData?.project?.status || "Draft",
        }}
        onConfirm={async (_details, _shouldGenerate) => {
          onSave?.();
          setShowSaveModal(false);
          return true;
        }}
      />
    </>
  );
};

export default React.memo(VideoEditorHeader);
