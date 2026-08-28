import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  ChevronLeft,
  ChevronRight,
  Bell,
  BellOff,
  Menu,
  Zap,
  FolderSync,
} from "lucide-react";
import { ImageTool } from "@/features/editor_image/hooks/useImageEditorState";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { HeaderCreditsPopover } from "@/features/ai_core";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { useBackendHealth } from "@/shared/hooks";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";
import { AIModelSelector } from "@/features/ai_core";

interface ImageEditorHeaderProps {
  editingImageIdx: number | null;
  scrapedImages: string[];
  handlePrevImage: () => void;
  handleNextImage: () => void;
  handleUndo: () => void;
  historyLength: number;
  handleRedo: () => void;
  redoHistoryLength: number;
  handleDeleteCurrentImage: () => void;
  setEditingImageIdx: (idx: number | null) => void;
  activeTab: ImageTool | string;
  isPipMode: boolean;
  setIsPipMode?: (val: boolean) => void;
  slices: any[];
  isToolsPanelOpen: boolean;
  setIsToolsPanelOpen: (val: boolean | ((prev: boolean) => boolean)) => void;
  handleExecuteSave?: () => void;

  // New Header Props:
  user?: any;
  notifications?: any[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  navigateTo?: (path: string) => void;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  fetchWithInterceptor?: any;
  addNotification?: (message: string, type?: string) => void;
}

export const ImageEditorHeader: React.FC<ImageEditorHeaderProps> = ({
  editingImageIdx,
  scrapedImages,
  handlePrevImage,
  handleNextImage,
  handleUndo,
  historyLength,
  handleRedo,
  redoHistoryLength,
  handleDeleteCurrentImage,
  setEditingImageIdx,
  activeTab,
  isPipMode,
  setIsPipMode,
  slices,
  isToolsPanelOpen,
  setIsToolsPanelOpen,
  handleExecuteSave,

  // New Header Props:
  user,
  notifications = [],
  markNotificationAsRead = () => {},
  markAllNotificationsAsRead = () => {},
  deleteNotification = () => {},
  clearAllNotifications = () => {},
  notificationsMuted = false,
  setNotificationsMuted,
  themeMode = "dark",
  toggleThemeMode,
  onToggleSidebar,
  isSidebarOpen = false,
  navigateTo,
  seriesSlug,
  chapterSlug,
  fetchWithInterceptor,
  addNotification,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    user?.credits !== undefined ? user.credits : null
  );

  const { activeProjectId, activeProjectData, setDrawerOpen } =
    useProjectStore();
  const { status: backendStatus, checkHealth: recheckBackend } = useBackendHealth();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);

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
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleLogoClick = () => {
    const target = resolveWorkspaceReturnPath({
      seriesSlug,
      chapterSlug,
      searchParams: window.location.search,
    });
    if (navigateTo) {
      navigateTo(target);
    } else {
      window.history.pushState({}, "", target);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  const hasMultipleImages = scrapedImages.length > 1;

  return (
    <header className="sticky top-0 left-0 right-0 h-16 w-full bg-[#0a0b10] border-b border-white/8 shadow-[0_4px_32px_rgba(0,0,0,0.6)] flex items-center justify-between pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 flex-shrink-0 z-50 selection:bg-purple-650 relative gap-2 sm:gap-4">
      {/* ── Left: Hamburger, Brand Logo, Mode Badge & Image Pagination ──── */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        {onToggleSidebar && (
          <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-white/5 h-full mr-1 sm:mr-2">
            <button
              onClick={onToggleSidebar}
              className="w-9 h-9 sm:w-11 sm:h-11 rounded-2xl bg-white/[0.04] border border-white/8 flex items-center justify-center text-neutral-300 hover:text-purple-300 hover:bg-purple-500/15 hover:border-purple-500/30 cursor-pointer transition-all duration-300 active:scale-95 shadow-sm"
              title="Toggle Navigation Menu"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        )}

        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={handleLogoClick}
        >
          <img
            key={themeMode}
            src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
            }}
            className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover transition-all duration-300 animate-[fadeIn_0.3s_ease-out] group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]"
            style={{
              background: themeMode === "light" ? "#ffffff" : "#000000",
            }}
            alt="Sonikoma Logo"
          />
          <span className="font-black text-base sm:text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
            Sonikoma
          </span>
        </div>

        <span className="hidden sm:inline-block px-2.5 py-1 text-[10px] font-black tracking-wider text-purple-300 bg-purple-950/70 rounded-full border border-purple-700/50 shadow-xs uppercase">
          IMAGE EDITOR
        </span>

        {scrapedImages && scrapedImages.length > 0 && (
          <div className="flex items-center space-x-1 bg-neutral-900/90 rounded-xl px-1.5 py-1 border border-white/8 shadow-xs">
            <button
              onClick={handlePrevImage}
              disabled={editingImageIdx === null || editingImageIdx <= 0}
              className={`p-1 rounded-lg transition ${
                editingImageIdx !== null && editingImageIdx > 0
                  ? "text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer active:scale-95"
                  : "text-neutral-600 cursor-not-allowed opacity-35"
              }`}
              title="Previous Image (← Left Arrow)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-neutral-300 min-w-[2.8rem] text-center font-mono">
              {editingImageIdx !== null ? editingImageIdx + 1 : 1} /{" "}
              {scrapedImages.length}
            </span>
            <button
              onClick={handleNextImage}
              disabled={
                editingImageIdx === null ||
                editingImageIdx >= scrapedImages.length - 1
              }
              className={`p-1 rounded-lg transition ${
                editingImageIdx !== null &&
                editingImageIdx < scrapedImages.length - 1
                  ? "text-neutral-300 hover:text-white hover:bg-white/10 cursor-pointer active:scale-95"
                  : "text-neutral-600 cursor-not-allowed opacity-35"
              }`}
              title="Next Image (→ Right Arrow)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ── Right: AI Routing, Credits, Notifications, Profile & Actions ─── */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* 🟢 Server Status Indicator */}
        <ServerStatusIndicator status={backendStatus} onClick={recheckBackend} />

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
              className="flex h-9 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 rounded-full border border-[#2b2d35] bg-[#18191e] hover:bg-[#202127] text-amber-400 hover:border-amber-500/40 text-[10px] sm:text-xs font-black font-mono select-none cursor-pointer transition-all shadow-sm"
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

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowCreditsPopover(false);
            }}
            className={`h-9 w-9 flex items-center justify-center text-neutral-400 hover:text-white rounded-xl bg-neutral-900 border border-neutral-800 hover:border-white/20 transition-all relative cursor-pointer active:scale-95 ${
              showNotifications ? "bg-neutral-800 text-white border-white/20" : ""
            }`}
            title="Notifications"
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
                if (navigateTo) navigateTo("/notifications");
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
            className="h-9 w-9 flex items-center justify-center text-neutral-400 hover:text-purple-300 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 hover:bg-purple-500/10 transition-all relative cursor-pointer active:scale-95"
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
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
            )}
          </button>
        </div>

        {/* User Profile Pill at Far Right (Image 2 Style) */}
        <button
          onClick={() => navigateTo && navigateTo("/profile")}
          className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-purple-500/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95 h-9"
          title="View Profile & Account Settings"
          aria-label="Open User profile"
        >
          <span className="text-xs font-bold text-white group-hover:text-purple-200 truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-lg bg-[#24252c] border border-white/5">
            {user?.full_name ||
              user?.username ||
              (user?.email ? user.email.split("@")[0] : "Studio Creator")}
          </span>
          <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#8b5cf6] bg-[#201833] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.35)] flex items-center justify-center group-hover:border-purple-400 transition-all duration-300">
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
              className="w-full h-full object-cover"
            />
          </div>
        </button>

        <div className="w-px h-6 bg-white/10 mx-0.5 hidden sm:block" />

        <button
          onClick={() => {
            const target = resolveWorkspaceReturnPath({
              seriesSlug,
              chapterSlug,
              searchParams: window.location.search,
            });
            if (navigateTo) {
              navigateTo(target);
            } else {
              window.history.pushState({}, "", target);
              window.dispatchEvent(new Event("popstate"));
            }
          }}
          className="h-8 px-2.5 text-[11px] font-medium text-neutral-300 hover:text-white bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-xs"
        >
          <X className="w-3.5 h-3.5 text-neutral-400" />
          <span>Cancel</span>
        </button>

        <button
          onClick={() => {
            if (handleExecuteSave) {
              handleExecuteSave();
            } else {
              // Fallback
              window.dispatchEvent(new Event("FABRIC_REQUEST_SAVE"));
              setEditingImageIdx(null);
            }
          }}
          className="h-8 px-3 text-[11px] font-semibold text-white bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg transition-all flex items-center gap-1 shadow-[0_2px_10px_rgba(139,92,246,0.25)] hover:shadow-[0_4px_16px_rgba(139,92,246,0.45)] border border-purple-400/30 cursor-pointer active:scale-95"
        >
          <Check className="w-3.5 h-3.5 text-purple-200" />
          <span>Apply Changes</span>
        </button>
      </div>
    </header>
  );
};
