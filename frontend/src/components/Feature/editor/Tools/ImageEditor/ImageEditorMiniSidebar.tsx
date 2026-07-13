import React, { useState } from "react";
import { useImageEditorStore, ImageTool } from "@/hooks/useImageEditorState";
import {
  Sparkles,
  Settings2,
  Scissors,
  Crop,
  Layers,
  Brush,
  Link2,
  Database
} from "lucide-react";
import TooltipPortal from "@/components/TooltipPortal";

export const ImageEditorMiniSidebar: React.FC = () => {
  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);

  // Grouping the tools to utilize the dot separator design from the Admin sidebar
  const groups: { name: string; items: { id: ImageTool; label: string; icon: React.ElementType }[] }[] = [
    {
      name: "Enhance",
      items: [
        { id: "adjust", label: "Adjust", icon: Sparkles },
        { id: "edit", label: "Edit", icon: Settings2 },
      ],
    },
    {
      name: "Retouch",
      items: [
        { id: "draw", label: "Draw", icon: Brush },
      ],
    },

    {
      name: "Layout",
      items: [
        { id: "slice", label: "Slice", icon: Scissors },
        { id: "crop", label: "Edit", icon: Crop },
        { id: "merge", label: "Merge", icon: Link2 },
      ],
    },
    {
      name: "AI",
      items: [
        { id: "separate", label: "Separate", icon: Layers },
        { id: "train", label: "Train YOLO", icon: Database },
      ],
    },
  ];


  const SidebarItem: React.FC<{ item: { id: ImageTool; label: string; icon: React.ElementType } }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);
    const active = activeTool === item.id;
    const Icon = item.icon;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Premium Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 ${
            active
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => setActiveTool(item.id)}
          onMouseEnter={(e) => {
            setRect(e.currentTarget.getBoundingClientRect());
            setHover(true);
          }}
          onMouseLeave={() => setHover(false)}
          className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center group-active:scale-95 outline-none focus:outline-none"
        >
          {/* iOS-style icon pill */}
          <div
            className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm ${
              active
                ? "bg-purple-500/20 border border-purple-500/40 shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                : "bg-neutral-800 border border-neutral-700 group-hover:bg-purple-500/10 group-hover:border-purple-500/20"
            }`}
          >
            <Icon
              strokeWidth={active ? 2.5 : 2}
              className={`w-[18px] h-[18px] transition-colors duration-300 ${
                active ? "text-purple-400" : "text-neutral-400 group-hover:text-purple-300"
              }`}
            />
          </div>

          {/* Dynamic Slices Count Badge (Only shows on the edit tool) */}
          {item.id === "crop" && slicesCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] text-white font-black rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-md z-20">
              {slicesCount}
            </span>
          )}
        </button>
        <TooltipPortal text={item.label} visible={hover} anchorRect={rect} />
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col items-center py-4 bg-neutral-950">
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden flex flex-col items-center space-y-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pt-2">
        {groups.map((group, groupIdx) => (
          <div key={group.name} className="w-full flex flex-col items-center pb-2">

            {/* Soft, premium gradient dot separator between groups */}
            {groupIdx > 0 && (
              <div className="w-1 h-1 rounded-full bg-purple-900/50 shadow-[0_0_4px_rgba(168,85,247,0.3)] my-2" />
            )}

            {group.items.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};
