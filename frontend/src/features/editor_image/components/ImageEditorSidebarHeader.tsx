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
        return {
          title: "Transform & Bounds",
          icon: Settings2,
          badge: "CANVAS",
        };
      case "draw":
        return { title: "Retouch & Brush", icon: Brush, badge: "INPAINT" };
      case "slice":
        return {
          title: "Horizontal Cutter",
          icon: Scissors,
          badge: "SPLITTER",
        };
      case "crop":
        return { title: "Panel Cuts Registry", icon: Crop, badge: "AUTO-CROP" };
      case "merge":
        return { title: "Merge Panels", icon: Link2, badge: "STITCH" };
      case "separate":
        return { title: "Layer Separation", icon: Layers, badge: "AI VISION" };
      case "train":
        return {
          title: "YOLO AI Fine-Tuner",
          icon: Database,
          badge: "NEURAL MODEL",
        };
      default:
        return {
          title: "Studio Controls",
          icon: SlidersHorizontal,
          badge: "ACTIVE",
        };
    }
  };

  const toolInfo = getToolTitle(activeTab);
  const ToolHeaderIcon = toolInfo.icon;

  return (
    <div className="h-16 flex items-center justify-between px-5 border-b border-[#2F2F2F] shrink-0 bg-[#141414]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#1E1E1E] border border-[#2F2F2F] flex items-center justify-center shadow-sm shrink-0">
          <ToolHeaderIcon className="w-5 h-5 text-[#3B82F6]" />
        </div>
        <div>
          <span className="font-bold text-[#E5E5E5] tracking-tight block leading-none text-sm font-sans">
            {toolInfo.title}
          </span>
          <span className="text-[9px] text-[#3B82F6] font-mono uppercase tracking-widest block mt-1 leading-none font-bold">
            {toolInfo.badge} MODE ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
};

export default ImageEditorSidebarHeader;
