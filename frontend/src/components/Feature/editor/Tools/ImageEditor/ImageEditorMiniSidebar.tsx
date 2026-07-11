import React, { useState } from "react";
import { useImageEditorStore, ImageTool } from "@/hooks/useImageEditorState";
import {
  Sparkles,
  Settings2,
  Eraser,
  Scissors,
  Crop,
  Layers,
  Brush,
  Link2,
  ArrowLeft
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
        { id: "eraser", label: "Erase", icon: Eraser },
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
      ],
    },
  ];

  const SidebarItem: React.FC<{ item: { id: ImageTool; label: string; icon: React.ElementType } }> = ({ item }) => {
    const [hover, setHover] = useState(false);
    const [rect, setRect] = useState<DOMRect | null>(null);

    const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      setRect(r);
      setHover(true);
    };
    const handleLeave = () => setHover(false);

    const Icon = item.icon;
    const active = activeTool === item.id;

    return (
      <div className="relative group w-full flex justify-center py-0.5">
        {/* Premium Floating Active Pill */}
        <div
          className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-300 z-10 ${
            active
              ? "h-5 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.8)] opacity-100"
              : "h-0 bg-transparent opacity-0"
          }`}
        />

        <button
          onClick={() => setActiveTool(item.id)}
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          title={item.label}
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

  const [returnHover, setReturnHover] = useState(false);
  const [returnRect, setReturnRect] = useState<DOMRect | null>(null);

  const handleReturnToWorkspace = () => {
    window.dispatchEvent(new CustomEvent('SWITCH_TAB', { detail: 'assets' }));
  };

  return (
    <aside className="fixed top-0 bottom-0 left-0 w-20 shrink-0 bg-neutral-950 backdrop-blur-xl border-r border-neutral-800/60 shadow-[4px_0_24px_rgba(0,0,0,0.3)] hidden lg:flex flex-col items-center py-4 z-40">
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

      <div className="mt-auto pt-4 flex justify-center w-full pb-2 border-t border-neutral-800/60">
        <div className="relative group w-full flex justify-center">
          <button
            onClick={handleReturnToWorkspace}
            onMouseEnter={(e) => {
              setReturnRect(e.currentTarget.getBoundingClientRect());
              setReturnHover(true);
            }}
            onMouseLeave={() => setReturnHover(false)}
            className="p-3 rounded-2xl bg-gradient-to-b from-purple-500 to-purple-700 hover:from-purple-400 hover:to-purple-600 text-white shadow-[0_4px_14px_rgba(168,85,247,0.4)] hover:shadow-[0_6px_20px_rgba(168,85,247,0.6)] active:scale-90 transition-all border border-purple-400/30 cursor-pointer flex items-center justify-center outline-none focus:outline-none"
          >
            <ArrowLeft className="w-[18px] h-[18px] shrink-0" strokeWidth={2.5} />
          </button>
          <TooltipPortal
            text="Return to Workspace"
            visible={returnHover}
            anchorRect={returnRect}
          />
        </div>
      </div>
    </aside>
  );
};
