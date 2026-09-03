import React, { useState } from "react";
import {
  useImageEditorStore,
  ImageTool,
} from "@/features/editor_image/hooks/useImageEditorState";
import {
  Menu,
  Layers,
  Sparkles,
  Settings2,
  Scissors,
  Brush,
  Link2,
  Database,
  ArrowLeft,
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

interface ToolDef {
  id: string;
  label: string;
  icon: any;
  badge?: number | string;
}

export const ImageEditorMiniSidebar: React.FC<ImageEditorMiniSidebarProps> = ({
  onOpenToolsPanel,
  onToggleSidebar,
  navigateTo,
  projectId,
  seriesSlug,
  chapterSlug,
}) => {
  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);

  const handleReturn = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const targetUrl = resolveWorkspaceReturnPath({
      searchParams: window.location.search,
      projectId,
      seriesSlug,
      chapterSlug,
    });
    if (navigateTo) {
      navigateTo(targetUrl);
    } else {
      window.location.href = targetUrl;
    }
  };
  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);

  const groups = [
    {
      name: "Tools",
      items: [
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
          id: "merge",
          label: "Merge Panels",
          icon: Link2,
        },
      ],
    },
    {
      name: "AI Core",
      items: [
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
      ],
    },
  ];

  const ToolSidebarItem = ({ item }: { item: ToolDef }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = activeTool === item.id;
    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Left edge active indicator bar */}
        <div
          className={`absolute left-0.5 top-1/2 -translate-y-1/2 w-1 rounded-r-full transition-all duration-300 z-10 ${
            active
              ? "h-5 bg-[#3B82F6]  opacity-100"
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
          className="p-1 transition-all duration-200 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
          aria-label={item.label}
        >
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-sm ${
              active
                ? "bg-[#3B82F6] border border-[#60A5FA]/40 text-white scale-105"
                : "bg-[#1E1E1E] border border-[#2F2F2F] text-[#9CA3AF] group-hover:bg-[#2A2A2A] group-hover:border-[#3B82F6] group-hover:text-white"
            }`}
          >
            <Icon
              className={`w-[18px] h-[18px] transition-colors duration-200 ${
                active ? "text-white" : "text-[#9CA3AF] group-hover:text-[#3B82F6]"
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
    <div className="w-20 h-full flex flex-col items-center py-3 bg-[#0c0d12]/95 backdrop-blur-2xl border-r border-white/10 select-none shrink-0 z-30 overflow-hidden">
      {/* Tool Icons List */}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div
            key={group.name}
            className="w-full flex flex-col items-center pb-1"
          >
            {/* Section divider + label */}
            <div
              className="w-full flex flex-col items-center"
              style={{
                marginTop: groupIdx > 0 ? "0.6rem" : "0.2rem",
                marginBottom: "0.4rem",
              }}
            >
              {groupIdx > 0 && (
                <div className="w-6 h-[1px] bg-neutral-800/80 rounded-full mb-1.5" />
              )}
              <span className="text-[8.5px] font-mono font-black uppercase tracking-[0.2em] text-[#3B82F6] select-none text-center w-full px-1">
                {group.name}
              </span>
            </div>

            {group.items.map((item) => (
              <ToolSidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>

      {/* Bottom Return to Storyboard Button */}
      <div className="pt-3 w-full flex justify-center border-t border-white/10 shrink-0 pb-1">
        <button
          onClick={handleReturn}
          onMouseEnter={(e) => {
            setReturnRect(e.currentTarget.getBoundingClientRect());
            setReturnHover(true);
          }}
          onMouseLeave={() => setReturnHover(false)}
          aria-label="Return to Storyboard"
          className="w-11 h-11 rounded-2xl bg-gradient-to-b from-[#8B5CF6] to-[#6366F1] hover:from-[#7C3AED] hover:to-[#4F46E5] text-white shadow-[0_0_20px_rgba(139,92,246,0.6)] hover:shadow-[0_0_28px_rgba(139,92,246,0.8)] border border-[#A78BFA]/40 flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-5 h-5 text-white" />
        </button>
        <TooltipPortal
          text="Return to Storyboard"
          visible={returnHover}
          anchorRect={returnRect}
        />
      </div>
    </div>
  );
};

export default ImageEditorMiniSidebar;
