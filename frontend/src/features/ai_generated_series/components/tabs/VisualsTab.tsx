import React, { useState } from "react";
import { Sparkles, Copy, Check, Loader2, RefreshCw } from "lucide-react";

export interface VisualsTabProps {
  prompt: string;
  setPrompt: (value: string) => void;
  selectedPanelIdx: number;
  totalPanels: number;
  isRegenerating: boolean;
  onRegenerateVisual: (prompt: string, model?: string) => Promise<void>;
  onSynthesizeChapterVisuals?: (model?: string) => Promise<void>;
  isSynthesizingVisuals?: boolean;
  addNotification?: (
    message: string,
    type: "success" | "error" | "info" | "warning"
  ) => void;
}

export const VisualsTab: React.FC<VisualsTabProps> = ({
  prompt,
  setPrompt,
  selectedPanelIdx,
  totalPanels,
  isRegenerating,
  onRegenerateVisual,
  onSynthesizeChapterVisuals,
  isSynthesizingVisuals,
  addNotification,
}) => {
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    addNotification?.("Prompt copied to clipboard!", "info");
  };

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Visual Prompt & Generation Card */}
      <div className="rounded-2xl bg-[#181818] border border-[#2A2A2A] transition-all shadow-md relative overflow-hidden flex flex-col">
        {/* Card Header (Static, No Dropdown) */}
        <div className="w-full px-4 py-3 bg-white/[0.02] flex items-center justify-between border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              Visual Prompt
            </span>
          </div>
          <button
            type="button"
            onClick={handleCopyPrompt}
            className="px-2.5 py-1 rounded-lg bg-[#141414] hover:bg-[#202020] border border-[#2A2A2A] hover:border-neutral-500 text-[11px] font-mono text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            {copiedPrompt ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400 font-semibold">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-neutral-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Card Body */}
        <div className="p-4 space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={6}
            className="w-full p-3.5 rounded-xl bg-[#141414] border border-[#2F2F2F] text-xs font-mono text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#3B82F6] transition-colors resize-y min-h-[130px] leading-relaxed"
            placeholder="2D Cel animation visual prompt..."
          />

          {/* Create / Synthesize Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button
              type="button"
              onClick={() => onRegenerateVisual(prompt)}
              disabled={isRegenerating || !prompt.trim()}
              className="w-full py-3 px-4 rounded-xl bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 disabled:cursor-not-allowed text-white font-mono font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20 active:scale-[0.99] border border-[#3B82F6]/50"
            >
              {isRegenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Synthesizing Shot #{selectedPanelIdx + 1}...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  <span>Create Shot #{selectedPanelIdx + 1}</span>
                </>
              )}
            </button>

            {onSynthesizeChapterVisuals && (
              <button
                type="button"
                onClick={() => onSynthesizeChapterVisuals()}
                disabled={isSynthesizingVisuals}
                className="w-full py-2.5 px-4 rounded-xl bg-[#141414] hover:bg-[#1E1E1E] border border-[#2F2F2F] hover:border-neutral-500 text-neutral-300 hover:text-white font-mono text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSynthesizingVisuals ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-neutral-400" />
                    <span>Batch Synthesizing All Shots...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
                    <span>Synthesize All {totalPanels} Shots (Batch)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualsTab;
