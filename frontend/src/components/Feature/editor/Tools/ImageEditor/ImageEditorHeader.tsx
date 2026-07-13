import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Check,
  Undo,
  Redo,
  ChevronLeft,
  ChevronRight,
  Trash2,
  PanelRightClose,
  PanelRightOpen,
  Minimize2,
  Bell,
  BellOff,
  Menu
} from "lucide-react";
import { ImageTool } from "@/hooks/useImageEditorState"; // Adjust path if needed
import NotificationDropdown from "@/components/notification/NotificationDropdown";
import { resolveWorkspaceReturnPath } from "@/utils/workspaceNavigation";

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
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
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
    <header className="h-16 w-full bg-neutral-950/80 backdrop-blur-md border-b border-neutral-900 flex items-center justify-between pl-4 lg:pl-0 pr-6 md:pr-8 flex-shrink-0 z-50 selection:bg-purple-650">
      {/* Left: Hamburger, Brand / Logo & Navigation */}
      <div className="flex items-center space-x-4 h-full">
        {onToggleSidebar && (
          <div className="w-auto lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-4">
            <button
              onClick={onToggleSidebar}
              className="icon-pill cursor-pointer hover:icon-pill--purple transition-all"
              title="Toggle Navigation Menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        )}

        <div
          className="flex items-center gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={handleLogoClick}
        >
          <img
            key={themeMode}
            src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            className="h-10 w-10 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover transition-all duration-300 animate-[fadeIn_0.3s_ease-out] group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]"
            style={{
              background: themeMode === "light" ? "#ffffff" : "#000000",
            }}
            alt="Sonikoma Logo"
          />
          <span className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
            Sonikoma
          </span>
        </div>

        <span className="px-3 py-1 text-[10px] font-bold tracking-wider text-purple-400 bg-purple-900/30 rounded-full border border-purple-700/50">
          IMAGE EDITOR
        </span>

        {hasMultipleImages && (
          <div className="flex items-center space-x-1 bg-gray-900/50 rounded-lg p-1 border border-gray-800">
            <button 
              onClick={handlePrevImage}
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
              title="Previous Image"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-medium text-gray-400 min-w-[3rem] text-center">
              {editingImageIdx !== null ? editingImageIdx + 1 : 0} / {scrapedImages.length}
            </span>
            <button 
              onClick={handleNextImage}
              className="p-1.5 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
              title="Next Image"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Center: History & Canvas Tools */}
      <div className="flex items-center space-x-2 bg-gray-900/50 p-1 rounded-lg border border-gray-800">
        <button
          onClick={handleUndo}
          disabled={historyLength === 0}
          className={`p-2 rounded-md transition ${historyLength > 0 ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'}`}
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>
        <button
          onClick={handleRedo}
          disabled={redoHistoryLength === 0}
          className={`p-2 rounded-md transition ${redoHistoryLength > 0 ? 'text-gray-300 hover:text-white hover:bg-gray-800' : 'text-gray-600 cursor-not-allowed'}`}
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
        <div className="w-px h-4 bg-gray-700 mx-1"></div>
        <button
          onClick={handleDeleteCurrentImage}
          className="p-2 text-red-400 hover:text-red-300 rounded-md hover:bg-red-900/20 transition"
          title="Delete Image"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        {setIsPipMode && (
          <button
            onClick={() => setIsPipMode(true)}
            className="p-2 text-gray-400 hover:text-white rounded-md hover:bg-gray-800 transition"
            title="Picture-in-Picture Mode"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Right: Toggle Sidebar, Notifications, Profile & Exit Actions */}
      <div className="flex items-center space-x-3">
        {/* Toggle properties panel */}
        <button
          onClick={() => setIsToolsPanelOpen((prev) => !prev)}
          className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition border border-transparent hover:border-gray-700"
          title={isToolsPanelOpen ? "Close Properties Panel" : "Open Properties Panel"}
        >
          {isToolsPanelOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition border border-transparent hover:border-gray-700 relative ${
              showNotifications ? "bg-gray-800 text-white border-gray-700" : ""
            }`}
            title="Notifications"
          >
            {notificationsMuted ? (
              <BellOff className="h-5 w-5 text-rose-500" />
            ) : (
              <Bell className="h-5 w-5" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-purple-600 text-[9px] font-bold text-white ring-2 ring-neutral-950">
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

        {/* User Profile */}
        {user && (
          <button
            onClick={() => navigateTo && navigateTo("/profile")}
            className="flex items-center gap-2 px-1.5 py-1 rounded-xl bg-neutral-900 border border-neutral-850 hover:border-purple-500/50 hover:bg-neutral-850 transition-all cursor-pointer overflow-hidden max-w-[120px] h-[34px]"
            title="View Profile"
          >
            <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center overflow-hidden shrink-0 border border-purple-500/30">
              {user.avatar_url &&
              !user.avatar_url.startsWith("linear-gradient") ? (
                <div className="w-full h-full relative">
                  <img
                    src={user.avatar_url}
                    alt="Profile"
                    className="w-full h-full object-cover relative z-10"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white select-none">
                    {(user.full_name || "U").charAt(0).toUpperCase()}
                  </div>
                </div>
              ) : (
                <div
                  className="w-full h-full bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white select-none"
                  style={user.avatar_url ? { background: user.avatar_url } : {}}
                >
                  {(user.full_name || "U").charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-[10px] font-bold text-neutral-300 truncate hidden sm:inline">
              {user.full_name?.split(" ")[0] || "User"}
            </span>
          </button>
        )}

        <div className="w-px h-6 bg-gray-800 mx-2"></div>

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
          className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white bg-transparent hover:bg-gray-800 rounded-lg transition flex items-center"
        >
          <X className="w-4 h-4 mr-2" /> Cancel
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
          className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-500 rounded-lg transition flex items-center shadow-lg shadow-purple-900/20"
        >
          <Check className="w-4 h-4 mr-2" /> Apply Changes
        </button>
      </div>
    </header>
  );
};
