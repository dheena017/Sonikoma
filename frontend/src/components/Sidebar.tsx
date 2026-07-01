import React, { useState, useEffect, useMemo } from "react";
import {
  Menu,
  Film,
  Activity,
  Terminal,
  Sliders,
  Scissors,
  Brain,
  Keyboard,
  Sparkles,
  X,
  LayoutDashboard,
  Layout,
  ChevronDown,
  ChevronUp,
  FileText,
  Bell,
  Shield,
  FolderOpen,
  Award,
} from "lucide-react";

import { useThemeMode } from "../hooks/useThemeMode";
import { GeneratedPanel } from "../types";
import { Notification } from "./NotificationStack";

interface SidebarProps {
  isProcessing: boolean;
  panels: GeneratedPanel[];
  scrapedImages: string[];
  totalCalculatedDuration: number;
  currentPath: string;
  editingImageIdx: number | null;
  lastEditorPath: string;
  isBatchCropping: boolean;
  isCleaningBubbles: boolean;
  isOpen: boolean;
  onClose: () => void;
  projectId?: string | null;
  isDirty?: boolean;
  navigateTo?: (path: string) => void;
  notifications?: Notification[];
  seriesSlug?: string | null;
  chapterSlug?: string | null;
}

const SidebarInner = ({
  isProcessing,
  panels,
  scrapedImages,
  totalCalculatedDuration,
  currentPath,
  editingImageIdx,
  lastEditorPath,
  isBatchCropping,
  isCleaningBubbles,
  isOpen,
  onClose,
  projectId = null,
  isDirty = false,
  navigateTo: routerNavigateTo,
  notifications = [],
  seriesSlug = null,
  chapterSlug = null,
}: SidebarProps) => {
  const { themeMode } = useThemeMode();
  const chapterPathMatch = currentPath.match(
    /\/series\/[^\/]+\/chapters\/([^\/]+)/
  );
  const isWorkspace = currentPath === "/workspace";
  const isDashboardOverview = currentPath === "/dashboard";
  const isAdminPath = currentPath === "/admin" || currentPath.startsWith("/admin/");
  const isSettings = currentPath === "/settings";
  const isAutoCrop = currentPath === "/auto-crop";
  const isBubbleCleaner = currentPath === "/bubble-cleaner";
  const isEditor = currentPath.startsWith("/editor");
  const isLogs = currentPath === "/logs";
  const isStatus = currentPath === "/status";
  const isShortcuts = currentPath === "/shortcuts";
  const isAIModels = currentPath === "/ai-models";
  const isProjects = currentPath === "/projects";

  const activeProjectId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("project_id") || projectId;
  }, [currentPath, projectId]);

  const isAiSuiteActive =
    currentPath.startsWith("/ai-") || currentPath === "/panel-assistant";
  const [aiSuiteExpanded, setAiSuiteExpanded] = useState(isAiSuiteActive);
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);

  // Automatically expand AI Suite if active route is an AI page
  useEffect(() => {
    if (isAiSuiteActive) {
      setAiSuiteExpanded(true);
    }
  }, [isAiSuiteActive]);

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
    onClose(); // Close mobile drawer when navigating
  };

  const handleNavigateToWorkspace = () => {
    const activeProjId = activeProjectId || projectId;
    const activeSeriesSlug =
      localStorage.getItem("active_series_slug") || seriesSlug;
    const activeChapterSlug =
      localStorage.getItem("active_chapter_slug") || chapterSlug;

    if (activeProjId) {
      if (activeSeriesSlug && activeChapterSlug) {
        navigateTo(`/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`);
      } else {
        navigateTo(`/workspace?id=${activeProjId}`);
      }
    } else {
      navigateTo("/workspace");
    }
  };

  const handleNavigateToDashboardOverview = () => {
    navigateTo("/dashboard");
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const menuItems = [
    {
      group: "Main Workspace",
      items: [
        {
          label: "Dashboard",
          icon: LayoutDashboard,
          active: isDashboardOverview,
          onClick: handleNavigateToDashboardOverview,
          enabled: true,
        },
        {
          label: "Workspace",
          icon: Layout,
          active: isWorkspace,
          onClick: handleNavigateToWorkspace,
          enabled: true,
        },
        {
          label: "Projects",
          icon: FolderOpen,
          active: isProjects,
          onClick: () => navigateTo("/projects"),
          enabled: true,
        },
        {
          label: "Auto-Crop",
          icon: Scissors,
          active: isAutoCrop,
          onClick: () => navigateTo("/auto-crop"),
          enabled: true,
          badge:
            scrapedImages.length > 0
              ? scrapedImages.length
              : panels.length > 0
              ? panels.length
              : undefined,
          isProcessing: isBatchCropping,
        },
        {
          label: "Clean-Bubbles",
          icon: Brain,
          active: isBubbleCleaner,
          onClick: () => navigateTo("/bubble-cleaner"),
          enabled: true,
          isProcessing: isCleaningBubbles,
        },
        {
          label: "Editor",
          icon: Film,
          active: isEditor,
          onClick: () => {
            if (lastEditorPath) navigateTo(lastEditorPath);
          },
          enabled: scrapedImages.length > 0 || panels.length > 0,
          badge:
            editingImageIdx !== null
              ? `#${editingImageIdx + 1}`
              : panels.length > 0
              ? `Total: ${panels.length}`
              : undefined,
          disabledTip: "Requires imported images or timeline panels",
        },
      ],
    },
    {
      group: "Diagnostics & Controls",
      items: [
        {
          label: "Logs",
          icon: Terminal,
          active: isLogs,
          onClick: () => navigateTo("/logs"),
          enabled: true,
        },
        {
          label: "Status",
          icon: Activity,
          active: isStatus,
          onClick: () => navigateTo("/status"),
          enabled: true,
        },
        {
          label: "AI Models",
          icon: Award,
          active: isAIModels,
          onClick: () => navigateTo("/ai-models"),
          enabled: true,
        },
        {
          label: "Keys",
          icon: Keyboard,
          active: isShortcuts,
          onClick: () => navigateTo("/shortcuts"),
          enabled: true,
        },
        {
          label: "Settings",
          icon: Sliders,
          active: isSettings,
          onClick: () => navigateTo("/settings"),
          enabled: true,
        },
      ],
    },
    {
      group: "Account & Alerts",
      items: [
        {
          label: "Notifications",
          icon: Bell,
          active: currentPath === "/notifications",
          onClick: () => navigateTo("/notifications"),
          enabled: true,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          label: "Profile",
          icon: Sparkles,
          active: currentPath === "/profile",
          onClick: () => navigateTo("/profile"),
          enabled: true,
        },
        {
          label: "Admin Dashboard",
          icon: Shield,
          active: isAdminPath,
          onClick: () => navigateTo("/admin"),
          enabled: true,
        },
      ],
    },
  ];

  const creativeSuiteItems = [
    { label: "Video Optimizer", path: "/ai-optimizer" },
    { label: "Panel Assistant", path: "/panel-assistant" },
    { label: "Character DB", path: "/ai-characters" },
    { label: "Translation Studio", path: "/ai-translation" },
    { label: "Sound Design Lab", path: "/ai-audio-lab" },
    { label: "Thumbnail Studio", path: "/ai-thumbnails" },
    { label: "Community Coach", path: "/ai-engagement" },
    { label: "Voice Studio", path: "/ai-voice" },
    { label: "CTR Predictor", path: "/ai-analytics" },
    { label: "YouTube Publisher", path: "/youtube" },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full justify-between p-5 space-y-6">
      {/* BRANDING LOGO */}
      <div className="space-y-6">
        <div className="flex items-center justify-between relative">
          <div
            className={`flex items-center gap-3 cursor-pointer select-none hover:opacity-90 transition-all ${
              !isDesktopExpanded ? "lg:opacity-0 lg:w-0 lg:overflow-hidden" : ""
            }`}
            onClick={handleNavigateToDashboardOverview}
          >
            <img
              src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = "/logo.png";
              }}
              className="h-14 w-14 rounded-full shadow-lg shadow-purple-900/40 shrink-0 object-cover"
              style={{
                background: themeMode === "light" ? "#ffffff" : "#000000",
              }}
              alt="Sonikoma Logo"
            />
            <div className="shrink-0 whitespace-nowrap">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-white font-sans">
                  Sonikoma
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono">
                Vision Pipeline Suite
              </p>
            </div>
          </div>

          {/* Desktop Toggle Button */}
          <button
            onClick={() => setIsDesktopExpanded(!isDesktopExpanded)}
            className="hidden lg:flex p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer absolute -top-2"
            style={{
              left: isDesktopExpanded ? 'auto' : '-4px',
              right: isDesktopExpanded ? '0' : 'auto'
            }}
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* NAVIGATION MENUS */}
        <div className="space-y-6 overflow-y-auto max-h-[calc(100vh-220px)] scrollbar-thin pr-1">
          {menuItems.map((group) => (
            <div key={group.group} className="space-y-2">
              <h4 className={`text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono pl-2 transition-all ${
                !isDesktopExpanded ? "lg:opacity-0 lg:h-0 overflow-hidden" : ""
              }`}>
                {group.group}
              </h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <button
                        onClick={item.onClick}
                        disabled={!item.enabled}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-left relative group disabled:opacity-35 disabled:cursor-not-allowed ${
                          item.active
                            ? "text-white bg-purple-950/20 border border-purple-900/60 shadow-inner"
                            : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border border-transparent"
                        } ${
                          item.isProcessing
                            ? "ring-1 ring-purple-500/50 shadow-[0_0_8px_rgba(168,85,247,0.2)]"
                            : ""
                        }`}
                        title={!item.enabled ? item.disabledTip : item.label}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon
                            className={`h-5 w-5 shrink-0 ${
                              item.active
                                ? "text-purple-400"
                                : "text-neutral-500 group-hover:text-neutral-300"
                            }`}
                          />
                          <span className={`transition-all whitespace-nowrap ${
                            !isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""
                          }`}>
                            {item.label}
                          </span>
                        </div>
                        {item.badge && (
                          <span
                            className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold transition-all ${
                              !isDesktopExpanded ? "lg:hidden" : ""
                            } ${
                              item.label === "Notifications" && !item.active
                                ? "bg-purple-600 text-white shadow-sm shadow-purple-900/50"
                                : item.active
                                ? "bg-purple-900 text-purple-200"
                                : "bg-black/55 text-neutral-400"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                        {item.isProcessing && (
                          <span className="absolute right-3 top-3.5 h-1.5 w-1.5 rounded-full bg-purple-400 animate-ping" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}

          {/* Creative Suite Dropdown/Accordion */}
          <div className="space-y-2">
            <h4 className={`text-[9px] font-bold text-neutral-500 uppercase tracking-widest font-mono pl-2 transition-all ${
                !isDesktopExpanded ? "lg:opacity-0 lg:h-0 overflow-hidden" : ""
              }`}>
              Creative Tools
            </h4>
            <div className="space-y-1">
              <button
                onClick={() => setAiSuiteExpanded(!aiSuiteExpanded)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold font-mono transition-all duration-200 cursor-pointer text-left border ${
                  isAiSuiteActive
                    ? "text-purple-300 bg-purple-950/10 border-purple-900/40"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 border-transparent"
                }`}
                title="Creative Suite"
              >
                <div className="flex items-center gap-2.5">
                  <Sparkles
                    className={`h-5 w-5 shrink-0 ${
                      isAiSuiteActive
                        ? "text-purple-400 animate-pulse"
                        : "text-neutral-500"
                    }`}
                  />
                  <span className={`transition-all whitespace-nowrap ${
                    !isDesktopExpanded ? "lg:opacity-0 lg:w-0 overflow-hidden" : ""
                  }`}>Creative Suite</span>
                </div>
                <div className={`transition-all ${!isDesktopExpanded ? "lg:hidden" : ""}`}>
                  {aiSuiteExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 text-neutral-500 shrink-0" />
                  )}
                </div>
              </button>

              {aiSuiteExpanded && (
                <div className={`transition-all ${!isDesktopExpanded ? "lg:hidden" : ""}`}>
                <div className="pl-4 pr-1 py-1.5 space-y-1 bg-neutral-950/40 rounded-xl border border-neutral-900/40 mt-1">
                  {creativeSuiteItems.map((subItem) => {
                    const isSubActive = currentPath === subItem.path;
                    const requiresPanels = [
                      "/ai-optimizer",
                      "/panel-assistant",
                      "/ai-translation",
                      "/ai-audio-lab",
                      "/ai-voice",
                    ].includes(subItem.path);
                    const isLocked = requiresPanels && panels.length === 0;

                    return (
                      <button
                        key={subItem.label}
                        onClick={() => navigateTo(subItem.path)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-[11px] font-mono hover:bg-neutral-900 hover:text-white transition-all cursor-pointer flex items-center justify-between ${
                          isSubActive
                            ? "text-purple-300 font-bold bg-neutral-900/60"
                            : isLocked
                            ? "text-neutral-500 hover:text-neutral-350"
                            : "text-neutral-400"
                        }`}
                        title={
                          isLocked
                            ? "Requires timeline panels (Click to view details)"
                            : undefined
                        }
                      >
                        <span>✦ {subItem.label}</span>
                        {isLocked && (
                          <span className="text-[9px] text-neutral-600 bg-neutral-950 px-1 py-0.5 rounded border border-neutral-900 font-mono scale-90">
                            🔒 LCK
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM STATUS CARD */}
      <div className="space-y-4 pt-4 border-t border-neutral-900">
        {/* Total calculated output metadata */}
        {panels.length > 0 && (
          <div className={`transition-all ${!isDesktopExpanded ? "lg:hidden" : ""}`}>
          <div className="px-3 py-2 rounded-xl bg-neutral-900/30 text-neutral-400 text-[10px] font-mono flex items-center justify-between border border-neutral-900/40">
            <span>Video Duration:</span>
            <span className="font-bold text-neutral-200">
              {totalCalculatedDuration.toFixed(1)}s
            </span>
          </div>
          </div>
        )}
      </div>
    </div>
  );

  useEffect(() => {
    if (isDesktopExpanded) {
      document.body.style.overflow = "hidden";
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) scrollContainer.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) scrollContainer.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      const scrollContainer = document.getElementById("main-scroll-container");
      if (scrollContainer) scrollContainer.style.overflow = "";
    };
  }, [isDesktopExpanded]);

  return (
    <>
      {/* Drawer backdrop for mobile and desktop overlay */}
      {(isOpen || isDesktopExpanded) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-45 transition-opacity animate-fade-in lg:absolute"
          onClick={() => {
            if (isOpen) onClose();
            if (isDesktopExpanded) setIsDesktopExpanded(false);
          }}
        />
      )}

      {/* Sidebar drawer container */}
      <aside
        className={`fixed lg:absolute inset-y-0 left-0 h-full bg-neutral-950/95 border-r border-neutral-900 z-50 transition-all duration-300 ease-out flex flex-col ${
          isOpen
            ? "translate-x-0 shadow-2xl shadow-black/60 w-72"
            : "-translate-x-full lg:translate-x-0"
        } ${!isDesktopExpanded ? "lg:w-20" : "lg:w-72 lg:shadow-2xl lg:shadow-black/60"}`}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

const Sidebar = React.memo(SidebarInner);
export default Sidebar;
