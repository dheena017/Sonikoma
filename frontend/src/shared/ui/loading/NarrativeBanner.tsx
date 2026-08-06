import React from "react";
import { Sparkles, Loader2 } from "lucide-react";

interface NarrativeBannerProps {
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
}

/**
 * Top banner displayed above the Storyboard Timeline while AI is generating
 * sequence narratives and synthesizing TTS voiceovers. Styled in clean dark glass.
 */
export function NarrativeBanner({
  onCancel,
  title = "Generating Narrative Sequence",
  subtitle = "AI is composing story narrative and synthesizing TTS voiceover for sequence cards...",
}: NarrativeBannerProps) {
  return (
    <div className="bg-neutral-950/80 border border-neutral-850 rounded-xl px-4 py-3 flex items-center justify-between gap-3 animate-in fade-in duration-200 shadow-xl backdrop-blur-md my-2">
      <div className="flex items-center gap-3">
        <div className="relative p-0.5 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-500 shadow-sm shrink-0">
          <div className="w-7 h-7 rounded-[7px] bg-neutral-950 flex items-center justify-center">
            <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin" />
          </div>
        </div>
        <div>
          <h4 className="text-xs font-bold text-white tracking-wide flex items-center gap-2">
            {title}
            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-purple-950 text-purple-300 border border-purple-800/50 font-medium uppercase tracking-wider">
              AI Active
            </span>
          </h4>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            {subtitle}
          </p>
        </div>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 px-3 py-1.5 rounded-lg transition-colors cursor-pointer shrink-0"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
