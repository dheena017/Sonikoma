import React from "react";
import {
  Sparkles,
  Settings2,
  Brush,
  Scissors,
  Crop,
  Link2,
  Layers,
  Database,
  SlidersHorizontal,
} from "lucide-react";
import { ImageTool } from "@/features/editor_image/hooks/useImageEditorState";

interface Props {
  activeTab: ImageTool;
}

export const ImageEditorSidebarHeader: React.FC<Props> = ({ activeTab }) => {
  const getToolTitle = (tool: ImageTool) => {
    switch (tool) {
      case "adjust":
        return { title: "Color & Filters", icon: Sparkles, badge: "ENHANCE" };
      case "edit":
        return { title: "Transform & Bounds", icon: Settings2, badge: "CANVAS" };
      case "draw":
        return { title: "Retouch & Brush", icon: Brush, badge: "INPAINT" };
      case "slice":
        return { title: "Horizontal Cutter", icon: Scissors, badge: "SPLITTER" };
      case "crop":
        return { title: "Panel Cuts Registry", icon: Crop, badge: "AUTO-CROP" };
      case "merge":
        return { title: "Merge Panels", icon: Link2, badge: "STITCH" };
      case "separate":
        return { title: "Layer Separation", icon: Layers, badge: "AI VISION" };
      case "train":
        return { title: "YOLO AI Fine-Tuner", icon: Database, badge: "NEURAL MODEL" };
      default:
        return { title: "Studio Controls", icon: SlidersHorizontal, badge: "ACTIVE" };
    }
  };

  const toolInfo = getToolTitle(activeTab);
  const ToolHeaderIcon = toolInfo.icon;

  return (
    <div className="h-16 flex items-center justify-between px-5 border-b border-neutral-800/60 shrink-0 bg-neutral-950/90">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-900/60 to-purple-950/80 border border-purple-500/50 flex items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.35)] shrink-0">
          <ToolHeaderIcon className="w-5 h-5 text-purple-300" />
        </div>
        <div>
          <span className="font-black text-neutral-100 tracking-tight block leading-none text-sm font-sans">
            {toolInfo.title}
          </span>
          <span className="text-[9px] text-purple-400 font-mono uppercase tracking-widest block mt-1 leading-none font-bold">
            {toolInfo.badge} MODE ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorSidebarHeader;
