import React from "react";
import { Wand2, RefreshCw, Languages, Palette } from "lucide-react";

interface TextAiToolbarProps {
  onTriggerFeedback: (msg: string) => void;
}

export const TextAiToolbar: React.FC<TextAiToolbarProps> = ({
  onTriggerFeedback,
}) => {
  return (
    <div className="px-3 py-2 bg-purple-950/20 border-b border-purple-900/30 flex items-center justify-between gap-1 overflow-x-auto [scrollbar-width:none]">
      <span className="text-[9px] font-mono font-bold text-purple-400 flex items-center gap-1 shrink-0">
        <Wand2 className="h-3 w-3 text-purple-400" /> AI Text Tools:
      </span>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() =>
            onTriggerFeedback("AI rewriting text for punchier tone...")
          }
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <RefreshCw className="h-2.5 w-2.5" /> Rewrite
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI translating dialogue to English...")
          }
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Languages className="h-2.5 w-2.5" /> Translate
        </button>
        <button
          onClick={() =>
            onTriggerFeedback("AI applying manga sound FX styling...")
          }
          className="px-2 py-1 rounded bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white text-[9px] font-mono font-bold flex items-center gap-1 border border-purple-500/30 transition-all cursor-pointer whitespace-nowrap"
        >
          <Palette className="h-2.5 w-2.5" /> Stylize
        </button>
      </div>
    </div>
  );
};
