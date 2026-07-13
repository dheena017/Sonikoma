import React, { useEffect, useRef, useState } from "react";
import { Focus, LayoutPanelTop, Save, Menu, Layers, Clock, Wifi, WifiOff, Share2, Bell, BellOff, Zap } from "lucide-react";
import NotificationDropdown from "../../notification/NotificationDropdown";
import { Notification } from "../../notification/NotificationStack";
import { getUserCreditsPayload } from "../../../api/auth";

interface EditorPageHeaderProps {
  title: string;
  subtitle?: string;

  onSave: () => void;
  isSaving: boolean;
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
}

const EditorPageHeader: React.FC<EditorPageHeaderProps> = ({
  title,
  subtitle,
  onBackToApp,
  onSave,
  isSaving,
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
}) => {
  // Smoothly slide out of view if the mobile/drawer sidebar is open
  const headerVisibilityClass = isSidebarOpen
    ? "-translate-y-full opacity-0 pointer-events-none"
    : "translate-y-0 opacity-100";

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const [credits, setCredits] = useState<number | null>(null);

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
    function handleClickOutside(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 h-16 flex min-w-0 flex-wrap items-center justify-between gap-2 border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md shadow-2xl shadow-black/40 pl-4 lg:pl-0 pr-6 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${headerVisibilityClass} ${
        className || ""
      }`}
      style={style}
    >
      {/* Left Section - Menu Icon + Title */}
      <div className="flex items-center shrink-0 h-full">
        {/* PREMIUM ALIGNMENT FIX: w-20 wrapper perfectly aligns the menu button above the mini-sidebar */}
        <div className="w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900 h-full mr-4">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border border-white/10 bg-white/5 text-neutral-400 hover:text-white cursor-pointer transition-colors active:scale-95"
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
          <img
            src="/logo.png"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            alt="Sonikoma Logo"
            className="h-9 w-9 rounded-full bg-neutral-900 shadow-lg shadow-purple-900/30 object-cover border border-white/5"
          />
          <div className="min-w-0 hidden sm:block">
            <p className="font-mono text-[9px] font-black uppercase tracking-[0.25em] text-purple-400/80 leading-none">
              Editor Workspace
            </p>
            <div className="mt-1 flex items-center gap-2">
              <LayoutPanelTop className="h-3.5 w-3.5 text-purple-400" />
              <h2 className="truncate text-sm font-bold text-white leading-none tracking-wide">
                {title}
              </h2>
            </div>
            {subtitle ? (
              <p className="mt-1 truncate text-[10px] text-neutral-400 font-mono leading-none">
                {subtitle}
              </p>
            ) : null}
          </div>
        </div>
      </div>

      {/* Center: Live Stats Chips */}
      <div className="hidden md:flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
        {/* Backend status */}
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
          backendOnline
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
            : "bg-red-500/10 border-red-500/20 text-red-400"
        }`}>
          {backendOnline
            ? <Wifi className="h-2.5 w-2.5" />
            : <WifiOff className="h-2.5 w-2.5" />}
          {backendOnline ? "Online" : "Offline"}
        </div>

        {/* Panel count */}
        {panelsCount > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-purple-500/20 bg-purple-500/10 text-[9px] font-black uppercase tracking-widest text-purple-400">
            <Layers className="h-2.5 w-2.5" />
            {panelsCount} panels
          </div>
        )}

        {/* Auto-save hint */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[9px] font-bold text-neutral-600">
          <Clock className="h-2.5 w-2.5" />
          <span className="hidden lg:inline">Ctrl+S to save</span>
        </div>
      </div>

      {/* Right Section - Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* ⚡ Credits Pill */}
        {credits !== null && (
          <button
            onClick={() => navigateTo?.("/profile?tab=billing")}
            title="Your credit balance — click to top up"
            className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-bold font-mono select-none cursor-pointer transition-all ${
              credits < 20
                ? "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20 animate-pulse"
                : "bg-white/5 border-white/10 text-purple-400 hover:border-purple-500/40 hover:bg-purple-500/5"
            }`}
          >
            <Zap className="h-3.5 w-3.5 shrink-0" />
            {credits.toLocaleString()}
          </button>
        )}
        <button
          type="button"
          onClick={() => setIsFocusMode((value) => !value)}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer ${
            isFocusMode
              ? "border-purple-500/50 bg-purple-500/10 text-purple-300 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]"
              : "border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white"
          }`}
        >
          <Focus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {isFocusMode ? "Exit Focus" : "Focus Mode"}
          </span>
        </button>

        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications((v) => !v)}
            title="Notifications"
            className="p-2 rounded-xl border border-white/10 bg-white/5 text-neutral-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer active:scale-95"
          >
            {notificationsMuted ? (
              <BellOff className="h-4 w-4" />
            ) : (
              <Bell className="h-4 w-4" />
            )}
            {notifications.filter((n) => !n.isRead).length > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center h-4 min-w-[16px] px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold">
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

        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-bold text-white transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-[0_4px_14px_rgba(168,85,247,0.4)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 cursor-pointer"
        >
          <Save className={`h-3.5 w-3.5 ${isSaving ? "animate-pulse" : ""}`} />
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <span className="hidden sm:inline">Save Project</span>
              <span className="sm:hidden">Save</span>
            </>
          )}
        </button>

        <button
          type="button"
          title="Share project link"
          className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-neutral-300 transition-all hover:text-white active:scale-95 cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" />
          <span className="hidden lg:inline">Share</span>
        </button>


      </div>
    </header>
  );
};

export default React.memo(EditorPageHeader);
