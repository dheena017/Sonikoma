import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Film,
  Menu,
  Bell,
  BellOff,
  X,
  Search,
  Activity,
  ChevronDown,
  Loader2,
  Sparkles,
  HelpCircle,
  FileText,
  Cloud,
  Zap,
  Cpu,
  FolderOpen,
  FolderSync,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { GeneratedPanel } from "@/types";
import NotificationDropdown from "@/features/app_notification/components/NotificationDropdown";
import { Notification } from "@/features/app_notification";
import {
  getUserAvatarUrl,
  DEFAULT_USER_AVATAR_DATA_URI,
} from "@/shared/utils/avatar";
import { getUserCreditsPayload, claimDailyCredits } from "@/api/endpoints/auth";
import { HeaderCreditsPopover } from "@/features/ai_core";
import { useAIModels } from "@/features/ai_core/hooks/useAIModels";
import ServerStatusIndicator from "@/components/status/ServerStatusIndicator";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { AIModelSelector } from "@/features/ai_core";

interface HeaderProps {
  isProcessing: boolean;
  panels: GeneratedPanel[];
  totalCalculatedDuration: number;
  currentPath: string;
  editingImageIdx: number | null;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  cleanProgress?: { current: number; total: number } | null;
  batchProgress?: { current: number; total: number } | null;
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
  backendStatus: "online" | "offline" | "checking";
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
  volume?: number;
  setVolume?: (vol: number) => void;
  isMuted?: boolean;
  setIsMuted?: (muted: boolean) => void;
  user?: any;
  notifications: Notification[];
  markNotificationAsRead: (id: number) => void;
  markAllNotificationsAsRead: () => void;
  deleteNotification: (id: number) => void;
  clearAllNotifications: () => void;
  projectId?: string | null;
  saveStatus?: string;
  isDirty?: boolean;
  onSave?: () => void;
  navigateTo?: (path: string) => void;
  notificationsMuted?: boolean;
  setNotificationsMuted?: (muted: boolean) => void;
  fetchWithInterceptor?: any;
  addNotification?: (message: string, type?: string) => void;
}

/** Format seconds into a readable "Xm Ys" string */
function formatDuration(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  if (mins === 0) return `${secs}s`;
  if (secs === 0) return `${mins}m`;
  return `${mins}m ${secs}s`;
}

