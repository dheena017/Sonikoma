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
import { useProjectStore } from "@/store/useProjectStore";
import { AIModelSelector } from "@/features/ai_core";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";

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
        badgeColor: "bg-purple-500/15 text-purple-300 border-purple-500/30",
      };
    } catch {
      return null;
    }
  })();

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] h-16 flex min-w-0 flex-nowrap items-center justify-between gap-3 border-b border-white/8 bg-[#06060c]/90 backdrop-blur-2xl shadow-[0_4px_32px_rgba(0,0,0,0.6),inset_0_-1px_0_rgba(168,85,247,0.08)] pl-4 lg:pl-0 pr-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${headerVisibilityClass} ${
        className || ""
      }`}
      style={style}
    >
      {/* Left Section - Menu Icon + Title + Metadata */}
      <div className="flex items-center shrink-0 h-full">
        {/* PREMIUM ALIGNMENT FIX: w-20 wrapper perfectly aligns the menu button above the mini-sidebar */}
        <div className="w-20 flex items-center justify-center shrink-0 border-r border-white/5 h-full mr-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/8 hover:bg-purple-500/15 hover:border-purple-500/30 text-neutral-400 hover:text-purple-300 cursor-pointer transition-all duration-300 active:scale-95 flex items-center justify-center shadow-sm"
              title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              <Menu className="h-5 w-5" />
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
              className="h-10 w-10 rounded-xl bg-neutral-900 shadow-lg shadow-purple-900/30 object-cover border border-white/10 shrink-0"
            />
          ) : (
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              alt="Sonikoma Logo"
              className="h-10 w-10 rounded-full bg-neutral-900 shadow-lg shadow-purple-900/30 object-cover border border-white/5 shrink-0"
            />
          )}

          <div className="min-w-0 hidden sm:block max-w-[280px] md:max-w-[340px] lg:max-w-[420px]">
            {/* Top Workspace & Source Website Badge */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-purple-400/90 leading-none">
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
              <LayoutPanelTop className="h-3.5 w-3.5 text-purple-400 shrink-0" />
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

      {/* Center: Live Stats Chips (Only rendered when sufficient width exists to prevent collisions) */}
      {panelsCount > 0 && (
        <div className="hidden 2xl:flex items-center gap-2 absolute left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-[9px] font-black uppercase tracking-widest text-purple-400">
            <Layers className="h-2.5 w-2.5" />
            {panelsCount} panels
          </div>
        </div>
      )}

      {/* Right Section - Action Buttons (Unified h-9 height and clean spacing) */}
      <div className="flex items-center gap-2 shrink-0 flex-nowrap">
        {/* 🟢 Server Status Indicator */}
        <ServerStatusIndicator status={backendOnline ? "online" : "offline"} />

        {/* 🤖 Global AI Model Selector */}
        <AIModelSelector compact className="hidden sm:inline-flex" />

        {/* ⚡ Credits Pill & Popover */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <button
              onClick={() => {
                setShowCreditsPopover(!showCreditsPopover);
                setShowNotifications(false);
              }}
              title="Your credit balance & daily rewards — click to view"
              className={`hidden sm:flex h-9 items-center gap-1.5 px-3 rounded-xl border text-[11px] font-bold font-mono select-none cursor-pointer transition-all ${
                credits < 20
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                  : "bg-neutral-900 border-neutral-800 text-amber-400 hover:border-amber-500/40 hover:bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)]"
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
                    navigateTo?.("/profile?tab=billing");
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Player Toggle Button */}
        <button
          type="button"
          onClick={() => {
            const current =
              useImageEditorStore.getState().playerSettings.isPlayerOpen;
            useImageEditorStore
              .getState()
              .setPlayerSettings({ isPlayerOpen: !current });
          }}
          title="Toggle Floating Player"
          className={`flex items-center justify-center h-9 w-9 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isPlayerOpen
              ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
              : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300"
          }`}
        >
          <Monitor className="h-4 w-4" />
        </button>

        {/* Focus Mode */}
        <button
          type="button"
          onClick={() => setIsFocusMode((value) => !value)}
          title={isFocusMode ? "Exit Focus Mode" : "Focus Mode"}
          className={`flex items-center justify-center h-9 w-9 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isFocusMode
              ? "border-purple-500/50 bg-purple-500/15 text-purple-300 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
              : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300"
          }`}
        >
          <Focus className="h-4 w-4" />
        </button>

        {/* Save Button */}
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          title={isDirty ? "Save Unsaved Changes (Ctrl+S)" : "Project Saved"}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-xl text-xs font-bold font-mono transition-all active:scale-95 cursor-pointer border ${
            isSaving
              ? "bg-purple-600/30 border-purple-500/40 text-purple-200 cursor-wait opacity-80"
              : isDirty
              ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border-purple-400/50 shadow-lg shadow-purple-900/40 animate-pulse"
              : "bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white"
          }`}
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
          <span className="hidden sm:inline font-sans text-[11px]">
            {isSaving ? "Saving..." : isDirty ? "Save*" : "Save"}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            title="Notifications"
            className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center relative"
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
          <button
            onClick={() => setDrawerOpen(true)}
            className="h-9 w-9 rounded-xl border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300 transition-all cursor-pointer active:scale-95 flex items-center justify-center relative"
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

        {/* User Profile Pill at Far Right End */}
        <button
          onClick={() => navigateTo?.("/profile")}
          className="flex items-center gap-2 p-1.5 pl-3 rounded-full bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-850 transition-all cursor-pointer select-none group shrink-0 ml-1 shadow-sm active:scale-95 h-9"
          title="View Profile & Account Settings"
          aria-label="Open User profile"
        >
          <span className="text-xs font-bold text-neutral-300 group-hover:text-white truncate max-w-[120px] hidden sm:inline font-sans px-2 py-0.5 rounded-md bg-neutral-800 border border-neutral-750">
            {user?.full_name ||
              user?.username ||
              (user?.email ? user.email.split("@")[0] : "User")}
          </span>
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-purple-500/40 bg-purple-950/40 shrink-0 shadow-xs ring-1 ring-white/10 group-hover:border-purple-400 group-hover:ring-purple-500/30 transition-all duration-300">
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
      </div>
    </header>
  );
};

export default React.memo(EditorPageHeader);
