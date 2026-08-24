import React, { useState } from "react";
import {
  useImageEditorStore,
  ImageTool,
} from "@/features/editor_image/hooks/useImageEditorState";
import {
  Layers,
  Sparkles,
  Settings2,
  Scissors,
  Crop,
  Brush,
  Link2,
  Database,
} from "lucide-react";
import TooltipPortal from "@/shared/ui/common/TooltipPortal";

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

  const tools = [
    {
      id: "adjust",
      label: "Color & Filters",
      icon: Sparkles,
    },
    {
      id: "edit",
      label: "Transform & Bounds",
      icon: Settings2,
    },
    {
      id: "draw",
      label: "Retouch & Brush",
      icon: Brush,
    },
    {
      id: "slice",
      label: "Horizontal Cutter",
      icon: Scissors,
    },
    {
      id: "crop",
      label: "Panel Cuts Registry",
      icon: Crop,
      badge: slicesCount > 0 ? slicesCount : undefined,
    },
    {
      id: "merge",
      label: "Merge Panels",
      icon: Link2,
    },
    {
      id: "separate",
      label: "AI Layer Separation",
      icon: Layers,
    },
    {
      id: "train",
      label: "YOLO Fine-Tuner",
      icon: Database,
    },
  ];

  return (
    <div className="w-[80px] h-full flex flex-col items-center py-4 bg-[#0a0b10] border-r border-white/8 select-none shrink-0 z-30">
      {/* Tool Icons List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tools.map((item, idx) => {
          const active = activeTool === item.id;
          const Icon = item.icon;
          const isAiTool = item.id === "separate" || item.id === "train";

          return (
            <React.Fragment key={item.id}>
              {/* Subtle divider before AI tools */}
              {idx === 6 && (
                <div className="w-8 h-px bg-white/10 my-1.5 rounded-full" />
              )}

              <div className="relative group w-full flex justify-center py-0.5">
                {/* Floating Active Pill Ribbon on Left Edge */}
                <div
                  className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
                    active
                      ? "h-6 bg-gradient-to-b from-purple-400 to-indigo-400 shadow-[0_0_14px_rgba(168,85,247,0.9)] opacity-100"
                      : "h-0 bg-transparent opacity-0"
                  }`}
                />

                <button
                  onClick={() => {
                    setActiveTool(item.id as ImageTool);
                    onOpenToolsPanel?.();
                  }}
                  onMouseEnter={(e) => {
                    setHoveredRect(e.currentTarget.getBoundingClientRect());
                    setHoveredItem(item.id);
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                  className="p-0 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
                  title={item.label}
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
                          : isAiTool
                          ? "text-neutral-400 group-hover:text-purple-300"
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
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ImageEditorMiniSidebar;