const HeaderInner = ({
  isProcessing,
  panels,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles,
  cleanProgress,
  batchProgress,
  onToggleSidebar,
  isSidebarOpen = false,
  backendStatus,
  selectedModel = "",
  setSelectedModel,
  volume = 0.8,
  setVolume,
  isMuted = false,
  setIsMuted,
  user,
  notifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  projectId = null,
  saveStatus = "idle",
  isDirty = false,
  onSave,
  navigateTo: routerNavigateTo,
  notificationsMuted = false,
  setNotificationsMuted,
  fetchWithInterceptor,
  addNotification,
}: HeaderProps) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showCreditsPopover, setShowCreditsPopover] = useState(false);
  const {
    activeProjectId,
    activeProjectData,
    projectState,
    missingProjectInfo,
    setDrawerOpen,
    clearActiveProject,
  } = useProjectStore();

  const notificationsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const creditsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { modelsByProvider } = useAIModels();

  // Credits state — polled from server every 30 s and on mount
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
      } else if (addNotification) {
        addNotification(res.message || "Failed to claim bonus", "info");
      }
    } catch {
      if (addNotification) {
        addNotification("Error claiming daily bonus", "error");
      }
    }
  };

  // Tracks whether we've already shown the low-balance toast this browser session.
  const sessionWarningFiredRef = useRef(false);

  useEffect(() => {
    if (!fetchWithInterceptor) return;
    const pollCredits = async () => {
      try {
        const payload = await getUserCreditsPayload(fetchWithInterceptor);
        if (payload !== null) {
          setCredits(payload.credits);
          // Fire a one-shot low-balance warning toast per session
          if (
            payload.low_balance &&
            !sessionWarningFiredRef.current &&
            addNotification
          ) {
            sessionWarningFiredRef.current = true;
            addNotification(
              `⚡ Low credits: ${payload.credits} remaining. Top up to keep generating.`,
              "warning"
            );
          }
        }
      } catch {
        // silent — polling errors should not break the header
      }
    };
    pollCredits();
    const interval = setInterval(pollCredits, 30_000);
    return () => clearInterval(interval);
  }, [fetchWithInterceptor, addNotification]);

  // Also sync with user prop when it changes (e.g., after daily claim)
  useEffect(() => {
    if (user?.credits !== undefined) {
      setCredits(user.credits);
    }
  }, [user?.credits]);

  // Search & Navigation Palette states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Keyboard shortcut for Command Palette focus (Ctrl/Cmd + K or /)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
      } else if (
        (event.ctrlKey || event.metaKey) &&
        event.key === "s" &&
        !event.shiftKey &&
        !event.altKey
      ) {
        // Ctrl+S / Cmd+S: save the project
        event.preventDefault();
        if (onSave && saveStatus !== "saving") {
          onSave();
        }
      } else if (
        event.key === "/" &&
        document.activeElement !== searchInputRef.current
      ) {
        if (
          document.activeElement?.tagName !== "INPUT" &&
          document.activeElement?.tagName !== "TEXTAREA"
        ) {
          event.preventDefault();
          searchInputRef.current?.focus();
          setShowSearchDropdown(true);
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Click outside listener for all custom dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(target)
      ) {
        setShowNotifications(false);
      }
      if (statsRef.current && !statsRef.current.contains(target)) {
        setShowStats(false);
      }
      if (creditsRef.current && !creditsRef.current.contains(target)) {
        setShowCreditsPopover(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigateTo = async (path: string) => {
    if (routerNavigateTo) {
      routerNavigateTo(path);
    } else {
      if (isDirty) {
        const confirm = (window as any).confirmAsync || window.confirm;
        const confirmed = await confirm(
          "You have unsaved changes. Are you sure you want to navigate away? Your changes will be lost."
        );
        if (!confirmed) {
          return;
        }
      }
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
  };

  // Metrics details calculations
  const totalWithSpeech = panels.filter(
    (p) => p.speech_text && p.speech_text.trim()
  ).length;
  const totalWithAudio = panels.filter((p) => p.audio_url).length;
  const progressPercent =
    panels.length > 0
      ? Math.round(
          ((totalWithSpeech + totalWithAudio) / (panels.length * 2)) * 100
        )
      : 0;

  // Dynamically computed quality scores — derived from real panel properties
  const audienceRetentionPct =
    panels.length === 0
      ? 0
      : Math.min(
          100,
          Math.round(40 + progressPercent * 0.55 + (totalWithAudio > 0 ? 5 : 0))
        );
  const audienceRetentionLabel =
    audienceRetentionPct >= 75
      ? "High"
      : audienceRetentionPct >= 50
      ? "Medium"
      : audienceRetentionPct > 0
      ? "Low"
      : "—";

  const avgWordsPerPanel =
    totalWithSpeech > 0
      ? panels.reduce((sum, p) => {
          const words = p.speech_text
            ? p.speech_text.trim().split(/\s+/).length
            : 0;
          return sum + words;
        }, 0) / totalWithSpeech
      : 0;
  const ctrScore =
    panels.length === 0
      ? 0
      : Math.min(
          10,
          parseFloat(
            (
              3 +
              Math.min(avgWordsPerPanel / 8, 1) * 5 +
              (progressPercent / 100) * 2
            ).toFixed(1)
          )
        );

  const lastPanel = panels.length > 0 ? panels[panels.length - 1] : null;
  const cliffhangerScore = (() => {
    if (!lastPanel) return "—";
    const hasText =
      lastPanel.speech_text && lastPanel.speech_text.trim().length > 10;
    const hasSfx = lastPanel.sfx && lastPanel.sfx.trim().length > 0;
    const dynamicMotion = [
      "zoom_in",
      "zoom_out",
      "pan_left",
      "pan_right",
    ].includes(lastPanel.motion_type);
    const score =
      (hasText ? 1 : 0) + (hasSfx ? 1 : 0) + (dynamicMotion ? 1 : 0);
    if (score === 3) return "Strong";
    if (score === 2) return "Moderate";
    if (score === 1) return "Weak";
    return panels.length > 0 ? "Weak" : "—";
  })();
  const cliffhangerColor =
    cliffhangerScore === "Strong"
      ? "text-emerald-400"
      : cliffhangerScore === "Moderate"
      ? "text-amber-400"
      : cliffhangerScore === "—"
      ? "text-neutral-500"
      : "text-rose-400";

  // Search Navigation options
  const navigationItems = [
    {
      name: "Main Dashboard",
      path: "/dashboard",
      desc: "Go to series workspace and panel upload",
    },
    {
      name: "Timeline Editor",
      path: "/scraper/editor",
      desc: "Refine timelines, motion settings, and generation",
    },
    {
      name: "Auto-Crop Panel Slicer",
      path: "/auto-crop",
      desc: "Slice webtoon sheets into individual images",
    },

    {
      name: "Voice & Sound Studio",
      path: "/creative-suite/ai-voice",
      desc: "Configure TTS voice actors, sound effects overlay, BGM loops and script dramatization",
    },
    {
      name: "System Log Viewer",
      path: "/logs",
      desc: "Real-time backend worker processes and logs",
    },
    {
      name: "Server Status Dashboard",
      path: "/status",
      desc: "Server connection latency and engine states",
    },
    {
      name: "Keyboard Shortcuts",
      path: "/shortcuts",
      desc: "Quick keys for navigation and timelines",
    },
    {
      name: "User Account Profile",
      path: "/profile",
      desc: "User statistics, account detail settings",
    },
  ];

  const filteredNavItems = navigationItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const matchedPanels = searchQuery.trim()
    ? panels
        .filter(
          (panel) =>
            String(panel.id).includes(searchQuery) ||
            (panel.speech_text &&
              panel.speech_text
                .toLowerCase()
                .includes(searchQuery.toLowerCase()))
        )
        .slice(0, 5)
    : [];

  return (
    <header
      id="header_pane"
      className="w-full h-16 shrink-0 border-b border-white/10 bg-neutral-950/80 backdrop-blur-xl z-50 pl-2 sm:pl-4 lg:pl-0 pr-2 sm:pr-6 md:pr-8 flex items-center justify-between gap-2 sm:gap-4 select-none shadow-md shadow-black/20"
    >
      {/* Left side: Hamburger, Brand, and User Profile */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0 h-full">
        {/* NEW: Wrapper added here to perfectly match the 80px (w-20) width of the mini sidebar */}
        <div className="w-10 sm:w-16 lg:w-20 flex items-center justify-center shrink-0 border-r border-neutral-900/80 h-full mr-1 sm:mr-4">
          <button
            onClick={onToggleSidebar}
            className="icon-pill cursor-pointer hover:icon-pill--purple transition-all"
            title="Toggle Navigation Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>

        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none transition-all duration-300 group/brand"
          onClick={() => navigateTo("/dashboard")}
        >
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-purple-600/30 blur-md pointer-events-none" />
            <img
              src="/logo-dark.png"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
              }}
              className="h-10 w-10 rounded-full shadow-lg shadow-purple-900/50 shrink-0 object-cover relative z-10 transition-all duration-300 group-hover/brand:scale-105 group-hover/brand:rotate-[6deg]"
              style={{
                background: "#000000",
              }}
              alt="Sonikoma Logo"
            />
          </div>
          <span className="font-black text-xl tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-white group-hover/brand:brightness-110 transition-all duration-300 font-sans hidden sm:inline-block">
            Sonikoma
          </span>
        </div>
      </div>

      {/* Center Side: Quick Search / Command Bar */}
      <div
        className="hidden xl:flex flex-1 max-w-xs lg:max-w-sm relative mx-4"
        ref={searchRef}
      >
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-neutral-500" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Quick Find (Ctrl+K or /)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            className="w-full bg-neutral-900 text-xs text-neutral-205 pl-9 pr-8 py-2 rounded-xl border border-neutral-850 focus:border-purple-500/60 focus:bg-neutral-900/90 focus:outline-none transition-all placeholder:text-neutral-500 font-sans shadow-inner shadow-black/45"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[9px] font-mono font-bold text-neutral-500 bg-neutral-950 border border-neutral-850 rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Command Palette Results Dropdown */}
        {showSearchDropdown &&
          (searchQuery.trim() !== "" || filteredNavItems.length > 0) && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0d16]/90 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[360px] overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Pages Section */}
              <div className="p-2 border-b border-neutral-850/60">
                <span className="px-3 py-1.5 text-[9px] font-extrabold font-sans text-purple-400 tracking-wider uppercase block">
                  Jump To Page
                </span>
                <div className="space-y-0.5">
                  {filteredNavItems.slice(0, 6).map((item) => (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigateTo(item.path);
                        setShowSearchDropdown(false);
                        setSearchQuery("");
                      }}
                      className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800/80 flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div>
                        <p className="text-xs font-semibold text-neutral-200 group-hover:text-white">
                          {item.name}
                        </p>
                        <p className="text-[10px] text-neutral-500 truncate max-w-[280px]">
                          {item.desc}
                        </p>
                      </div>
                      <ChevronDown className="-rotate-90 h-3 w-3 text-neutral-600 group-hover:text-purple-400 transition-colors" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Panels Section */}
              {panels.length > 0 && (
                <div className="p-2">
                  <span className="px-3 py-1.5 text-[9px] font-extrabold font-sans text-purple-400 tracking-wider uppercase block">
                    Panel Scripts & Transcripts
                  </span>
                  {matchedPanels.length > 0 ? (
                    <div className="space-y-0.5">
                      {matchedPanels.map((panel) => {
                        const panelIdx = panels.findIndex(
                          (p) => p.id === panel.id
                        );
                        return (
                          <button
                            key={panel.id}
                            onClick={() => {
                              navigateTo(`/editor/adjust?idx=${panelIdx}`);
                              setShowSearchDropdown(false);
                              setSearchQuery("");
                            }}
                            className="w-full text-left px-3 py-2 rounded-xl hover:bg-neutral-800/80 flex items-start gap-3 transition-colors cursor-pointer group"
                          >
                            <div className="w-10 h-7 rounded bg-neutral-950 border border-neutral-850 overflow-hidden shrink-0 flex items-center justify-center">
                              {panel.image_url ? (
                                <img
                                  src={panel.image_url}
                                  alt={`P${panel.id}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="text-[8px] font-mono text-neutral-500">
                                  P{panel.id}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] font-bold text-neutral-300 font-mono">
                                  Panel #{panel.id}
                                </span>
                                <span className="text-[9px] text-neutral-500 group-hover:text-purple-400 font-mono">
                                  {formatDuration(panel.duration)}
                                </span>
                              </div>
                              <p className="text-[10px] text-neutral-500 truncate">
                                {panel.speech_text ||
                                  "No speech script generated"}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : searchQuery.trim() !== "" ? (
                    <p className="text-center py-4 text-[10px] text-neutral-500 italic">
                      No matching panels found
                    </p>
                  ) : (
                    <div className="px-3 py-2 bg-neutral-950/40 border border-neutral-850/60 rounded-xl">
                      <p className="text-[10px] text-neutral-400 font-mono text-center">
                        Type script keywords to search timelines
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
      </div>

      {/* Right side: Volume, Notifications, Stats, Profile */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
        {/* Server Status Pill */}
        <ServerStatusIndicator status={backendStatus} />

        {/* 🤖 Global AI Model Selector */}
        <AIModelSelector compact className="flex" />

        {/* 🧼 Speech Bubble Cleaning Processing Pill */}
        {isCleaningBubbles && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/80 border border-purple-500/50 text-[10px] font-bold font-sans text-purple-300 shadow-[0_0_12px_rgba(168,85,247,0.25)] animate-pulse select-none">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-400 shrink-0" />
            <span>
              {cleanProgress
                ? `Cleaning Bubbles (${cleanProgress.current}/${cleanProgress.total})`
                : "Cleaning Bubbles..."}
            </span>
          </div>
        )}

        {/* ✂️ Auto-Cropping Panels Processing Pill */}
        {isBatchCropping && (
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/50 text-[10px] font-bold font-sans text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)] animate-pulse select-none">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
            <span>
              {batchProgress
                ? `Cropping Panels (${batchProgress.current}/${batchProgress.total})`
                : "Cropping Panels..."}
            </span>
          </div>
        )}

        {/* ⚡ Credits Pill & Popover (Image 1 Style) */}
        {credits !== null && (
          <div className="relative" ref={creditsRef}>
            <button
              onClick={() => {
                setShowCreditsPopover(!showCreditsPopover);
                setShowNotifications(false);
                setShowStats(false);
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
                    navigateTo("/profile?tab=billing");
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
              setShowStats(false);
            }}
            className={`icon-pill cursor-pointer relative transition-all ${
              showNotifications ? "icon-pill--active" : ""
            }`}
            title="Notifications"
          >
            {notificationsMuted ? (
              <BellOff className="h-4 w-4 text-rose-455" />
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
                navigateTo("/notifications");
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
            className={`icon-pill cursor-pointer transition-all relative ${
              projectState === "missing"
                ? "text-rose-300 bg-rose-500/15 border-rose-500/50 hover:bg-rose-500/25"
                : projectState === "loading"
                ? "text-purple-300 bg-purple-500/15 border-purple-500/40 animate-pulse"
                : projectState === "active"
                ? "text-purple-300 bg-purple-500/15 border-purple-500/40 hover:bg-purple-500/25"
                : "hover:bg-purple-500/20 hover:text-purple-300"
            }`}
            title={
              projectState === "missing"
                ? `Project Unavailable: ${
                    missingProjectInfo?.missingId || activeProjectId
                  } — Click to resolve`
                : projectState === "loading"
                ? "Loading project workspace..."
                : projectState === "active"
                ? `Active Project: ${
                    activeProjectData?.project?.title || "Active"
                  } — Click to switch`
                : "Select Active Project"
            }
          >
            {projectState === "missing" ? (
              <AlertCircle className="h-4 w-4 text-rose-400" />
            ) : projectState === "loading" ? (
              <Loader2 className="h-4 w-4 text-purple-400 animate-spin" />
            ) : (
              <FolderSync className="h-4 w-4 text-purple-400" />
            )}

            {projectState === "active" && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-black animate-pulse" />
            )}
            {projectState === "missing" && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-black animate-pulse" />
            )}
          </button>
        </div>

        {/* User Profile Pill at Far Right End (Image 2 Style) */}
        <button
          onClick={() => navigateTo && navigateTo("/profile")}
          className="flex items-center gap-1.5 sm:gap-2 p-1 pl-1.5 sm:pl-3.5 rounded-full bg-[#18191e] border border-[#2b2d35] hover:border-purple-500/50 hover:bg-[#202127] transition-all cursor-pointer select-none group shrink-0 ml-0.5 sm:ml-1 shadow-sm active:scale-95"
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
  );
};

const Header = React.memo(HeaderInner);
export default Header;
