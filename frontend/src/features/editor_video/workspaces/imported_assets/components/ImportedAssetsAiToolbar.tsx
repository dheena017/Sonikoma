import React from "react";
import { Sparkles, Wand2, Scissors, Maximize2 } from "lucide-react";

interface ImportedAssetsAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const ImportedAssetsAiToolbar: React.FC<ImportedAssetsAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3.5 py-2 border-b border-purple-900/15 bg-black/40 flex items-center gap-1.5 overflow-x-auto mini-sidebar-scrollbar">
      <div className="flex items-center gap-1 text-[10px] text-purple-300/80 font-mono pr-2 shrink-0">
        <Sparkles className="h-3 w-3 text-purple-400" />
        <span>AI Tools:</span>
      </div>

      <button
        onClick={() => onTriggerFeedback("AI Remove Background started")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Scissors className="h-3 w-3 text-purple-400" />
        <span>Remove BG</span>
      </button>

      <button
        onClick={() => onTriggerFeedback("AI 4K Upscale queued")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Maximize2 className="h-3 w-3 text-purple-400" />
        <span>4K Upscale</span>
      </button>

      <button
        onClick={() => onTriggerFeedback("AI Variant Generator opened")}
        className="px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 text-[10px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
      >
        <Wand2 className="h-3 w-3 text-purple-400" />
        <span>Gen Variants</span>
      </button>
    </div>
  );
};

export default ImportedAssetsAiToolbar;
