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

interface ToolDef {
  id: string;
  label: string;
  icon: any;
  badge?: number | string;
}

export const ImageEditorMiniSidebar: React.FC<ImageEditorMiniSidebarProps> = ({
  onOpenToolsPanel,
}) => {
  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);

  const tools: ToolDef[] = [
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

  const ToolSidebarItem = ({ item }: { item: ToolDef }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = activeTool === item.id;
    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Floating Active Pill Ribbon on Left Edge */}
        <div
          className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
            active
              ? "h-6 bg-[#3B82F6] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => {
            setActiveTool(item.id as ImageTool);
            onOpenToolsPanel?.();
          }}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-0 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
          aria-label={item.label}
        >
          {/* iOS Squircle Icon Container */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 shadow-sm scale-105"
                : "bg-[#1E1E1E] border border-[#2F2F2F] group-hover:bg-[#262626] group-hover:border-[#3B82F6]/60"
            }`}
          >
            <Icon
              strokeWidth={active ? 2.5 : 2}
              className={`w-5 h-5 transition-colors duration-200 ${
                active
                  ? "text-white"
                  : "text-[#9CA3AF] group-hover:text-white"
              }`}
            />
          </div>

          {/* Circular Badge */}
          {item.badge !== undefined && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[9px] font-mono font-bold text-white ring-2 ring-[#121212] shadow-md z-20">
              {item.badge}
            </span>
          )}
        </button>
        <TooltipPortal
          text={item.label}
          visible={hover}
          anchorRect={rect}
        />
      </div>
    );
  };

  return (
    <div className="w-[80px] h-full flex flex-col items-center py-4 bg-[#121212] border-r border-[#2F2F2F] select-none shrink-0 z-30">
      {/* Tool Icons List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {tools.map((item, idx) => (
          <React.Fragment key={item.id}>
            {/* Subtle divider before AI tools */}
            {idx === 6 && (
              <div className="w-8 h-px bg-[#2F2F2F] my-1.5 rounded-full" />
            )}
            <ToolSidebarItem item={item} />
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ImageEditorMiniSidebar;
