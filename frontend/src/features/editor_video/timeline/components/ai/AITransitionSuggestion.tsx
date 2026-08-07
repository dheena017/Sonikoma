// ─── AITransitionSuggestion ──────────────────────────────────────────────────
// Canonical location: timeline/components/ai/AITransitionSuggestion.tsx

import React from "react";
import { Wand2 } from "lucide-react";

interface AITransitionSuggestionProps {
  suggestion: string;
  onClick: () => void;
}

const AITransitionSuggestion: React.FC<AITransitionSuggestionProps> = ({
  suggestion, onClick,
}) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick();
    }}
    title={`AI suggests: ${suggestion}. Click to apply.`}
    className="w-4 h-4 rounded-full bg-purple-900/80 border border-purple-400/60 text-purple-300 hover:text-white hover:bg-purple-600 transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-sm"
  >
    <Wand2 className="h-2.5 w-2.5" />
  </button>
);

export default React.memo(AITransitionSuggestion);
