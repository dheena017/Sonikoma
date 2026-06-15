import React, { useState, useRef, useEffect } from "react";
import { Film, Menu, Bell } from "lucide-react";
import { GeneratedPanel } from "../types";
import NotificationDropdown from "./NotificationDropdown";
import { Notification } from "./NotificationStack";

interface HeaderProps {
  isProcessing: boolean;
  panels: GeneratedPanel[];
  totalCalculatedDuration: number;
  currentPath: string;
  editingImageIdx: number | null;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  backendStatus: "online" | "offline" | "checking";
  narrationStyle?: string;
  user?: any;
  notifications: Notification[];
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
}

/** Format seconds into a readable "Xm Ys" string */
function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

export default function Header({
  isProcessing,
  panels,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles,
  onToggleSidebar,
  isSidebarOpen = false,
  backendStatus,
  narrationStyle = "long",
  user,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  
  const navigateTo = (path: string) => {
    window.history.pushState({}, "", path);
    window.dispatchEvent(new Event("popstate"));
  };

  const isLongMode = narrationStyle !== "short";

  return (
    <header id="header_pane" className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Hamburger menu button */}
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Brand */}
        <div
          className={`flex items-center gap-2 cursor-pointer select-none transition-all duration-300 ${
            isSidebarOpen ? "lg:opacity-0 lg:pointer-events-none" : "lg:opacity-100"
          }`}
          onClick={() => navigateTo("/")}
        >
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-900/40">
            <Film className="h-4 w-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-white font-sans">
            Webtoon<span className="text-purple-400">To</span>Video
          </span>
        </div>

        {/* Narration Mode Badge */}
        {isLongMode ? (
          <div
            title="Storyteller Mode — 35-70 word narrations optimised for long-form YouTube videos"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider select-none border border-purple-500/40 bg-purple-950/30 text-purple-300 shadow-[0_0_10px_-2px_rgba(168,85,247,0.35)] transition-all"
          >
            <span className="text-purple-400">✦</span>
            <span>STORYTELLER</span>
          </div>
        ) : (
          <div
            title="Subtitle Mode — max 25 word snappy captions for Shorts or quick summaries"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono tracking-wider select-none border border-emerald-500/40 bg-emerald-950/30 text-emerald-300 shadow-[0_0_10px_-2px_rgba(52,211,153,0.25)] transition-all"
          >
            <span className="text-emerald-400">✦</span>
            <span>SUBTITLES</span>
          </div>
        )}
      </div>

      {/* Right side controls/status */}
      <div className="flex items-center gap-3">
        {/* Notifications Bell */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer relative ${
              showNotifications
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white"
            }`}
            title="Notifications"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-neutral-950">
                {unreadCount > 9 ? '9+' : unreadCount}
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
                navigateTo("/notifications");
              }}
            />
          )}
        </div>

        {/* Storyboard metrics */}
        {panels.length > 0 && (
          <div className="hidden sm:flex items-center gap-3 font-mono text-[10px] text-neutral-400 bg-neutral-900/30 border border-neutral-800/60 px-3 py-1 rounded-lg select-none">
            <span>panels: <strong className="text-purple-400 font-bold">{panels.length}</strong></span>
            <span className="text-neutral-700 font-bold">|</span>
            <span>est. duration: <strong className="text-purple-400 font-bold">{formatDuration(totalCalculatedDuration)}</strong></span>
          </div>
        )}

        {/* Connection status */}
        <div className={`hidden md:flex items-center gap-1.5 font-mono text-[10px] border px-2.5 py-1 rounded-lg select-none ${
          backendStatus === "offline"
            ? "border-rose-900/50 bg-rose-950/20 text-rose-400"
            : "border-neutral-800/80 bg-neutral-900/30 text-neutral-400"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${backendStatus === "offline" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"}`} />
          <span>engine: {backendStatus}</span>
        </div>

        {/* Processing status */}
        <div className="flex items-center gap-2 font-mono text-[10px] bg-neutral-900 border border-neutral-800 px-2.5 py-1 rounded-lg shrink-0">
          <span className={`h-2 w-2 rounded-full ${isProcessing ? 'bg-purple-500 animate-ping' : 'bg-emerald-500'}`} />
          <span className="text-neutral-300 font-bold">{isProcessing ? "PROCESSING" : "READY"}</span>
        </div>

        {/* User Profile */}
        <button
          onClick={() => navigateTo("/profile")}
          className="flex items-center gap-2 px-1.5 py-1 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/50 transition-all cursor-pointer overflow-hidden max-w-[120px]"
          title="View Profile"
        >
          <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center overflow-hidden shrink-0 border border-purple-500/30">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span className="text-[10px] font-bold text-purple-400">U</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-neutral-300 truncate hidden sm:inline">
            {user?.full_name?.split(' ')[0] || "User"}
          </span>
        </button>
      </div>
    </header>
  );
}
