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
  Link2 
} from "lucide-react"; 
import TooltipPortal from "@/components/TooltipPortal"; // Adjust path if your TooltipPortal is located elsewhere

export const ImageEditorMiniSidebar: React.FC = () => {
  // 1. Connect to your global state
  const activeTool = useImageEditorStore((state) => state.activeTool);
  const setActiveTool = useImageEditorStore((state) => state.setActiveTool);
  const slicesCount = useImageEditorStore((state) => state.slicesCount);

  // 2. Setup Tooltip states
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [hoveredRect, setHoveredRect] = useState<DOMRect | null>(null);

  // 3. Define the tools array matching the ImageTool type
  const tools: { key: ImageTool; label: string; icon: React.ElementType }[] = [
    { key: "adjust", label: "Adjust", icon: Sparkles },
    { key: "edit", label: "Edit", icon: Settings2 },
    { key: "draw", label: "Draw", icon: Brush },
    { key: "eraser", label: "Erase", icon: Eraser },
    { key: "slice", label: "Cut", icon: Scissors },
    { key: "crop", label: "Crop", icon: Crop },
    { key: "merge", label: "Merge", icon: Link2 },
    { key: "separate", label: "Separate", icon: Layers },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center pt-4 space-y-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {tools.map((tool) => {
        const isActive = activeTool === tool.key;
        const Icon = tool.icon;
        const isHovered = hoveredTool === tool.key;
        
        return (
          <div key={tool.key} className="relative group w-full flex justify-center py-1">
            
            {/* Premium Floating Active Pill */}
            <div
              className={`absolute left-1.5 top-1/2 -translate-y-1/2 w-1 rounded-full transition-all duration-500 ease-out z-10 ${
                isActive
                  ? "h-6 bg-purple-400 shadow-[0_0_12px_rgba(192,132,252,0.9)] opacity-100"
                  : "h-0 bg-transparent opacity-0"
              }`}
            />

            <button
              onClick={() => setActiveTool(tool.key)}
              onMouseEnter={(e) => {
                setHoveredRect(e.currentTarget.getBoundingClientRect());
                setHoveredTool(tool.key);
              }}
              onMouseLeave={() => setHoveredTool(null)}
              className="p-1.5 transition-all duration-300 cursor-pointer relative flex items-center justify-center outline-none focus:outline-none"
            >
              {/* iOS-style icon pill container with inner shadow */}
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 group-active:scale-90 ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/50 shadow-[inset_0_0_12px_rgba(168,85,247,0.2),0_0_14px_rgba(168,85,247,0.3)]"
                    : "bg-neutral-800/80 border border-neutral-700/50 shadow-sm group-hover:bg-purple-500/10 group-hover:border-purple-500/30 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                }`}
              >
                <Icon
                  strokeWidth={isActive ? 2.5 : 2}
                  className={`w-[18px] h-[18px] transition-all duration-300 ${
                    isActive
                      ? "text-purple-300 drop-shadow-[0_0_8px_rgba(216,180,254,0.5)]"
                      : "text-neutral-400 group-hover:text-purple-300 group-hover:scale-110"
                  }`}
                />
              </div>

              {/* Dynamic Slices Count Badge (Only shows on Crop tool) */}
              {tool.key === "crop" && slicesCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] bg-gradient-to-br from-purple-500 to-purple-700 text-[10px] text-white font-black rounded-full flex items-center justify-center px-1 border border-neutral-950 shadow-md z-20">
                  {slicesCount}
                </span>
              )}
            </button>

            {/* Global Hover Tooltip */}
            <TooltipPortal text={tool.label} visible={isHovered} anchorRect={hoveredRect} />
          </div>
        );
      })}
    </div>
  );
};