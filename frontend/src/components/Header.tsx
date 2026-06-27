import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Film,
  Menu,
  Bell,
  BellOff,
  X,
  Settings,
  Search,
  Volume2,
  VolumeX,
  Volume1,
  Activity,
  Check,
  ChevronDown,
  Loader2,
  Sparkles,
  Sliders,
  Paintbrush,
  HelpCircle,
  FileText,
  Sun,
  Moon,
} from "lucide-react";
import { GeneratedPanel } from "../types";
import NotificationDropdown from "./NotificationDropdown";
import { Notification } from "./NotificationStack";
import { useAIModels } from "@/hooks/useAIModels";

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
  setNarrationStyle?: (style: "long" | "short") => void;
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
  themeMode?: "dark" | "light";
  toggleThemeMode?: () => void;
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
  setNarrationStyle,
  selectedModel = "gemini-2.5-flash",
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
  themeMode = "dark",
  toggleThemeMode,
}: HeaderProps) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const { models: aiModels } = useAIModels();

  // Search & Navigation Palette states
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut for Command Palette focus (Ctrl/Cmd + K or /)
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
        setShowSearchDropdown(true);
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
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        setShowSettings(false);
      }
      if (statsRef.current && !statsRef.current.contains(target)) {
        setShowStats(false);
      }
      if (searchRef.current && !searchRef.current.contains(target)) {
        setShowSearchDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Theme configuration
  const [accentColor, setAccentColor] = useState<string>(() => {
    return localStorage.getItem("app-accent-color") || "purple";
  });

  useEffect(() => {
    localStorage.setItem("app-accent-color", accentColor);
    let styleEl = document.getElementById("dynamic-theme-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "dynamic-theme-style";
      document.head.appendChild(styleEl);
    }

    const themeColors: Record<string, string> = {
      purple: ``, // Reset theme variables
      emerald: `
        :root {
          --color-purple-400: var(--color-emerald-400, #34d399);
          --color-purple-500: var(--color-emerald-500, #10b981);
          --color-purple-600: var(--color-emerald-600, #059669);
          --color-purple-750: var(--color-emerald-700, #047857);
          --color-purple-900: var(--color-emerald-900, #064e3b);
          --color-purple-950: var(--color-emerald-950, #022c22);
          --color-indigo-600: var(--color-teal-600, #0d9488);
          --color-indigo-700: var(--color-teal-700, #0f766e);
        }
      `,
      rose: `
        :root {
          --color-purple-400: var(--color-rose-300, #fda4af);
          --color-purple-500: var(--color-rose-500, #f43f5e);
          --color-purple-600: var(--color-rose-600, #e11d48);
          --color-purple-750: var(--color-rose-700, #be123c);
          --color-purple-900: var(--color-rose-900, #881337);
          --color-purple-950: var(--color-rose-950, #4c0519);
          --color-indigo-600: var(--color-pink-600, #db2777);
          --color-indigo-700: var(--color-pink-700, #be185d);
        }
      `,
      amber: `
        :root {
          --color-purple-400: var(--color-amber-400, #fbbf24);
          --color-purple-500: var(--color-amber-500, #f59e0b);
          --color-purple-600: var(--color-amber-600, #d97706);
          --color-purple-750: var(--color-amber-700, #b45309);
          --color-purple-900: var(--color-amber-900, #78350f);
          --color-purple-950: var(--color-amber-950, #451a03);
          --color-indigo-600: var(--color-orange-600, #ea580c);
          --color-indigo-700: var(--color-orange-700, #c2410c);
        }
      `,
      cyan: `
        :root {
          --color-purple-400: var(--color-cyan-400, #22d3ee);
          --color-purple-500: var(--color-cyan-500, #06b6d4);
          --color-purple-600: var(--color-cyan-600, #0891b2);
          --color-purple-750: var(--color-cyan-700, #0e7490);
          --color-purple-900: var(--color-cyan-900, #164e63);
          --color-purple-950: var(--color-cyan-950, #083344);
          --color-indigo-600: var(--color-blue-600, #2563eb);
          --color-indigo-700: var(--color-blue-700, #1d4ed8);
        }
      `,
      slate: `
        :root {
          --color-purple-400: var(--color-neutral-350, #d4d4d4);
          --color-purple-500: var(--color-neutral-450, #a3a3a3);
          --color-purple-600: var(--color-neutral-600, #525252);
          --color-purple-750: var(--color-neutral-750, #3f3f46);
          --color-purple-900: var(--color-neutral-850, #262626);
          --color-purple-950: var(--color-neutral-925, #171717);
          --color-indigo-600: var(--color-zinc-600, #52525b);
          --color-indigo-700: var(--color-zinc-700, #3f3f46);
        }
      `,
    };

    styleEl.innerHTML = themeColors[accentColor] || "";
  }, [accentColor]);

  // Audio Playback Auto-play setting local storage
  const [autoPlayAudio, setAutoPlayAudio] = useState(() => {
    return localStorage.getItem("app-autoplay-audio") === "true";
  });
  useEffect(() => {
    localStorage.setItem("app-autoplay-audio", String(autoPlayAudio));
  }, [autoPlayAudio]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navigateTo = async (path: string) => {
    if (routerNavigateTo) {
      routerNavigateTo(path);
    } else {
      if (isDirty) {
        const confirm = (window as any).confirmAsync || window.confirm;
        const confirmed = await (window as any).confirmAsync(
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
  // Est. Audience Retention: based on composition completeness (speech + audio coverage)
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

  // A/B Title CTR: based on narration richness (avg words per narrated panel)
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

  // Cliffhanger Ending Index: based on last panel's speech, sfx, and motion dynamism
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
      path: "/editor",
      desc: "Refine timelines, motion settings, and generation",
    },
    {
      name: "Auto-Crop Panel Slicer",
      path: "/auto-crop",
      desc: "Slice webtoon sheets into individual images",
    },
    {
      name: "Clean-Bubbles Editor",
      path: "/bubble-cleaner",
      desc: "Smart text bubble erasing and clearing",
    },
    {
      name: "Audio Design Lab",
      path: "/ai-audio-lab",
      desc: "Overlay SFX, composition themes, and voice actors",
    },
    {
      name: "Voice Studio",
      path: "/ai-voice",
      desc: "Configure TTS and preview voice characters",
    },
    {
      name: "CTR Analytics & Title Predictor",
      path: "/ai-analytics",
      desc: "A/B validate thumbnails, CTR, and retention",
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
      className="border-b border-neutral-900 bg-neutral-950/80 backdrop-blur-md sticky top-0 z-40 pl-4 pr-6 md:pr-8 py-3 flex items-center justify-between gap-4"
    >
      {/* Left side: Hamburger and Brand */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-1.5 rounded-lg border border-neutral-800 bg-neutral-900 text-neutral-400 hover:text-white cursor-pointer"
          title="Toggle Navigation Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div
          className="flex items-center gap-2 cursor-pointer select-none transition-all duration-300"
          onClick={() => navigateTo("/dashboard")}
        >
          <img
            key={themeMode}
            src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
            onError={(e) => {
              // Graceful fallback to shared logo if mode-specific file missing
              (e.currentTarget as HTMLImageElement).src = "/logo.png";
            }}
            className="h-8 w-8 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover transition-all duration-300 animate-[fadeIn_0.3s_ease-out]"
            style={{
              background: themeMode === "light" ? "#ffffff" : "#000000",
            }}
            alt="Sonikoma Logo"
          />
          <span className="font-bold text-sm tracking-tight text-white font-sans hidden sm:inline">
            Sonikoma
          </span>
        </div>
      </div>

      {/* Center Side: Quick Search / Command Bar */}
      <div
        className="hidden md:flex flex-1 max-w-sm lg:max-w-md relative"
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
            <div className="absolute top-full left-0 right-0 mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-[360px] overflow-y-auto scrollbar-thin">
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

      {/* Right side: Volume, Notifications, Settings, Stats, Profile */}
      <div className="flex items-center gap-2 lg:gap-3 shrink-0">
        {/* Playback Volume Widget */}
        <div className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-850 px-2.5 py-1.5 rounded-xl hover:border-neutral-750 transition-all select-none group h-[34px]">
          <button
            onClick={() => setIsMuted && setIsMuted(!isMuted)}
            className="text-neutral-400 hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            title={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="h-4 w-4 text-rose-450" />
            ) : volume < 0.4 ? (
              <Volume1 className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4 text-purple-400" />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (setVolume) setVolume(val);
              if (val > 0 && isMuted && setIsMuted) {
                setIsMuted(false);
              }
            }}
            className="w-12 sm:w-16 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-purple-500 outline-none transition-all"
            title={`Volume: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
          />
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowSettings(false);
              setShowStats(false);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer relative h-[34px] w-[34px] flex items-center justify-center ${
              showNotifications
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-750"
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

        {/* Project Statistics Popover Button */}
        <div className="relative" ref={statsRef}>
          <button
            onClick={() => {
              setShowStats(!showStats);
              setShowSettings(false);
              setShowNotifications(false);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer relative h-[34px] w-[34px] flex items-center justify-center ${
              showStats
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-750"
            }`}
            title="Timeline Analytics & Statistics"
          >
            <Activity className="h-4 w-4" />
          </button>

          {showStats && (
            <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] sm:w-72 max-w-[360px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-4 origin-top sm:origin-top-right">
              <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5">
                <Activity className="h-4 w-4" /> Timeline Analytics
              </h3>

              <div className="space-y-3">
                {/* Completion Dial Widget */}
                <div className="bg-neutral-955/40 border border-neutral-850 p-3 rounded-xl flex items-center gap-3">
                  <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="#1f1f1f"
                        strokeWidth="3.5"
                        fill="transparent"
                      />
                      <circle
                        cx="24"
                        cy="24"
                        r="20"
                        stroke="var(--color-purple-500, #a855f7)"
                        strokeWidth="3.5"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 20}
                        strokeDashoffset={
                          2 * Math.PI * 20 * (1 - progressPercent / 100)
                        }
                        className="transition-all duration-500"
                      />
                    </svg>
                    <span className="absolute text-[10px] font-bold text-neutral-250 font-mono">
                      {progressPercent}%
                    </span>
                  </div>
                  <div>
                    <h4 className="text-[11px] font-bold text-neutral-200">
                      Composition Progress
                    </h4>
                    <p className="text-[9px] text-neutral-500 leading-relaxed font-mono">
                      Speech + Audio coverage
                    </p>
                  </div>
                </div>

                {/* Numeric Grid */}
                <div className="grid grid-cols-2 gap-2 text-center">
                  <div className="bg-neutral-950/30 border border-neutral-850/60 p-2 rounded-lg">
                    <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-wide">
                      Total Panels
                    </p>
                    <p className="text-sm font-black text-white font-mono mt-0.5">
                      {panels.length}
                    </p>
                  </div>
                  <div className="bg-neutral-950/30 border border-neutral-850/60 p-2 rounded-lg">
                    <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-wide">
                      Est. Duration
                    </p>
                    <p className="text-sm font-black text-purple-400 font-mono mt-0.5">
                      {formatDuration(totalCalculatedDuration)}
                    </p>
                  </div>
                  <div className="bg-neutral-950/30 border border-neutral-850/60 p-2 rounded-lg">
                    <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-wide">
                      Narrated
                    </p>
                    <p className="text-xs font-bold text-neutral-300 font-mono mt-0.5">
                      {totalWithSpeech}{" "}
                      <span className="text-[9px] text-neutral-500">
                        panels
                      </span>
                    </p>
                  </div>
                  <div className="bg-neutral-950/30 border border-neutral-850/60 p-2 rounded-lg">
                    <p className="text-[9px] text-neutral-500 font-mono uppercase tracking-wide">
                      Audio Rendered
                    </p>
                    <p className="text-xs font-bold text-neutral-300 font-mono mt-0.5">
                      {totalWithAudio}{" "}
                      <span className="text-[9px] text-neutral-500">
                        tracks
                      </span>
                    </p>
                  </div>
                </div>

                {/* Predicted Engagement metrics */}
                <div className="bg-neutral-955/20 border border-neutral-850/60 rounded-xl p-2.5 space-y-1.5">
                  <span className="text-[9px] font-extrabold font-sans text-neutral-400 uppercase tracking-wide block">
                    Predicted Quality Scores
                  </span>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-neutral-500 font-mono">
                      Est. Audience Retention:
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        panels.length === 0
                          ? "text-neutral-500"
                          : audienceRetentionPct >= 75
                          ? "text-emerald-400"
                          : audienceRetentionPct >= 50
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {panels.length === 0
                        ? "—"
                        : `${audienceRetentionPct}% (${audienceRetentionLabel})`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-neutral-500 font-mono">
                      A/B Title CTR Expectation:
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        panels.length === 0
                          ? "text-neutral-500"
                          : ctrScore >= 7
                          ? "text-purple-400"
                          : ctrScore >= 5
                          ? "text-amber-400"
                          : "text-rose-400"
                      }`}
                    >
                      {panels.length === 0 ? "—" : `${ctrScore}/10`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-neutral-500 font-mono">
                      Cliffhanger Ending Index:
                    </span>
                    <span className={`font-bold font-mono ${cliffhangerColor}`}>
                      {cliffhangerScore}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Settings Dropdown (Cog Button) */}
        <div className="relative" ref={settingsRef}>
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowStats(false);
              setShowNotifications(false);
            }}
            className={`p-1.5 rounded-xl border transition-all cursor-pointer relative h-[34px] w-[34px] flex items-center justify-center ${
              showSettings
                ? "bg-purple-600 border-purple-500 text-white"
                : "bg-neutral-900 border-neutral-850 text-neutral-400 hover:text-white hover:border-neutral-750"
            }`}
            title="Quick Settings & Preferences"
          >
            <Settings className="h-4 w-4" />
          </button>

          {showSettings && (
            <div className="fixed left-1/2 -translate-x-1/2 top-16 sm:absolute sm:left-auto sm:translate-x-0 sm:right-0 sm:top-auto sm:mt-2 w-[calc(100vw-1rem)] sm:w-72 max-w-[360px] bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150 p-4 space-y-4 origin-top sm:origin-top-right">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Sliders className="h-4 w-4" /> Quick Settings
                </h3>
                <p className="text-[9px] text-neutral-500 font-mono mt-0.5">
                  Configure preferences for this rendering session
                </p>
              </div>

              {/* Models Settings */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-300 font-sans block">
                  Models
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel?.(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-850 text-white rounded-lg px-3 py-2 text-xs focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 font-mono"
                >
                  {aiModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-2 border-y border-neutral-850 py-3">
                {/* Narration style select inside settings */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-300">
                      Narration Script Length
                    </p>
                    <p className="text-[9px] text-neutral-500 font-mono">
                      Long Storyteller vs Snappy Subtitles
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (setNarrationStyle) {
                        setNarrationStyle(
                          narrationStyle === "long" ? "short" : "long"
                        );
                      }
                    }}
                    className={`px-2 py-1 rounded text-[9px] font-bold font-mono tracking-wider transition-colors cursor-pointer border border-neutral-800 ${
                      narrationStyle === "long"
                        ? "border-purple-500/40 bg-purple-950/30 text-purple-300"
                        : "border-emerald-500/40 bg-emerald-950/30 text-emerald-300"
                    }`}
                  >
                    {narrationStyle === "long" ? "STORYTELLER" : "SUBTITLES"}
                  </button>
                </div>

                {/* Auto Play Audio Checkbox */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-300">
                      Auto-play TTS Audios
                    </p>
                    <p className="text-[9px] text-neutral-500 font-mono">
                      Play voice on selection
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPlayAudio}
                    onChange={(e) => setAutoPlayAudio(e.target.checked)}
                    className="w-4 h-4 rounded bg-neutral-950 border border-neutral-850 accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Dark / Light Mode Toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold text-neutral-300">
                      Interface Appearance
                    </p>
                    <p className="text-[9px] text-neutral-500 font-mono">
                      {themeMode === "dark"
                        ? "Dark mode active"
                        : "Light mode active"}
                    </p>
                  </div>
                  <button
                    onClick={toggleThemeMode}
                    title={
                      themeMode === "dark"
                        ? "Switch to Light Mode"
                        : "Switch to Dark Mode"
                    }
                    className={`relative inline-flex items-center w-14 h-7 rounded-full border-2 transition-all duration-300 cursor-pointer focus:outline-none ${
                      themeMode === "light"
                        ? "bg-amber-400 border-amber-500 shadow-[0_0_10px_rgba(251,191,36,0.4)]"
                        : "bg-neutral-800 border-neutral-700"
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded-full shadow-md transform transition-transform duration-300 ${
                        themeMode === "light"
                          ? "translate-x-7 bg-white"
                          : "translate-x-1 bg-neutral-600"
                      }`}
                    >
                      {themeMode === "light" ? (
                        <Sun className="h-3 w-3 text-amber-500" />
                      ) : (
                        <Moon className="h-3 w-3 text-neutral-300" />
                      )}
                    </span>
                  </button>
                </div>
              </div>

              {/* Color Theme Selector */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-300 font-sans block flex items-center gap-1.5">
                  <Paintbrush className="h-3.5 w-3.5" /> Accent Color Theme
                </span>
                <div className="flex gap-2.5 items-center bg-neutral-950/30 border border-neutral-850 p-2 rounded-xl justify-center">
                  {[
                    {
                      id: "purple",
                      color: "bg-purple-600",
                      border: "border-purple-400",
                      label: "Classic Purple",
                    },
                    {
                      id: "emerald",
                      color: "bg-emerald-600",
                      border: "border-emerald-400",
                      label: "Neon Emerald",
                    },
                    {
                      id: "rose",
                      color: "bg-rose-600",
                      border: "border-rose-450",
                      label: "Vibrant Rose",
                    },
                    {
                      id: "amber",
                      color: "bg-amber-600",
                      border: "border-amber-400",
                      label: "Retro Amber",
                    },
                    {
                      id: "cyan",
                      color: "bg-cyan-600",
                      border: "border-cyan-400",
                      label: "Ocean Cyan",
                    },
                    {
                      id: "slate",
                      color: "bg-neutral-400",
                      border: "border-neutral-200",
                      label: "Monochrome Slate",
                    },
                  ].map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => setAccentColor(theme.id)}
                      className={`w-5 h-5 rounded-full ${
                        theme.color
                      } cursor-pointer transition-all border-2 relative flex items-center justify-center ${
                        accentColor === theme.id
                          ? `${theme.border} scale-110 shadow-lg`
                          : "border-transparent opacity-60 hover:opacity-100 hover:scale-105"
                      }`}
                      title={theme.label}
                    >
                      {accentColor === theme.id && (
                        <Check className="h-3 w-3 text-white font-bold" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <button
          onClick={() => navigateTo("/profile")}
          className="flex items-center gap-2 px-1.5 py-1 rounded-xl bg-neutral-900 border border-neutral-850 hover:border-purple-500/50 hover:bg-neutral-850 transition-all cursor-pointer overflow-hidden max-w-[120px] h-[34px]"
          title="View Profile"
        >
          <div className="w-6 h-6 rounded-lg bg-purple-600/20 flex items-center justify-center overflow-hidden shrink-0 border border-purple-500/30">
            {user?.avatar_url ? (
              user.avatar_url.startsWith("linear-gradient") ? (
                <div
                  className="w-full h-full"
                  style={{ background: user.avatar_url }}
                />
              ) : (
                <img
                  src={user.avatar_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              )
            ) : (
              <span className="text-[10px] font-bold text-purple-400">U</span>
            )}
          </div>
          <span className="text-[10px] font-bold text-neutral-300 truncate hidden sm:inline">
            {user?.full_name?.split(" ")[0] || "User"}
          </span>
        </button>
      </div>
    </header>
  );
}
