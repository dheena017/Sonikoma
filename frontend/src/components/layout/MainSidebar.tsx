import {
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
  FolderSync,
  Award,
  Menu,
  Zap,
  Database,
} from "lucide-react";

import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { GeneratedPanel } from "@/types";
import { Notification } from "@/features/app_notification";
import { useProjectStore } from "@/store/useProjectStore";
import { useMemo } from "react";
import React from "react";


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

const ActiveProjectSidebarWidget: React.FC<{ setDrawerOpen: (open: boolean) => void }> = ({ setDrawerOpen }) => {
  const { activeProjectId, activeProjectData } = useProjectStore();

  return (
    <div className="p-3 rounded-2xl bg-[#0e0f17] border border-white/10 text-xs shadow-md my-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
          <Zap className="w-3 h-3 text-purple-400" /> Active Project
        </span>
        {activeProjectId ? (
          <span className="text-[9px] text-emerald-400 font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            ● Active
          </span>
        ) : null}
      </div>

      {activeProjectId && activeProjectData ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 shrink-0">
              {activeProjectData.project?.cover_image || activeProjectData.panels?.[0]?.image_url ? (
                <img
                  src={activeProjectData.project?.cover_image || activeProjectData.panels?.[0]?.image_url}
                  alt={activeProjectData.project?.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center text-purple-300 font-bold text-xs">
                  {activeProjectData.project?.title?.charAt(0).toUpperCase() || "P"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex flex-col">
              <h4 className="font-semibold text-xs text-white truncate">
                {activeProjectData.project?.title || "Untitled Project"}
              </h4>
              <span className="text-[10px] text-neutral-400 truncate">
                {activeProjectData.panels?.length || 0} Panels
              </span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-1.5 px-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Switch Project</span>
          </button>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-neutral-400 mb-2">No active project selected.</p>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-500/20 cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Active Project</span>
          </button>
        </div>
      )}
    </div>
  );
};

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
  const setDrawerOpen = useProjectStore((s) => s.setDrawerOpen);
  const chapterPathMatch = currentPath.match(
    /\/series\/[^\/]+\/chapters\/([^\/]+)/
  );
  const isWorkspace = currentPath === "/scraper";
  const isDashboardOverview = currentPath === "/dashboard";
  const isAdminDashboardPath =
    currentPath === "/admin" || currentPath === "/admin/" || currentPath === "/admin-dashboard";
  const isAdminPath =
    currentPath.startsWith("/admin/") && currentPath !== "/admin/";
  const isAutoCrop = currentPath === "/auto-crop";
  const isEditor =
    currentPath.startsWith("/editor") ||
    currentPath.startsWith("/scraper/editor");
  const isImageEditorPath =
    currentPath === "/image-editor" ||
    currentPath === "/image-editor/" ||
    currentPath.startsWith("/image-editor/") ||
    currentPath.includes("/image-editor");
  const isVideoEditorPath =
    currentPath === "/video-editor" ||
    currentPath === "/video-editor/" ||
    currentPath.startsWith("/video-editor/");
  const isShortcuts = currentPath === "/shortcuts";
  const isProjects = currentPath === "/projects";

  const activeProjectId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("id") || params.get("project_id") || projectId;
  }, [currentPath, projectId]);



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
        navigateTo(
          `/scraper/editor/series/${activeSeriesSlug}/chapters/${activeChapterSlug}`
        );
      } else if (activeProjId.startsWith("temp_")) {
        navigateTo(`/scraper/editor?id=${activeProjId}`);
      } else {
        navigateTo(`/scraper?id=${activeProjId}`);
      }
    } else {
      navigateTo("/scraper");
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
      ],
    },
    {
      group: "Creative Studio",
      items: [
        {
          label: "Creative Suite",
          icon: Sparkles,
          active: currentPath === "/creative-suite" || currentPath.startsWith("/creative-suite/") || currentPath.startsWith("/ai-") || currentPath === "/panel-assistant" || currentPath === "/youtube",
          onClick: () => navigateTo("/creative-suite"),
          enabled: true,
        },
        {
          label: "Editor",
          icon: Scissors,
          active: isEditor,
          onClick: () => navigateTo("/editor"),
          enabled: true,
        },
        {
          label: "Image Editor",
          icon: Film,
          active: isImageEditorPath,
          onClick: () => navigateTo("/image-editor"),
          enabled: true,
        },
        {
          label: "Video Editor",
          icon: Film,
          active: isVideoEditorPath,
          onClick: () => navigateTo("/video-editor"),
          enabled: true,
        },
        {
          label: "Admin",
          icon: Shield,
          active: isAdminDashboardPath || isAdminPath,
          onClick: () => navigateTo("/admin"),
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
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-5 space-y-6 bg-gradient-to-b from-neutral-950 via-[#0a0712] to-neutral-950 text-white select-none">
      {/* BRANDING LOGO */}
      <div className="space-y-6 flex flex-col flex-grow min-h-0">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60">
          <div
            className="flex items-center gap-3.5 cursor-pointer group"
            onClick={handleNavigateToDashboardOverview}
          >
            <div className="relative">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />
              <img
                src={themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"}
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                }}
                className="relative h-11 w-11 rounded-full border border-purple-500/30 shrink-0 object-cover bg-black"
                alt="Sonikoma Logo"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white font-sans group-hover:text-purple-300 transition-colors">
                  Sonikoma
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md font-mono">
                  Suite
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
                Vision Pipeline Suite
              </p>
            </div>
          </div>

          {/* Close / toggle button for drawer */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
            title="Close sidebar drawer"
          >
            {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>

        {/* Active Project Sidebar Card Widget */}
        <ActiveProjectSidebarWidget setDrawerOpen={setDrawerOpen} />

        {/* NAVIGATION MENUS WITH HIDDEN SCROLLBAR */}
        <div className="space-y-6 overflow-y-auto flex-grow min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
          {menuItems.map((group, groupIdx) => (
            <div key={group.group} className="space-y-2">
              {groupIdx > 0 && (
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-800/80 to-transparent my-3" />
              )}
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] font-sans pl-2.5 flex items-center gap-2">
                <span>{group.group}</span>
              </h4>
              <ul className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <button
                        onClick={item.onClick}
                        disabled={!item.enabled}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold font-sans transition-all duration-200 cursor-pointer text-left relative group disabled:opacity-35 disabled:cursor-not-allowed ${
                          item.active
                            ? "text-white bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-purple-950/40 border border-purple-500/40 shadow-[0_4px_20px_rgba(168,85,247,0.2)]"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-900/80 border border-transparent hover:border-neutral-800/60"
                        } ${
                          (item as any).isProcessing
                            ? "ring-1 ring-purple-500/50 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                            : ""
                        }`}
                        title={
                          !item.enabled ? (item as any).disabledTip : item.label
                        }
                      >
                        {/* Active Left Indicator Bar */}
                        {item.active && (
                          <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_8px_rgba(168,85,247,0.8)]" />
                        )}

                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 transition-transform duration-200 ${
                              item.active
                                ? "text-purple-300 scale-110"
                                : "text-neutral-400 group-hover:text-purple-300 group-hover:scale-105"
                            }`}
                          />
                          <span className={item.active ? "font-bold text-white" : "font-medium"}>
                            {item.label}
                          </span>
                        </div>
                        {(item as any).badge && (
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-sans font-bold ${
                              item.label === "Notifications" && !item.active
                                ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-sm shadow-purple-900/50"
                                : item.active
                                ? "bg-purple-900/80 text-purple-200 border border-purple-400/30"
                                : "bg-neutral-900 text-neutral-400 border border-neutral-800"
                            }`}
                          >
                            {(item as any).badge}
                          </span>
                        )}
                        {(item as any).isProcessing && (
                          <span className="absolute right-3 top-3.5 h-2 w-2 rounded-full bg-purple-400 animate-ping" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* BOTTOM STATUS CARD */}
      <div className="space-y-3 pt-4 border-t border-neutral-800/60">
        {panels.length > 0 && (
          <div className="px-3.5 py-2.5 rounded-2xl bg-neutral-900/60 border border-neutral-800/80 text-neutral-400 text-xs font-sans flex items-center justify-between backdrop-blur-md">
            <span className="text-neutral-400 text-[11px]">Video Duration:</span>
            <span className="font-bold text-purple-300 text-xs">
              {totalCalculatedDuration.toFixed(1)}s
            </span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Drawer backdrop (visible on both mobile and desktop when open) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 transition-opacity animate-fade-in"
          onClick={onClose}
        />
      )}

      {/* Sidebar drawer container (visible on both mobile and desktop, slides in/out) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 h-screen w-72 shrink-0 bg-neutral-950/95 backdrop-blur-2xl border-r border-neutral-800/80 z-50 transition-all duration-300 ease-out transform overflow-hidden ${
          isOpen
            ? "translate-x-0 shadow-[10px_0_40px_rgba(0,0,0,0.8)]"
            : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};

const Sidebar = React.memo(SidebarInner);
export default Sidebar;
