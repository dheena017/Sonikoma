// ─── AIKeyframeBar ───────────────────────────────────────────────────────────
// Canonical location: timeline/components/ai/AIKeyframeBar.tsx

import React from "react";
import { AISuggestion } from "../../types";
import { Sparkles, Check, X } from "lucide-react";

interface AIKeyframeBarProps {
  suggestions: AISuggestion[];
  onAccept: (suggestion: AISuggestion) => void;
  onDismiss: (id: string) => void;
}

const AIKeyframeBar: React.FC<AIKeyframeBarProps> = ({
  suggestions, onAccept, onDismiss,
}) => {
  if (suggestions.length === 0) return null;

  return (
    <div className="bg-purple-950/40 border-b border-purple-500/20 px-3 py-1 flex items-center justify-between text-[10px] select-none">
      <div className="flex items-center gap-1.5 text-purple-300 font-bold">
        <Sparkles className="h-3 w-3 animate-pulse text-purple-400" />
        <span>AI Auto-Keyframe Suggestions ({suggestions.length})</span>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto">
        {suggestions.map((s) => (
          <div key={s.id} className="flex items-center gap-1 bg-purple-900/60 border border-purple-500/40 px-2 py-0.5 rounded-full text-purple-100">
            <span>{s.label} ({s.property}) @ {s.time}s</span>
            <button
              onClick={() => onAccept(s)}
              title="Accept suggestion"
              className="p-0.5 rounded-full hover:bg-emerald-500/30 text-emerald-300 transition-colors"
            >
              <Check className="h-2.5 w-2.5" />
            </button>
            <button
              onClick={() => onDismiss(s.id)}
              title="Dismiss suggestion"
              className="p-0.5 rounded-full hover:bg-red-500/30 text-red-300 transition-colors"
            >
              <X className="h-2.5 w-2.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default React.memo(AIKeyframeBar);
