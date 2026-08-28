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
} from "lucide-react";
import VideoCustomizeLayoutModal from "./VideoCustomizeLayoutModal";
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
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
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
      <header className="h-16 w-full bg-[#06060c]/80 backdrop-blur-2xl border-b border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(168,85,247,0.08)] pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 flex items-center justify-between z-30 shrink-0 select-none gap-2 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
          <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-white/5 h-full mr-1 sm:mr-2">
            <button
              onClick={onToggleSidebar}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-purple-500/15 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
              title="Toggle Sidebar Drawer"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          <div
            className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
            onClick={() => navigateTo && navigateTo("/dashboard")}
          >
            <img
              src="/logo-dark.png"
              alt="Sonikoma Logo"
              className="h-8 w-8 sm:h-9 sm:w-9 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover transition-all duration-300 animate-[fadeIn_0.3s_ease-out] group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
            />
            <span className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
              Sonikoma
            </span>
          </div>
        </div>

        {/* Server Status Indicator */}
        <div className="flex items-center justify-center">
          <ServerStatusIndicator status={backendStatus} onClick={recheckBackend} />
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* 🤖 Global AI Model Selector */}
          <AIModelSelector compact className="flex" />

          {/* ⚡ Credits Pill & Popover (Image 1 Style) */}
          {credits !== null && (
            <div className="relative" ref={creditsRef}>
              <button
                onClick={() => {
                  setShowCreditsPopover(!showCreditsPopover);
                  setShowNotifications(false);
                }}
                title="Your credit balance & daily rewards — click to view"
                className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1 sm:py-1.5 rounded-full border border-[#2b2d35] bg-[#18191e] hover:bg-[#202127] text-amber-400 hover:border-amber-500/40 text-[10px] sm:text-xs font-black font-mono select-none cursor-pointer transition-all shadow-sm"
              >
                <Zap className="h-3.5 sm:h-4 w-3.5 sm:w-4 shrink-0 fill-amber-400 text-amber-400" />
                <span>{credits.toLocaleString()}</span>
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

          <div className="hidden lg:flex items-center gap-1 p-1 bg-[#121218] border border-neutral-800/90 rounded-xl">
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
              className="relative w-9 h-9 rounded-xl border border-neutral-700/60 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700/80 transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              {notificationsMuted ? (
                <BellOff className="h-4 w-4 text-rose-500" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-extrabold border-2 border-[#09090e] shadow-sm">
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
              className="w-9 h-9 rounded-xl border border-neutral-700/60 bg-neutral-800/80 text-neutral-300 hover:text-purple-300 hover:bg-purple-500/10 transition-all cursor-pointer flex items-center justify-center relative shadow-sm"
              title={
                activeProjectId && activeProjectData
                  ? `Active Project: ${
                      activeProjectData.project?.title || "Active"
                    } — Click to switch`
                  : "Select Active Project"
              }
            >
              <FolderSync className="h-4 w-4 text-purple-400" />
              {activeProjectId && activeProjectData && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
              )}
            </button>
          </div>

          {/* Save Button (to the left of Profile Picture & Name) */}
          {onSave && (
            <button
              onClick={onSave}
              disabled={isSaving}
              className={`px-3.5 h-8 rounded-lg font-extrabold text-xs transition-all flex items-center gap-1.5 border shrink-0 cursor-pointer active:scale-95 ${
                isSaving
                  ? "bg-purple-900/40 text-purple-200 cursor-wait border-purple-500/30"
                  : isDirty
                  ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 shadow-[0_0_12px_rgba(168,85,247,0.3)] animate-pulse"
                  : "bg-neutral-850 hover:bg-neutral-800 text-neutral-300 border-neutral-750"
              }`}
              title={isDirty ? "Save Unsaved Changes" : "Project Saved"}
            >
              <Save
                className={`h-3.5 w-3.5 ${
                  isSaving
                    ? "animate-spin text-purple-200"
                    : isDirty
                    ? "text-purple-300"
                    : "text-neutral-400"
                }`}
              />
              <span>{isSaving ? "Saving..." : isDirty ? "Save*" : "Save"}</span>
            </button>
          )}

          {/* User Profile Pill at Far Right End (Matches MainHeader) */}
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-purple-500/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95"
            title="View Profile & Account Settings"
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
        </div>
      </header>

      <VideoCustomizeLayoutModal
        isOpen={showCustomizeLayout}
        onClose={() => setShowCustomizeLayout(false)}
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
