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
import { SonikomaLogo } from "@/shared/ui/branding";

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
      {/* Drawer Backdrop Overlay when open (Hides Header & Prevents Scrolling) */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[110] transition-opacity animate-[fadeIn_0.2s_ease-out]"
        onClick={() => setIsCollapsed(true)}
      />

      <aside className="fixed top-0 bottom-0 left-0 h-screen w-[280px] bg-[#06060c]/90 backdrop-blur-3xl border-r border-white/8 flex flex-col transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] z-[120] shadow-[10px_0_40px_rgba(0,0,0,0.7),inset_-1px_0_0_rgba(59,130,246,0.06)] overflow-hidden select-none">
        {/* Top Header / Close Area */}
        <div
          className={`flex items-center border-b border-neutral-800/60 transition-all duration-300 shrink-0 ${
            isCollapsed ? "h-16 justify-center" : "h-16 px-4 justify-between"
          }`}
        >
          {isCollapsed ? (
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/50 to-purple-950/60 border border-[#3B82F6]/50 flex items-center justify-center ">
              <Sparkles className="w-5 h-5 text-[#60A5FA] animate-pulse" />
            </div>
          ) : (
            <>
              <SonikomaLogo
                size="sm"
                badge="Image"
                showSubtitle={true}
                subtitleText="Image Studio"
              />
              <button
                onClick={() => setIsCollapsed(true)}
                className="w-8 h-8 rounded-xl bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white cursor-pointer transition-all duration-200 flex items-center justify-center active:scale-95 shadow-sm"
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
                            ? "h-6 bg-gradient-to-b from-purple-400 to-amber-400  opacity-100"
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
                            : "justify-between px-2.5 py-1.5"
                        } rounded-2xl transition-all duration-300 group relative cursor-pointer active:scale-[0.98] ${
                          isActive && !isCollapsed
                            ? "bg-gradient-to-r from-purple-950/60 via-purple-900/30 to-purple-950/40 border border-[#3B82F6]/40 text-white shadow-[0_4px_20px_rgba(59,130,246,0.2)] font-bold"
                            : "text-neutral-300 hover:text-white hover:bg-neutral-900/60 border border-transparent"
                        }`}
                        title={isCollapsed ? item.label : undefined}
                      >
                        <div className="flex items-center gap-3">
                          {/* iOS-Style Squircle Icon Pill (Identical to ImageEditorMiniSidebar) */}
                          <div
                            className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 shadow-sm ${
                              isActive
                                ? "bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-[#3B82F6]/60  scale-105"
                                : "bg-neutral-900/80 border border-neutral-800/80 group-hover:bg-[#3B82F6]/15 group-hover:border-[#3B82F6]/30"
                            }`}
                          >
                            <Icon
                              strokeWidth={isActive ? 2.5 : 2}
                              className={`w-5 h-5 transition-colors duration-300 ${
                                isActive
                                  ? "text-[#60A5FA]"
                                  : "text-neutral-400 group-hover:text-[#93C5FD]"
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
                                ? "bg-[#3B82F6]/20 text-[#60A5FA] border-[#3B82F6]/30"
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

        {/* Bottom Action Footer - Return to Storyboard */}
        <div className="p-3.5 border-t border-neutral-800/60 bg-neutral-950/90 flex justify-center w-full shrink-0">
          <button
            onClick={handleReturnToWorkspace}
            className={`flex items-center justify-center rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-500 text-white transition-all active:scale-95 border border-[#60A5FA]/30 cursor-pointer  hover: ${
              isCollapsed
                ? "w-11 h-11 p-0"
                : "w-full py-3.5 px-4 gap-2.5 text-xs font-mono font-bold tracking-wide"
            }`}
            title="Return to Storyboard"
          >
            <ArrowLeft className="w-4 h-4 shrink-0 text-white stroke-[2.5]" />
            {!isCollapsed && (
              <span className="text-xs font-mono font-bold tracking-wide">
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
