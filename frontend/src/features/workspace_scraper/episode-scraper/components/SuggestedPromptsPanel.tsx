import React from "react";
import { Sparkles, Copy } from "lucide-react";

interface SuggestedPromptsPanelProps {
  prompts: string[];
  onCopyPrompt: (prompt: string) => void;
}

const SuggestedPromptsPanel: React.FC<SuggestedPromptsPanelProps> = ({ prompts, onCopyPrompt }) => {
  if (prompts.length === 0) return null;

  return (
    <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-3xl p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={15} className="text-purple-400" />
        <h3 className="text-sm font-semibold text-white">Suggested AI Prompts</h3>
      </div>
      <div className="space-y-2">
        {prompts.map((prompt, index) => (
          <button
            key={`${prompt}-${index}`}
            onClick={() => onCopyPrompt(prompt)}
            className="w-full text-left px-3 py-2 rounded-xl bg-neutral-950/60 border border-neutral-800 hover:border-purple-500/30 hover:bg-neutral-800/70 transition-all text-sm text-neutral-300"
          >
            <div className="flex items-start justify-between gap-2">
              <span>{prompt}</span>
              <Copy size={13} className="text-neutral-500 mt-0.5 shrink-0" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPromptsPanel;
