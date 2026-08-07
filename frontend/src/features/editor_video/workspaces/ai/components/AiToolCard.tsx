import React from "react";
import {
  BookOpen, Grid, Film, FileSearch, Scan, Paintbrush, Maximize, Mic,
  Move, Languages, Crop, Eraser, Sliders, Wand2
} from "lucide-react";
import { AiEngineTool } from "../../../types/workspace.types";

const ICON_MAP: Record<string, React.ElementType> = {
  BookOpen, Grid, Film, FileSearch, Scan, Paintbrush, Maximize, Mic,
  Move, Languages, Crop, Eraser, Sliders, Wand2
};

interface AiToolCardProps {
  tool: AiEngineTool;
  onRun: (title: string) => void;
}

export const AiToolCard: React.FC<AiToolCardProps> = ({ tool, onRun }) => {
  const Icon = ICON_MAP[tool.iconName] || Wand2;

  return (
    <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-purple-500/60 cursor-pointer transition-all group flex items-start gap-3 shadow-sm">
      <div className="h-8 w-8 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center shrink-0 group-hover:bg-purple-600/40 transition-colors">
        <Icon className="h-4 w-4 text-purple-400" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <p className="text-xs font-bold text-white group-hover:text-purple-300 truncate">{tool.title}</p>
          <span className="text-[8px] font-mono font-bold bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 shrink-0">
            {tool.badge}
          </span>
        </div>
        <p className="text-[10px] text-neutral-400 leading-tight">{tool.desc}</p>
      </div>
      <button
        onClick={() => onRun(tool.title)}
        className="px-2 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-[9px] font-mono font-bold transition-colors shrink-0 cursor-pointer"
      >
        Run
      </button>
    </div>
  );
};
