import React from "react";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";
import {
  LayoutGrid,
  Layout,
  Layers,
  Sparkles,
  Settings2,
  Brush,
  Scissors,
  Crop,
  Link2,
  Database,
  Brain,
  Settings,
  ExternalLink,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useImageEditorStore,
  ImageTool,
} from "@/features/editor_image/hooks/useImageEditorState";

export interface ImageEditorSidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
  activeTool?: ImageTool;
  setActiveTool?: (tool: ImageTool) => void;
  onBackToApp?: () => void;
  scrapedCount?: number;
  panelsCount?: number;
  navigateTo?: (path: string) => void;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  onOpenAutoCropModal?: () => void;
}

interface SidebarMenuItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  isProcessing?: boolean;
  type: "tool" | "nav" | "modal" | "link";
}

interface SidebarGroup {
  title: string;
  items: SidebarMenuItem[];
}

export const ImageEditorSidebar: React.FC<ImageEditorSidebarProps> = ({
  isCollapsed,
  setIsCollapsed,
  activeTool = "crop",
  setActiveTool,
  onBackToApp,
  scrapedCount = 0,
  panelsCount = 0,
  navigateTo,
  projectId,
  seriesSlug,
  chapterSlug,
  onOpenAutoCropModal,
}) => {
  const slicesCount = useImageEditorStore((state) => state.slicesCount);

  const menuGroups: SidebarGroup[] = [
    {
      title: "Editing Tools",
      items: [
        {
          id: "adjust",
          label: "Color & Filters",
          icon: Sparkles,
          type: "tool",
        },
        {
          id: "edit",
          label: "Transform & Bounds",
          icon: Settings2,
          type: "tool",
        },
        {
          id: "draw",
          label: "Retouch & Brush",
          icon: Brush,
          type: "tool",
        },
        {
          id: "slice",
          label: "Horizontal Cutter",
          icon: Scissors,
          type: "tool",
        },
        {
          id: "crop",
          label: "Panel Cuts Registry",
          icon: Crop,
          badge: slicesCount > 0 ? slicesCount : undefined,
          type: "tool",
        },
        {
          id: "merge",
          label: "Merge Panels",
          icon: Link2,
          type: "tool",
        },
      ],
    },
    {
      title: "AI Intelligence",
      items: [
        {
          id: "separate",
          label: "Layer Separation",
          icon: Layers,
          type: "tool",
        },
        {
          id: "train",
          label: "YOLO AI Fine-Tuner",
          icon: Database,
          type: "tool",
        },
        {
          id: "autocrop-hub",
          label: "Auto Panel Detection",
          icon: Brain,
          type: "modal",
        },
      ],
    },
    {
      title: "Preferences",
      items: [
        {
          id: "settings",
          label: "Editor Settings",
          icon: Settings,
          type: "link",
        },
      ],
    },
  ];

  const handleReturnToWorkspace = () => {
    if (onBackToApp) {
      onBackToApp();
      return;
    }
    const path = resolveWorkspaceReturnPath({
      projectId,
      searchParams: window.location.search,
    });

    if (navigateTo) {
      navigateTo(path);
    } else {
      window.history.pushState({}, "", path);
      window.dispatchEvent(new Event("popstate"));
    }
    setIsCollapsed(true);
  };

  if (isCollapsed) return null;

  return (
    <>
      {/* Drawer Backdrop Overlay when open (Hides Header & Prevents Scrolling) */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[110] transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setIsCollapsed(true)}
      />

      <aside className="fixed top-0 bottom-0 left-0 h-screen w-[280px] bg-[#06060c]/90 backdrop-blur-3xl border-r border-white/8 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[120] shadow-[10px_0_40px_rgba(0,0,0,0.7),inset_-1px_0_0_rgba(168,85,247,0.06)] overflow-hidden select-none">
        {/* Top Header / Close Area */}
        <div
          className={`flex items-center border-b border-neutral-800/60 transition-all duration-300 shrink-0 ${
            isCollapsed ? "h-16 justify-center" : "h-16 px-4 justify-between"
          }`}
        >
          {isCollapsed ? (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-950/60 border border-purple-500/50 flex items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.35)]">
              <Sparkles className="w-5 h-5 text-purple-300 animate-pulse" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3.5">
                <div className="relative">
                  <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />
                  <img
                    src="/logo-dark.png"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "/logo-dark.png";
                    }}
                    className="relative h-11 w-11 rounded-full border border-purple-500/30 shrink-0 object-cover bg-black"
                    alt="Sonikoma Logo"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-base tracking-tight text-white font-sans">
                      Image Studio
                    </span>
                    <span className="px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-md font-mono">
                      IMAGE
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 font-sans tracking-wide">
                    Image Processing Suite
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCollapsed(true)}
                className="w-8 h-8 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-purple-300 hover:bg-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
                title="Close sidebar"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Navigation Groups */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {menuGroups.map((group, groupIdx) => (
            <div key={group.title} className="space-y-2">
              {!isCollapsed && groupIdx > 0 && (
                <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-neutral-800/80 to-transparent my-2" />
              )}
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.18em] font-sans mb-1">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.type === "tool" && activeTool === item.id;

                  return (
                    <div key={item.id} className="relative flex justify-center">
                      {/* Premium Floating Active Ribbon Pill */}
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
                          isActive
                            ? "h-6 bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] opacity-100"
                            : "h-0 bg-transparent opacity-0"
                        }`}
                      />

                      <button
                        onClick={() => {
                          if (item.type === "tool" && setActiveTool) {
                            setActiveTool(item.id as ImageTool);
                          } else if (
                            item.id === "autocrop-hub" &&
                            onOpenAutoCropModal
                          ) {
                            onOpenAutoCropModal();
                          } else if (
                            item.id === "canvas" ||
                            item.id === "image-editor"
                          ) {
                            const hasValidSlugs =
                              seriesSlug &&
                              chapterSlug &&
                              seriesSlug !== "null" &&
                              chapterSlug !== "null";
                            const projId =
                              projectId ||
                              new URLSearchParams(window.location.search).get(
                                "id"
                              ) ||
                              "";
                            const target = hasValidSlugs
                              ? `/scraper/editor/series/${seriesSlug}/chapters/${chapterSlug}/image-editor?idx=0`
                              : `/scraper/editor/image-editor?id=${projId}&idx=0`;
                            if (navigateTo) {
                              navigateTo(target);
                            } else {
                              window.history.pushState({}, "", target);
                              window.dispatchEvent(new Event("popstate"));
                            }
                          }
                          setIsCollapsed(true);
                        }}
                        className={`w-full flex items-center ${
                          isCollapsed
                            ? "justify-center py-1"
                            : "justify-between px-2.5 py-1.5"
                        } rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                          isActive && !isCollapsed
                            ? "bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-purple-950/40 border border-purple-500/40 text-white shadow-[0_4px_20px_rgba(168,85,247,0.2)] font-bold"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-900/60 border border-transparent"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          {/* iOS-Style Squircle Icon Pill (Identical to ImageEditorMiniSidebar) */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                              isActive
                                ? "bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-purple-500/60 shadow-[0_0_18px_rgba(168,85,247,0.35)] scale-105"
                                : "bg-neutral-900/80 border border-neutral-800/80 group-hover:bg-purple-500/15 group-hover:border-purple-500/30"
                            }`}
                          >
                            <Icon
                              strokeWidth={isActive ? 2.5 : 2}
                              className={`w-5 h-5 transition-colors duration-300 ${
                                isActive
                                  ? "text-purple-300"
                                  : "text-neutral-400 group-hover:text-purple-300"
                              }`}
                            />
                          </div>

                          {!isCollapsed && (
                            <span className="text-sm font-bold tracking-wide">
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Badge Logic */}
                        {item.badge !== undefined && (
                          <span
                            className={`absolute ${
                              isCollapsed
                                ? "-top-1 -right-1"
                                : "relative top-0 right-0"
                            } flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-lg text-[10px] font-bold font-mono transition-colors border ${
                              isActive
                                ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                                : "bg-neutral-900 text-neutral-500 border-white/5"
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Bottom Action Footer - Return to Workspace */}
        <div className="p-3.5 border-t border-neutral-800/60 bg-neutral-950/90 flex justify-center w-full shrink-0">
          <button
            onClick={handleReturnToWorkspace}
            className={`flex items-center justify-center rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-500 hover:to-indigo-500 text-white transition-all active:scale-95 border border-purple-400/30 cursor-pointer shadow-[0_4px_14px_rgba(139,92,246,0.3)] hover:shadow-[0_6px_20px_rgba(139,92,246,0.5)] ${
              isCollapsed
                ? "w-11 h-11 p-0"
                : "w-full py-3.5 px-4 gap-3 text-xs font-black tracking-widest uppercase"
            }`}
            title="Return to Workspace"
          >
            <ExternalLink className="w-5 h-5 shrink-0 text-purple-200" />
            {!isCollapsed && (
              <span className="text-xs font-black tracking-widest uppercase">
                Return to Workspace
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default ImageEditorSidebar;
