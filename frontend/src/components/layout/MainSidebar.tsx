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
  Image,
  User,
} from "lucide-react";

import { useThemeMode } from "@/shared/hooks/useThemeMode";
import { GeneratedPanel } from "@/types";
import { Notification } from "@/features/app_notification";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
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

const ActiveProjectSidebarWidget: React.FC<{
  setDrawerOpen: (open: boolean) => void;
}> = ({ setDrawerOpen }) => {
  const { activeProjectId, activeProjectData } = useProjectStore();
  const [imgError, setImgError] = React.useState(false);

  const coverUrl =
    activeProjectData?.project?.cover_image ||
    activeProjectData?.panels?.[0]?.image_url;

  // Reset img error if cover URL changes
  React.useEffect(() => {
    setImgError(false);
  }, [coverUrl]);

  return (
    <div className="p-3 rounded-2xl bg-neutral-900/70 border border-neutral-800/80 text-xs shadow-sm my-2 backdrop-blur-md">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[10px] uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-1.5">
          <Zap className="w-3 h-3 text-purple-400" /> Active Project
        </span>
        {activeProjectId ? (
          <span className="text-[10px] text-emerald-400 font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        ) : null}
      </div>

      {activeProjectId && activeProjectData ? (
        <div className="space-y-2.5">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-950/70 border border-neutral-800/60 hover:border-neutral-700/80 transition-colors">
            <div className="w-9 h-9 rounded-xl overflow-hidden bg-neutral-900 border border-neutral-700/50 shrink-0 flex items-center justify-center shadow-inner">
              {coverUrl && !imgError ? (
                <img
                  src={
                    coverUrl.startsWith("http")
                      ? `/api/proxy-image?url=${encodeURIComponent(coverUrl)}`
                      : coverUrl
                  }
                  alt={activeProjectData.project?.title || "Project Cover"}
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-600/30 to-indigo-600/30 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-xs">
                  {activeProjectData.project?.title?.charAt(0).toUpperCase() || "P"}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-semibold text-xs text-neutral-100 truncate leading-tight">
                {activeProjectData.project?.title || "Untitled Project"}
              </h4>
              <span className="text-[10px] text-neutral-400 truncate font-mono">
                {activeProjectData.panels?.length || 0} panel
                {activeProjectData.panels?.length !== 1 ? "s" : ""}
              </span>
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-neutral-800/80 hover:bg-purple-600/20 text-neutral-300 hover:text-purple-200 border border-neutral-700/60 hover:border-purple-500/40 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <FolderSync className="w-3.5 h-3.5" />
            <span>Switch Project</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="p-2.5 rounded-xl bg-neutral-950/60 border border-neutral-800/60">
            <p className="text-[11px] text-neutral-300 font-medium">
              No active project
            </p>
            <p className="text-[10px] text-neutral-500 mt-0.5">
              Select one to begin editing
            </p>
          </div>
          <button
            onClick={() => setDrawerOpen(true)}
            className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 hover:shadow-purple-600/30 cursor-pointer active:scale-[0.98]"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Select Project</span>
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
    currentPath === "/admin" ||
    currentPath === "/admin/" ||
    currentPath === "/admin-dashboard";
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
          path: "/dashboard",
          onClick: handleNavigateToDashboardOverview,
          enabled: true,
        },
        {
          label: "Projects",
          icon: FolderOpen,
          active: isProjects,
          path: "/projects",
          onClick: () => navigateTo("/projects"),
          enabled: true,
        },
        {
          label: "Workspace",
          icon: Layout,
          active: isWorkspace,
          path: "/scraper",
          onClick: handleNavigateToWorkspace,
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
          active:
            currentPath === "/creative-suite" ||
            currentPath.startsWith("/creative-suite/") ||
            currentPath.startsWith("/ai-") ||
            currentPath === "/panel-assistant" ||
            currentPath === "/youtube",
          path: "/creative-suite",
          onClick: () => navigateTo("/creative-suite"),
          enabled: true,
        },
        {
          label: "AI Core & Multi-Engine",
          icon: Brain,
          active: currentPath === "/ai-core" || currentPath.startsWith("/ai-core/"),
          path: "/ai-core",
          onClick: () => navigateTo("/ai-core"),
          enabled: true,
        },
        {
          label: "Image Editor",
          icon: Image,
          active: isImageEditorPath,
          path: "/image-editor",
          onClick: () => navigateTo("/image-editor"),
          enabled: true,
        },
        {
          label: "Video Editor",
          icon: Film,
          active: isVideoEditorPath,
          path: "/video-editor",
          onClick: () => navigateTo("/video-editor"),
          enabled: true,
        },
        {
          label: "Admin",
          icon: Shield,
          active: isAdminDashboardPath || isAdminPath,
          path: "/admin",
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
          path: "/notifications",
          onClick: () => navigateTo("/notifications"),
          enabled: true,
          badge: unreadCount > 0 ? unreadCount : undefined,
        },
        {
          label: "Profile",
          icon: User,
          active: currentPath === "/profile",
          path: "/profile",
          onClick: () => navigateTo("/profile"),
          enabled: true,
        },
      ],
    },
  ];

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-5 space-y-6 bg-neutral-950/85 backdrop-blur-2xl text-white select-none">
      {/* BRANDING LOGO */}
      <div className="space-y-6 flex flex-col flex-grow min-h-0">
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800/60">
          <div
            className="flex items-center gap-3.5 cursor-pointer group"
            onClick={handleNavigateToDashboardOverview}
          >
            <div className="relative shrink-0 rounded-full border border-[#2F2F2F] group-hover:border-[#3B82F6] transition-colors p-0.5 bg-[#1E1E1E]">
              <img
                src={
                  themeMode === "light" ? "/logo-light.png" : "/logo-dark.png"
                }
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/logo-dark.png";
                }}
                className="h-10 w-10 rounded-full shrink-0 object-cover bg-black"
                alt="Sonikoma Logo"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#E5E5E5] font-sans group-hover:text-[#3B82F6] transition-colors">
                  Sonikoma
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[#3B82F6]/15 text-[#3B82F6] border border-[#3B82F6]/30 rounded-md font-mono">
                  Suite
                </span>
              </div>
              <p className="text-[10px] text-[#9CA3AF] font-sans tracking-wide">
                Comic to Video Studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ACTIVE PROJECT WIDGET (DRAWER TRIGGER) */}
        <ActiveProjectSidebarWidget
          setDrawerOpen={(open) => {
            const event = new CustomEvent("toggle-project-drawer", {
              detail: { open },
            });
            window.dispatchEvent(event);
          }}
        />

        {/* NAVIGATION MENUS WITH HIDDEN SCROLLBAR */}
        <div className="space-y-5 overflow-y-auto flex-grow min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
          {menuItems.map((group, groupIdx) => (
            <div key={group.group} className="space-y-1.5">
              {groupIdx > 0 && (
                <div className="w-full h-px bg-neutral-800/60 my-2.5" />
              )}
              <h4 className="text-[10px] font-bold text-neutral-400 uppercase tracking-[0.16em] font-sans px-3 mb-1 flex items-center gap-2">
                <span>{group.group}</span>
              </h4>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.label}>
                      <button
                        onClick={item.onClick}
                        onMouseEnter={() => {
                          if ((item as any).path) {
                            (window as any).prefetchRoute?.((item as any).path);
                          }
                        }}
                        disabled={!item.enabled}
                        aria-label={item.label}
                        className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold font-sans transition-all duration-150 cursor-pointer text-left relative group disabled:opacity-35 disabled:cursor-not-allowed ${
                          item.active
                            ? "text-white bg-purple-500/15 border border-purple-500/30"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-900 border border-transparent"
                        } ${
                          (item as any).isProcessing
                            ? "ring-1 ring-purple-500/50"
                            : ""
                        }`}
                      >
                        {/* Active Left Indicator Pill */}
                        {item.active && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-purple-400" />
                        )}

                        <div className="flex items-center gap-3">
                          <Icon
                            className={`h-4 w-4 transition-colors duration-150 ${
                              item.active
                                ? "text-purple-300"
                                : "text-neutral-400 group-hover:text-purple-300"
                            }`}
                          />
                          <span
                            className={
                              item.active
                                ? "font-bold text-white"
                                : "font-medium text-neutral-300 group-hover:text-white"
                            }
                          >
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

      {/* BOTTOM STATUS FOOTER */}
      <div className="pt-3 border-t border-neutral-800/60 space-y-2">
        {panels.length > 0 && (
          <div className="px-3 py-2 rounded-xl bg-neutral-900/60 border border-neutral-800/80 text-neutral-400 text-xs font-sans flex items-center justify-between backdrop-blur-md">
            <span className="text-neutral-400 text-[11px]">
              Video Duration:
            </span>
            <span className="font-bold text-purple-300 text-xs">
              {totalCalculatedDuration.toFixed(1)}s
            </span>
          </div>
        )}
        <div className="flex items-center justify-between text-[11px] text-neutral-400 px-2 py-0.5">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            System Online
          </span>
          <span className="font-mono text-neutral-400 text-[10px]">v1.2.0</span>
        </div>
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
        className={`fixed top-0 bottom-0 left-0 h-screen w-72 shrink-0 bg-neutral-950/80 backdrop-blur-2xl border-r border-white/10 z-50 transition-all duration-300 ease-out transform overflow-hidden ${
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
