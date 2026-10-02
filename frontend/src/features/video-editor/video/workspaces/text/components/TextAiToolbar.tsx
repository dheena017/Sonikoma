import React from "react";
import { Wand2, RefreshCw, Languages, Palette } from "lucide-react";

interface TextAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const TextAiToolbar: React.FC<TextAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3 py-2 bg-neutral-900/90 border-b border-[#2F2F2F] flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-[#3B82F6] flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-[#3B82F6]" /> AI Text Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() =>
            onTriggerFeedback("AI rewriting text for punchier tone...")
          }
          className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#60A5FA]/40 shadow-xs shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <RefreshCw className="h-2.5 w-2.5" /> Rewrite
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI translating dialogue to English...")
          }
          className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#60A5FA]/40 shadow-xs shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Languages className="h-2.5 w-2.5" /> Translate
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI applying manga sound FX styling...")
          }
          className="px-2.5 py-1 rounded-lg bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-[#60A5FA]/40 shadow-xs shadow-blue-500/25 transition-all cursor-pointer whitespace-nowrap active:scale-95"
        >
          <Palette className="h-2.5 w-2.5" /> Stylize
        </button>
      </div>
    </div>
  );
};
