import React, { useState } from "react";
import {
  useImageEditorStore,
  ImageTool,
} from "@/features/editor_image/hooks/useImageEditorState";
import {
  Menu,
  Film,
  Layout,
  Layers,
  Sparkles,
  Settings2,
  Scissors,
  Crop,
  Brush,
  Link2,
  Database,
  Settings,
  ExternalLink,
  Brain,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";
import { resolveWorkspaceReturnPath } from "@/shared/utils/workspaceNavigation";

interface ImageEditorMiniSidebarProps {
  onOpenToolsPanel?: () => void;
  onToggleSidebar?: () => void;
  navigateTo?: (path: string) => void;
  projectId?: string | null;
  seriesSlug?: string | null;
  chapterSlug?: string | null;
  scrapedCount?: number;
  panelsCount?: number;
}

export const ImageEditorMiniSidebar: React.FC<ImageEditorMiniSidebarProps> = ({
  onOpenToolsPanel,
  onToggleSidebar,
  navigateTo,
  projectId,
  seriesSlug,
  chapterSlug,
  scrapedCount = 0,
  panelsCount = 0,
}) => {
  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);

  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  const groups = [
    {
      name: "EDITING TOOLS",
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
        { id: "draw", label: "Retouch & Brush", icon: Brush, type: "tool" },
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
        { id: "merge", label: "Merge Panels", icon: Link2, type: "tool" },
      ],
    },
    {
      name: "AI INTELLIGENCE",
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
      name: "PREFERENCES",
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
    const target = resolveWorkspaceReturnPath({
      projectId:
        projectId ||
        new URLSearchParams(window.location.search).get("id") ||
        null,
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

  return (
    <div className="w-[80px] h-full flex flex-col items-center py-3 bg-[#0a0b10] border-r border-white/8 select-none shrink-0 z-30">
      {/* Navigation Scroll Area */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-4 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center space-y-1"
          >
            {/* Divider between sections */}
            {groupIdx > 0 && (
              <div className="w-8 h-[1px] bg-neutral-800/80 my-1 rounded-full" />
            )}

            {/* Section Header */}
            <span className="text-[9px] font-extrabold uppercase tracking-[0.2em] text-neutral-500 font-mono select-none text-center w-full truncate px-1 mb-1">
              {group.name}
            </span>

            {group.items.map((item) => {
              const active = item.type === "tool" && activeTool === item.id;
              const Icon = item.icon;

              return (
                <div
                  key={item.id}
                  className="relative group w-full flex justify-center py-0.5"
                >
                  {/* Floating Active Pill Ribbon on Left Edge */}
                  <div
                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
                      active
                        ? "h-6 bg-gradient-to-b from-purple-400 to-amber-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] opacity-100"
                        : "h-0 bg-transparent opacity-0"
                    }`}
                  />

                  <button
                    onClick={() => {
                      if (item.type === "tool") {
                        setActiveTool(item.id as ImageTool);
                        onOpenToolsPanel?.();
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
                    }}
                    onMouseEnter={(e) => {
                      setHoveredRect(e.currentTarget.getBoundingClientRect());
                      setHoveredItem(item.id);
                    }}
                    onMouseLeave={() => setHoveredItem(null)}
                    className="p-0 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
                  >
                    {/* iOS Squircle Icon Container */}
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
                        active
                          ? "bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-purple-500/60 shadow-[0_0_18px_rgba(168,85,247,0.35)] scale-105"
                          : "bg-neutral-900/80 border border-neutral-800/80 group-hover:bg-purple-500/15 group-hover:border-purple-500/30"
                      }`}
                    >
                      <Icon
                        strokeWidth={active ? 2.5 : 2}
                        className={`w-5 h-5 transition-colors duration-300 ${
                          active
                            ? "text-purple-300"
                            : "text-neutral-400 group-hover:text-purple-300"
                        }`}
                      />
                    </div>

                    {/* Circular Badge */}
                    {item.badge !== undefined && (
                      <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-purple-600 px-1 text-[9px] font-mono font-bold text-white ring-2 ring-neutral-950 shadow-md z-20">
                        {item.badge}
                      </span>
                    )}
                  </button>
                  <TooltipPortal
                    text={item.label}
                    visible={hoveredItem === item.id}
                    anchorRect={hoveredRect}
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Bottom Glowing Purple External Link Button */}
      <div className="pt-3 border-t border-neutral-800/60 w-full flex justify-center shrink-0">
        <button
          onClick={handleReturnToWorkspace}
          onMouseEnter={(e) => {
            setHoveredRect(e.currentTarget.getBoundingClientRect());
            setHoveredItem("return-workspace");
          }}
          onMouseLeave={() => setHoveredItem(null)}
          className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-600 to-purple-700 hover:from-purple-400 hover:to-indigo-500 text-white flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer shadow-[0_0_20px_rgba(168,85,247,0.5)] border border-purple-400/40"
        >
          <ExternalLink className="w-5 h-5 text-white" />
        </button>
        <TooltipPortal
          text="Return to Workspace"
          visible={hoveredItem === "return-workspace"}
          anchorRect={hoveredRect}
        />
      </div>
    </div>
  );
};

export default ImageEditorMiniSidebar;
