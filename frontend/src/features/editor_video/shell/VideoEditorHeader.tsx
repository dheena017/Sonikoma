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
} from "lucide-react";
import VideoCustomizeLayoutModal from "./VideoCustomizeLayoutModal";
import ProjectConfirmModal from "@/shared/ui/modal/ProjectConfirmModal";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { Notification } from "@/features/app_notification";
import { getUserCreditsPayload } from "@/api/endpoints/auth";

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
  layoutConfig?: { mediaBin?: boolean; rightInspector?: boolean; timeline?: boolean };
  onTogglePanel?: (panel: "mediaBin" | "rightInspector" | "timeline") => void;
  onNavigateToAll?: () => void;
  navigateTo?: (path: string) => void;
  fetchWithInterceptor?: any;
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
}) => {
  const [showCustomizeLayout, setShowCustomizeLayout] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [credits, setCredits] = useState<number | null>(
    userCredits !== undefined && userCredits !== null ? userCredits : null
  );
  const notificationsRef = useRef<HTMLDivElement | null>(null);

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
    }
  }, [userCredits]);

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

  return (
    <>
      <header className="h-16 w-full bg-[#09090e]/90 backdrop-blur-md border-b border-neutral-800/80 pr-6 flex items-center justify-between z-30 shrink-0 select-none">
        <div className="flex items-center gap-3 shrink-0 h-full">
          <div className="w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-800/80 h-full mr-2">
            <button
              onClick={onToggleSidebar}
              className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/40 text-neutral-400 hover:text-purple-300 transition-all cursor-pointer shadow-sm active:scale-95"
              title="Toggle Sidebar Drawer"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <img
              src="/logo-dark.png"
              alt="Sonikoma Logo"
              className="h-8 w-8 rounded-xl object-cover shadow-[0_0_12px_rgba(168,85,247,0.4)] border border-white/10 shrink-0"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-light.png";
              }}
            />
            <span className="font-bold text-sm text-white tracking-wide font-mono hidden sm:inline">
              Sonikoma Studio
            </span>
          </div>

          <div className="flex items-center gap-2 ml-1 bg-[#121218] border border-neutral-800 px-3 py-1 rounded-lg text-xs font-semibold text-neutral-200 cursor-pointer hover:border-neutral-700 transition-all max-w-[240px] truncate">
            <span className="text-neutral-400 font-normal shrink-0">Project:</span>
            <span className="font-semibold text-white truncate">{displayTitle}</span>
            <ChevronDown className="h-3.5 w-3.5 text-neutral-400 shrink-0" />
          </div>

          <button
            onClick={onSave}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer ml-1"
            title={isDirty ? "Unsaved changes — click to save" : "Project saved"}
          >
            {isSaving ? (
              <span className="text-purple-400 flex items-center gap-1 font-semibold">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Saving...</span>
              </span>
            ) : isDirty ? (
              <span className="text-amber-400 flex items-center gap-1 font-semibold hover:underline">
                <Cloud className="h-3.5 w-3.5" />
                <span>Not saved</span>
              </span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Saved</span>
              </span>
            )}
          </button>
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

          <div className="hidden lg:flex items-center gap-1 p-1 bg-[#121218] border border-neutral-800/90 rounded-xl">
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

          <div className="relative" ref={notificationsRef}>
            <button
              onClick={() => setShowNotifications((v) => !v)}
              title="Notifications"
              className="relative w-9 h-9 rounded-xl border border-neutral-700/60 bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-700/80 transition-all cursor-pointer flex items-center justify-center shadow-sm"
            >
              {notificationsMuted ? (
                <BellOff className="h-4 w-4" />
              ) : (
                <Bell className="h-4 w-4" />
              )}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 inline-flex items-center justify-center h-4 min-w-[18px] px-1 rounded-full bg-[#ff3555] text-white text-[9px] font-extrabold border-2 border-[#09090e] shadow-sm">
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
                onToggleMute={() => setNotificationsMuted?.(!notificationsMuted)}
              />
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowSaveModal(true)}
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

          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-purple-500/20 cursor-pointer shrink-0">
            S
          </div>
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
