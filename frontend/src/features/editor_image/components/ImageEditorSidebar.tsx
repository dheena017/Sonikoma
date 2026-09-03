import React from "react";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";
import {
  Layers,
  Sparkles,
  Settings2,
  Brush,
  Scissors,
  Link2,
  Database,
  ExternalLink,
  ArrowLeft,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  useImageEditorStore,
  ImageTool,
} from "@/features/editor_image/hooks/useImageEditorState";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { SonikomaLogo } from "@/shared/ui/branding";
import { ActiveProjectSidebarWidget } from "@/components/layout/MainSidebar";

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
          label: "AI Layer Separation",
          icon: Layers,
          type: "tool",
        },
        {
          id: "train",
          label: "YOLO Fine-Tuner",
          icon: Database,
          type: "tool",
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
      {/* Drawer Backdrop Overlay when open (Hides Header & Prevents Interaction) */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md z-[200] transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setIsCollapsed(true)}
      />

      <aside className="fixed top-0 bottom-0 left-0 h-screen w-72 shrink-0 bg-neutral-950/80 backdrop-blur-2xl border-r border-white/10 flex flex-col transition-all duration-300 ease-out z-[210] shadow-[10px_0_40px_rgba(0,0,0,0.8)] overflow-hidden select-none">
        {/* Top Header / Close Area */}
        <div
          className={`flex items-center border-b border-neutral-800/60 transition-all duration-300 shrink-0 ${
            isCollapsed ? "h-16 justify-center" : "h-16 px-4 justify-between"
          }`}
        >
          {isCollapsed ? (
            <div className="w-11 h-11 rounded-2xl bg-[#3B82F6] border border-[#60A5FA]/40 flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
          ) : (
            <>
              <SonikomaLogo
                size="md"
                badge="Suite"
                showSubtitle={true}
                subtitleText="Comic to Video Studio"
              />
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 border border-neutral-800 transition-colors cursor-pointer"
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
                <div className="w-full h-px bg-neutral-800/60 my-2.5" />
              )}
              {!isCollapsed && (
                <h3 className="px-3 text-[10px] font-bold text-neutral-400 uppercase tracking-[0.16em] font-sans mb-1 flex items-center gap-2">
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
                      {/* Floating Active Ribbon Indicator */}
                      <div
                        className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
                          isActive
                            ? "h-6 bg-[#3B82F6] opacity-100"
                            : "h-0 bg-transparent opacity-0"
                        }`}
                      />

                      <button
                        onClick={() => {
                          if (item.type === "tool" && setActiveTool) {
                            setActiveTool(item.id as ImageTool);
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
                            : "justify-between px-3.5 py-2.5"
                        } rounded-xl transition-all duration-200 group relative cursor-pointer active:scale-[0.98] ${
                          isActive && !isCollapsed
                            ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white font-bold shadow-md"
                            : "text-neutral-300 hover:text-white hover:bg-[#1E1E1E] border border-transparent hover:border-[#3B82F6]"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        {/* Left edge active indicator pill */}
                        {isActive && (
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-full bg-white" />
                        )}

                        <div className="flex items-center gap-3">
                          <Icon
                            strokeWidth={isActive ? 2.5 : 2}
                            className={`w-4 h-4 transition-colors duration-200 ${
                              isActive
                                ? "text-white"
                                : "text-neutral-400 group-hover:text-[#3B82F6]"
                            }`}
                          />

                          {!isCollapsed && (
                            <span className="text-xs font-semibold tracking-wide">
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
                                ? "bg-[#3B82F6] text-white border-[#60A5FA]/40"
                                : "bg-[#121212] text-neutral-400 border-[#2F2F2F]"
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

        {/* Bottom Action Footer - Active Project and Return to Storyboard */}
        <div className="p-4 border-t border-neutral-800/60 bg-transparent flex flex-col gap-3 w-full shrink-0">
          <ActiveProjectSidebarWidget
            setDrawerOpen={(open) => {
              useProjectStore.getState().setDrawerOpen(open);
            }}
          />
          <button
            onClick={handleReturnToWorkspace}
            className={`flex items-center justify-center rounded-xl bg-neutral-900/70 hover:bg-[#3B82F6] text-neutral-300 hover:text-white transition-all active:scale-95 border border-neutral-800/80 hover:border-[#60A5FA]/40 cursor-pointer shadow-sm ${
              isCollapsed
                ? "w-11 h-11 p-0"
                : "w-full py-3.5 px-4 gap-2.5 text-xs font-mono font-bold tracking-wide"
            }`}
            title="Return to Storyboard"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-white stroke-[2.5]" />
            {!isCollapsed && (
              <span className="text-xs font-mono font-bold tracking-wide text-white">
                Return to Storyboard
              </span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};

export default ImageEditorSidebar;
