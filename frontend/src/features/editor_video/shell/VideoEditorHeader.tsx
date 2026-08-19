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
import { useProjectStore } from "@/store/useProjectStore";
import { AIModelSelector } from "@/features/ai_core";

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
  const [showCustomizeLayout, setShowCustomizeLayout] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    userCredits !== undefined && userCredits !== null
      ? userCredits
      : user?.credits !== undefined
      ? user.credits
      : null
  );

  const { activeProjectId, activeProjectData, setDrawerOpen } =
    useProjectStore();

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
      <header className="h-16 w-full bg-[#06060c]/80 backdrop-blur-2xl border-b border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(168,85,247,0.08)] pr-6 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-3 shrink-0 h-full">
          <div className="w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-white/5 h-full mr-2">
            <button
              onClick={onToggleSidebar}
              className="w-11 h-11 rounded-2xl bg-white/[0.04] border border-white/8 hover:bg-purple-500/15 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 transition-all duration-300 flex items-center justify-center cursor-pointer shadow-sm active:scale-95"
              title="Toggle Sidebar Drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div
            className="flex items-center gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
            onClick={() => navigateTo && navigateTo("/dashboard")}
          >
            <img
              src="/logo-dark.png"
              alt="Sonikoma Logo"
              className="h-9 w-9 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover transition-all duration-300 animate-[fadeIn_0.3s_ease-out] group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
            />
            <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
              Sonikoma
            </span>
          </div>

          <div className="flex items-center gap-2 ml-1 bg-[#121218] border border-neutral-800 px-3 py-1 rounded-lg text-xs font-semibold text-neutral-200 cursor-pointer hover:border-neutral-700 transition-all max-w-[240px] truncate">
            <span className="text-neutral-400 font-normal shrink-0">
              Project:
            </span>
            <span className="font-semibold text-white truncate">
              {displayTitle}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          </div>
        </div>

        <div className="hidden md:flex items-center justify-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider ${
              backendOnline
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                : "bg-red-500/10 border-red-500/30 text-red-400"
            }`}
          >
            {backendOnline ? (
              <Wifi className="h-3 w-3" />
            ) : (
              <WifiOff className="h-3 w-3" />
            )}
            <span>{backendOnline ? "ONLINE" : "OFFLINE"}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* ⚡ Credits Pill & Popover */}
          {/* 🤖 Global AI Model Selector */}
          <AIModelSelector className="hidden sm:inline-flex" />

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

          {/* User Profile Pill at Far Right End (Image 3 Style) */}
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-850 transition-all cursor-pointer select-none group shrink-0 ml-1 shadow-sm active:scale-95"
            title="View Profile & Account Settings"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-neutral-300 group-hover:text-white truncate max-w-[120px] hidden sm:inline font-sans px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-750">
              {user?.full_name ||
                user?.username ||
                (user?.email ? user.email.split("@")[0] : "Studio Creator")}
            </span>
            <img
              key={user?.avatar_url || user?.full_name || "avatar"}
              src={getUserAvatarUrl(user)}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.onerror = null;
                target.src = DEFAULT_USER_AVATAR_DATA_URI;
              }}
              alt="User Avatar"
              className="w-6 h-6 rounded-full object-cover border border-purple-500/40 shrink-0 shadow-xs bg-purple-950/40"
            />
          </button>

          {/* Save Button */}
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

          {/* Export Button */}
          <button
            onClick={onExport}
            disabled={isRendering}
            className={`relative overflow-hidden px-4 h-8 rounded-lg font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 border shrink-0 ${
              isRendering
                ? "bg-purple-900/60 text-purple-200 cursor-wait border-purple-500/30"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-white/10 cursor-pointer shadow-[0_0_14px_rgba(139,92,246,0.4)] hover:shadow-[0_0_22px_rgba(139,92,246,0.6)] active:scale-95"
            }`}
          >
            {isRendering ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-300" />
                <span>Exporting {renderProgress}%</span>
              </>
            ) : (
              <>
                <Film className="h-3.5 w-3.5 text-purple-200" />
                <span>EXPORT</span>
              </>
            )}
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
          seriesTitle: seriesTitle ?? "",
          chapterNumber: chapterNumber ?? "",
          chapterTitle: chapterTitle ?? "",
          scrapedGenre: "",
          seriesAuthor: "",
          seriesCoverImage: "",
          seriesSynopsis: "",
          status: "Draft",
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
