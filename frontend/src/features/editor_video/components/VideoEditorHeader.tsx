import React, { useEffect, useRef, useState } from "react";
import {
  Cloud,
  ChevronDown,
  Sparkles,
  Video,
  Loader2,
  CheckCircle2,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Zap,
  Save,
  Menu,
} from "lucide-react";
import VideoCustomizeLayoutModal from "./VideoCustomizeLayoutModal";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { Notification } from "@/features/app_notification";
import { getUserCreditsPayload } from "@/api/endpoints/auth";

// ─── Props ────────────────────────────────────────────────────────────────────

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
  // Common header additions
  backendOnline?: boolean;
  panelsCount?: number;
  notifications?: Notification[];
  markNotificationAsRead?: (id: number) => void;
  markAllNotificationsAsRead?: () => void;
  deleteNotification?: (id: number) => void;
  clearAllNotifications?: () => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  layoutConfig?: { mediaBin?: boolean; rightInspector?: boolean; timeline?: boolean };
  onTogglePanel?: (panel: "mediaBin" | "rightInspector" | "timeline") => void;
  onNavigateToAll?: () => void;
  navigateTo?: (path: string) => void;
  fetchWithInterceptor?: any;
}

// ─── Component ────────────────────────────────────────────────────────────────

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
}) => {
  // ── Local state ────────────────────────────────────────────────────────────
  const [showCustomizeLayout, setShowCustomizeLayout] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    userCredits !== undefined && userCredits !== null ? userCredits : null
  );
  const notificationsRef = useRef<HTMLDivElement | null>(null);

  // ── Credits polling (same as EditorPageHeader) ─────────────────────────────
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

  // Sync prop-provided credits when no fetchWithInterceptor
  useEffect(() => {
    if (userCredits !== undefined && userCredits !== null) {
      setCredits(userCredits);
    }
  }, [userCredits]);

  // ── Notification click-outside ─────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(e.target as Node)
      ) {
        setShowNotifications(false);
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

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <header className="h-16 w-full bg-[#09090e]/90 backdrop-blur-md border-b border-neutral-800/80 pr-6 flex items-center justify-between z-30 shrink-0 select-none">

        {/* ── LEFT: Menu Toggle | Brand | Project title | Save status ── */}
        <div className="flex items-center gap-3 shrink-0 h-full">
          {/* Hamburger toggle */}
          <div className="w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-800/80 h-full mr-2">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Toggle Sidebar Drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-purple-600 flex items-center justify-center text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]">
              <Video className="h-4 w-4" />
            </div>
            <span className="font-bold text-sm text-white tracking-wide font-mono hidden sm:inline">
              Sonikoma Studio
            </span>
          </div>

          {/* Project title selector */}
          <div className="flex items-center gap-2 ml-1 bg-[#121218] border border-neutral-800 px-3 py-1 rounded-lg text-xs font-semibold text-neutral-200 cursor-pointer hover:border-neutral-700 transition-all max-w-[220px] truncate">
            <span className="text-neutral-400 font-normal shrink-0">Project:</span>
            <span className="truncate">{displayTitle}</span>
            {chapterNumber && (
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-1.5 py-0.5 rounded font-mono shrink-0">
                Ch.{chapterNumber}
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          </div>

          {/* Save status inline */}
          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ml-1"
            title={isDirty ? "Unsaved changes — click to save" : "Project saved"}
          >
            {isSaving ? (
              <span className="text-purple-400 flex items-center gap-1">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : isDirty ? (
              <span className="text-amber-400 flex items-center gap-1 hover:underline">
                <Cloud className="h-3.5 w-3.5" />
                <span>Save*</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Saved</span>
              </span>
            )}
          </button>
        </div>

        {/* ── CENTER: Backend Status Chip ── */}
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

        {/* ── RIGHT: Credits | 4 Panel Control Icons | Notifications | Save | Export | Avatar ── */}
        <div className="flex items-center gap-2.5">

          {/* Credits pill */}
          {credits !== null && (
            <button
              onClick={() => navigateTo?.("/profile?tab=billing")}
              title="Your credit balance — click to top up"
              className={`hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg border text-[11px] font-bold font-mono cursor-pointer transition-all ${
                credits < 20
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                  : "bg-neutral-900 border-neutral-800 text-purple-400 hover:bg-purple-500/10 hover:border-purple-500/20"
              }`}
            >
              <Zap className="h-3.5 w-3.5 shrink-0" />
              <span>{credits.toLocaleString()}</span>
            </button>
          )}

          {/* ── 4 Panel Control Buttons (matches screenshot) ── */}
          <div className="hidden lg:flex items-center gap-1 p-1 bg-[#121218] border border-neutral-800/90 rounded-xl">

            {/* Button 1: Open Customize Layout Modal */}
            <button
              type="button"
              onClick={() => setShowCustomizeLayout(true)}
              className="p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              title="Customize Layout"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <rect x="3" y="4" width="4" height="16" rx="1" />
                <rect x="10" y="4" width="11" height="7" rx="1" />
                <rect x="10" y="13" width="11" height="7" rx="1" />
              </svg>
            </button>

            {/* Button 2: Toggle Left Panel (Media Bin) */}
            <button
              type="button"
              onClick={() => onTogglePanel?.("mediaBin")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                layoutConfig?.mediaBin
                  ? "bg-neutral-800 text-white border border-neutral-700/60 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={layoutConfig?.mediaBin ? "Hide Media Bin (Left Panel)" : "Show Media Bin (Left Panel)"}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <rect x="3" y="4" width="8" height="16" rx="1" className="fill-current stroke-none" />
              </svg>
            </button>

            {/* Button 3: Toggle Bottom Panel (Timeline) */}
            <button
              type="button"
              onClick={() => onTogglePanel?.("timeline")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                layoutConfig?.timeline
                  ? "bg-neutral-800 text-white border border-neutral-700/60 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={layoutConfig?.timeline ? "Hide Timeline (Bottom Panel)" : "Show Timeline (Bottom Panel)"}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <rect x="3" y="12" width="18" height="8" rx="1" className="fill-current stroke-none" />
              </svg>
            </button>

            {/* Button 4: Toggle Right Panel (Property Inspector) */}
            <button
              type="button"
              onClick={() => onTogglePanel?.("rightInspector")}
              className={`p-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center ${
                layoutConfig?.rightInspector
                  ? "bg-neutral-800 text-white border border-neutral-700/60 shadow-sm"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-800/60"
              }`}
              title={layoutConfig?.rightInspector ? "Hide Property Inspector (Right Panel)" : "Show Property Inspector (Right Panel)"}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-none stroke-current stroke-2">
                <rect x="3" y="4" width="18" height="16" rx="2" />
                <rect x="13" y="4" width="8" height="16" rx="1" className="fill-current stroke-none" />
              </svg>
            </button>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              title="Notifications"
              className="relative p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:bg-purple-500/10 hover:border-purple-500/20 hover:text-purple-300 transition-all cursor-pointer flex items-center justify-center"
            >
              {notificationsMuted ? (
                <BellOff className="h-3.5 w-3.5" />
              ) : (
                <Bell className="h-3.5 w-3.5" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-purple-600 text-white text-[9px] font-bold">
                  {unreadCount}
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

          {/* Save Project */}
          <button
            type="button"
            onClick={onSave}
            disabled={isSaving}
            title={isSaving ? "Saving..." : isDirty ? "Unsaved changes — click to Save" : "Save Project"}
            className={`hidden sm:flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold text-white transition-all cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              isDirty
                ? "bg-gradient-to-r from-amber-600 via-purple-600 to-indigo-600 border border-amber-400/50 shadow-[0_0_14px_rgba(245,158,11,0.3)] animate-pulse"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 border border-purple-400/20"
            }`}
          >
            <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-spin" : isDirty ? "text-amber-300" : ""}`} />
            <span>{isSaving ? "Saving..." : "Save"}</span>
            {isDirty && !isSaving && (
              <span className="px-1 py-0.5 text-[8px] font-black uppercase bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-full">
                •
              </span>
            )}
          </button>

          {/* Export Video */}
          <button
            onClick={onExport}
            disabled={isRendering}
            className={`relative overflow-hidden px-4 h-8 rounded-lg font-bold text-xs tracking-wide transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-purple-400/20 ${
              isRendering
                ? "bg-purple-900/60 text-purple-200 cursor-wait"
                : "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-[0_0_16px_rgba(168,85,247,0.35)]"
            }`}
          >
            {isRendering ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-300" />
                <span>Exporting {renderProgress}%</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Export Video</span>
              </>
            )}
          </button>

          {/* User avatar */}
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-purple-500/20 cursor-pointer shrink-0">
            S
          </div>
        </div>
      </header>

      {/* Customize Layout Modal */}
      <VideoCustomizeLayoutModal
        isOpen={showCustomizeLayout}
        onClose={() => setShowCustomizeLayout(false)}
      />
    </>
  );
};

export default React.memo(VideoEditorHeader);
