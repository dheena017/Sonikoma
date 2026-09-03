import React, { useEffect, useRef, useState } from "react";
import {
  Focus,
  LayoutPanelTop,
  Save,
  Menu,
  Layers,
  Clock,
  Wifi,
  WifiOff,
  Share2,
  Bell,
  BellOff,
  Zap,
  Monitor,
  FolderSync,
  Globe,
  User,
  Tag,
  ExternalLink,
  BookOpen,
} from "lucide-react";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { Notification } from "@/features/app_notification";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import { HeaderCreditsPopover } from "@/features/ai_core";
import { useImageEditorStore } from "@/features/editor_studio/hooks/useEditorState";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { useBackendHealth } from "@/shared/hooks";
import { AIModelSelector } from "@/features/ai_core";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { Tooltip } from "@/shared/ui/common/TooltipPortal";

interface EditorPageHeaderProps {
  title: string;
  subtitle?: string;

  onSave: () => void;
  isSaving: boolean;
  isDirty?: boolean;
  isFocusMode: boolean;
  setIsFocusMode: React.Dispatch<React.SetStateAction<boolean>>;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  isSidebarOpen?: boolean;
  className?: string;
  style?: React.CSSProperties;
  panelsCount?: number;
  backendOnline?: boolean;
  notifications?: Notification[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  onNavigateToAll?: () => void;
  onBackToApp?: () => void;
  fetchWithInterceptor?: any;
  navigateTo?: (path: string) => void;
  user?: any;
  addNotification?: (message: string, type?: string) => void;
}

const EditorPageHeader: React.FC<EditorPageHeaderProps> = ({
  title,
  subtitle,
  onBackToApp,
  onSave,
  isSaving,
  isDirty = false,
  isFocusMode,
  setIsFocusMode,
  onToggleSidebar,
  isSidebarCollapsed,
  isSidebarOpen = false,
  className,
  style,
  panelsCount = 0,
  backendOnline = true,
  notifications = [],
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  notificationsMuted = false,
  setNotificationsMuted,
  onNavigateToAll,
  fetchWithInterceptor,
  navigateTo,
  user,
  addNotification,
}) => {
  const isPlayerOpen = useImageEditorStore(
    (state) => state.playerSettings.isPlayerOpen
  );
  const { activeProjectId, activeProjectData, setDrawerOpen } =
    useProjectStore();
  const { status: backendStatus, checkHealth: recheckBackend } = useBackendHealth();

  // Smoothly slide out of view if the mobile/drawer sidebar is open
  const headerVisibilityClass = isSidebarOpen
    ? "-translate-y-full opacity-0 pointer-events-none"
    : "opacity-100";

  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const creditsRef = useRef<HTMLDivElement | null>(null);
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
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        creditsRef.current &&
        !creditsRef.current.contains(event.target as Node)
      ) {
        setShowCreditsPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const project = activeProjectData?.project;
  const projectUrl = project?.url;
  const projectAuthor = project?.author;
  const projectGenre = project?.genre;
  const coverImage = project?.cover_image;

  const websiteInfo = (() => {
    if (!projectUrl) return null;
    try {
      const host = new URL(
        projectUrl.startsWith("http") ? projectUrl : `https://${projectUrl}`
      ).hostname
        .toLowerCase()
        .replace(/^www\./, "");

      if (!host) return null;

      // Dynamically format clean display name from root domain (e.g. webcomicsapp -> Webcomicsapp)
      const domainParts = host.split(".");
      const mainName = domainParts.length > 1 ? domainParts[domainParts.length - 2] : domainParts[0];
      const displayName = mainName
        .split(/[-_]/)
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      return {
        name: displayName,
        domain: host,
        badgeColor: "bg-[#3B82F6]/15 text-[#60A5FA] border-[#3B82F6]/30",
      };
    } catch {
      return null;
    }
  })();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] h-16 flex min-w-0 flex-nowrap items-center justify-between gap-2 sm:gap-3 border-b border-white/8 bg-[#06060c]/90 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(59,130,246,0.08)] pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${headerVisibilityClass} ${
        className || ""
      }`}
      style={style}
    >
      {/* Left Section - Menu Icon + Title + Metadata */}
      <div className="flex items-center shrink-0 h-full">
        {/* PREMIUM ALIGNMENT FIX: w-20 wrapper perfectly aligns the menu button above the mini-sidebar */}
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-white/5 h-full mr-1.5 sm:mr-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-[#3B82F6]/15 hover:border-[#3B82F6]/30 text-neutral-400 hover:text-[#93C5FD] cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-center shadow-sm"
              title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={onBackToApp}
        >
          {coverImage ? (
            <img
              src={coverImage}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt={title}
              className="h-10 w-10 rounded-xl bg-[#1E1E1E] object-cover border border-[#2F2F2F] shrink-0 shadow-md"
            />
          ) : (
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt="Sonikoma Logo"
              className="h-10 w-10 rounded-full bg-[#1E1E1E] object-cover border border-[#2F2F2F] shrink-0 shadow-md"
            />
          )}

          <div className="min-w-0 hidden sm:block max-w-[280px] md:max-w-[340px] lg:max-w-[420px]">
            {/* Top Workspace & Source Website Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-[#3B82F6]/90 leading-none">
                Editor Workspace
              </span>

              {websiteInfo && (
                <a
                  href={projectUrl || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-bold tracking-wide transition-colors ${websiteInfo.badgeColor} hover:brightness-125`}
                  title={`Source: ${websiteInfo.domain}`}
                >
                  <Globe className="w-2.5 h-2.5" />
                  <span className="truncate max-w-[90px]">{websiteInfo.name}</span>
                  <ExternalLink className="w-2 h-2 opacity-60" />
                </a>
              )}

              {projectGenre && (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-neutral-800/80 border border-neutral-700/50 text-[9px] font-medium text-neutral-300 truncate max-w-[90px]">
                  <Tag className="w-2.5 h-2.5 text-neutral-400 shrink-0" />
                  <span className="truncate">{projectGenre.split(",")[0].trim()}</span>
                </span>
              )}
            </div>

            {/* Title & Layout Icon */}
            <div className="mt-1 flex items-center gap-1.5">
              <LayoutPanelTop className="h-3.5 w-3.5 text-[#3B82F6] shrink-0" />
              <h2 className="truncate text-sm font-bold text-white leading-none tracking-wide">
                {title}
              </h2>
            </div>

            {/* Subtitle & Author */}
            <div className="mt-1 flex items-center gap-2 truncate text-[10px] text-neutral-400 font-mono leading-none">
              {subtitle && <span className="truncate">{subtitle}</span>}
              {projectAuthor && (
                <span className="inline-flex items-center gap-1 text-neutral-500 shrink-0">
                  <User className="w-2.5 h-2.5 text-neutral-500" />
                  <span className="truncate">{projectAuthor}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>



      {/* Right Section - Action Buttons (Unified h-9 height and clean spacing) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-nowrap">
        {/* 🟢 Server Status Indicator */}
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
                className="flex h-9 items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 rounded-full border border-[#2b2d35] bg-[#18191e] hover:bg-[#202127] text-amber-400 hover:border-amber-500/40 text-[10px] sm:text-xs font-black font-mono select-none cursor-pointer transition-all shadow-sm"
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
                    navigateTo?.("/profile?tab=billing");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Player Toggle Button */}
        <Tooltip text="Toggle Floating Video Preview" placement="bottom">
          <button
            type="button"
            onClick={() => {
              const current =
                useImageEditorStore.getState().playerSettings.isPlayerOpen;
              useImageEditorStore
                .getState()
                .setPlayerSettings({ isPlayerOpen: !current });
            }}
            aria-label="Toggle Floating Player"
            className={`flex items-center justify-center h-9 w-9 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isPlayerOpen
                ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#60A5FA] shadow-[inset_0_0_12px_rgba(59,130,246,0.15)]"
                : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/20 hover:text-[#93C5FD]"
            }`}
          >
            <Monitor className="h-4 w-4" />
          </button>
        </Tooltip>

        {/* Focus Mode */}
        <Tooltip text={isFocusMode ? "Exit Focus Mode" : "Focus Mode"} placement="bottom">
          <button
            type="button"
            onClick={() => setIsFocusMode((value) => !value)}
            aria-label={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
            className={`flex items-center justify-center h-9 w-9 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
              isFocusMode
                ? "border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#60A5FA] shadow-[inset_0_0_12px_rgba(59,130,246,0.15)]"
                : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/20 hover:text-[#93C5FD]"
            }`}
          >
            <Focus className="h-4 w-4" />
          </button>
        </Tooltip>

        {/* Save Button */}
        <Tooltip text={isDirty ? "Save Unsaved Changes (Ctrl+S)" : "Project Saved"} placement="bottom">
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            aria-label={isDirty ? "Save Unsaved Changes" : "Project Saved"}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer border ${
              isSaving
                ? "bg-purple-600/30 border-[#3B82F6]/40 text-purple-200 cursor-wait opacity-80"
                : isDirty
                ? "bg-gradient-to-r from-[#2A2A2A] to-[#2A2A2A] hover:border-[#3B82F6] hover:from-blue-500 hover:to-indigo-500 text-white border-[#60A5FA]/50 shadow-lg shadow-purple-900/40 animate-pulse"
                : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white"
            }`}
          >
            <Save
              className={`h-3.5 w-3.5 ${
                isSaving
                  ? "animate-spin text-purple-200"
                  : isDirty
                  ? "text-[#60A5FA]"
                  : "text-neutral-400"
              }`}
            />
            <span className="hidden sm:inline font-sans text-[11px]">
              {isSaving ? "Saving..." : isDirty ? "Save*" : "Save"}
            </span>
          </button>
        </Tooltip>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <Tooltip text="Notifications" placement="bottom">
            <button
              onClick={() => setShowNotifications((v) => !v)}
              aria-label="Notifications"
              className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/20 hover:text-[#93C5FD] transition-all cursor-pointer active:scale-95 flex items-center justify-center relative"
            >
              {notificationsMuted ? (
                <BellOff className="h-4 w-4 text-rose-500" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-white text-[9px] font-bold">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
          </Tooltip>
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
              onToggleMute={() => setNotificationsMuted?.(!notificationsMuted)}
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
              className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-[#3B82F6]/10 hover:border-[#3B82F6]/20 hover:text-[#93C5FD] transition-all cursor-pointer active:scale-95 flex items-center justify-center relative"
              aria-label="Active Project Selector"
            >
              <FolderSync className="h-4 w-4 text-[#3B82F6]" />
              {activeProjectId && activeProjectData && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
              )}
            </button>
          </Tooltip>
        </div>

        {/* User Profile Pill at Far Right End (Image 2 Style) */}
        <Tooltip text="View Profile & Settings" placement="bottom">
          <button
            onClick={() => navigateTo?.("/profile")}
            className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-[#3B82F6]/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95 h-9"
            aria-label="Open User profile"
          >
            <span className="text-xs font-bold text-white group-hover:text-purple-200 truncate max-w-[130px] hidden sm:inline font-sans px-2.5 py-1 rounded-lg bg-[#24252c] border border-white/5">
              {user?.full_name ||
                user?.username ||
                (user?.email ? user.email.split("@")[0] : "Studio Creator")}
            </span>
            <div className="relative w-7 h-7 rounded-full overflow-hidden border-2 border-[#8b5cf6] bg-[#201833] shrink-0 shadow-[0_0_8px_rgba(139,92,246,0.35)] flex items-center justify-center group-hover:border-[#60A5FA] transition-all duration-300">
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
        </Tooltip>
      </div>
    </header>
  );
};

export default React.memo(EditorPageHeader);
