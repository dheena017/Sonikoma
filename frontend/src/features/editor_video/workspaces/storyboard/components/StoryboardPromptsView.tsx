import React from "react";
import {
  Sparkles,
  Wand2,
  Image as ImageIcon,
  Copy,
  Check,
  RefreshCw,
  Palette,
  Eye,
} from "lucide-react";
import { getProxiedImageUrl } from "@/utils";
import { GeneratedPanel } from "@/types";

interface StoryboardPromptsViewProps {
  panels: GeneratedPanel[];
  selectedIndices: number[];
  onSelect: (index: number, e: React.MouseEvent) => void;
  onUpdatePrompt: (index: number, prompt: string) => void;
  onTriggerFeedback?: (msg: string) => void;
}

const STYLE_TAGS = ["Manhwa Anime", "Dark Fantasy", "Cyberpunk", "Cinematic Shonen", "Watercolor"];

export const StoryboardPromptsView: React.FC<StoryboardPromptsViewProps> = ({
  panels,
  selectedIndices,
  onSelect,
  onUpdatePrompt,
  onTriggerFeedback,
}) => {
  const [copiedIdx, setCopiedIdx] = React.useState<number | null>(null);

  const handleCopyPrompt = (index: number, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedIdx(index);
      setTimeout(() => setCopiedIdx(null), 1500);
      onTriggerFeedback?.(`Copied prompt for Panel #${index + 1}`);
    }
  };

  return (
    <div className="space-y-3 pt-1 pb-4">
      {/* Banner */}
      <div className="p-2.5 rounded-xl bg-neutral-900 border border-[#3B82F6]/30 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-200">
          <Palette className="h-3.5 w-3.5 text-[#60A5FA] shrink-0" />
          <span>Visual Prompts — Edit AI image generation prompts & descriptions</span>
        </div>
        <button
          type="button"
          onClick={() => onTriggerFeedback?.("AI Enhanced all visual prompts")}
          className="px-2 py-0.5 rounded-md bg-[#3B82F6] hover:bg-[#2563EB] text-white text-[9px] font-mono font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-sm transition"
        >
          <Sparkles className="h-2.5 w-2.5" />
          <span>Enhance All</span>
        </button>
      </div>

      {panels.map((panel, index) => {
        const isSelected = selectedIndices.includes(index);
        const imgUrl = panel.image_url || (panel as any).imageUrl || "";
        const displayUrl = getProxiedImageUrl(imgUrl);
        const promptText = panel.prompt || panel.visual_description || `High quality webtoon panel, cinematic anime scene, dramatic lighting, 8k resolution, masterpiece`;
        const visualDesc = panel.visual_description;
        const isCopied = copiedIdx === index;

        return (
          <div
            key={`prompt-row-${panel.id || index}`}
            onClick={(e) => onSelect(index, e)}
            className={`p-3 rounded-2xl border transition-all flex flex-col gap-2.5 cursor-pointer ${
              isSelected
                ? "border-[#3B82F6]/30 bg-neutral-900 ring-2 ring-[#3B82F6]/50 shadow-md"
                : "border-white/10 bg-[#121212] hover:border-[#3B82F6]/30"
            }`}
          >
            {/* Top row: Thumbnail + Prompt title */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-black/60 shrink-0 border border-white/10">
                  <img src={displayUrl} alt="" className="w-full h-full object-cover" />
                  <span className="absolute bottom-0 right-0 text-[7px] font-black font-mono bg-black/80 text-neutral-200 px-0.5 rounded">
                    #{index + 1}
                  </span>
                </div>

                <div className="min-w-0">
                  <span className="text-[10px] font-bold font-mono text-[#60A5FA]">
                    Panel #{index + 1} Prompt
                  </span>
                  <p className="text-[8px] font-mono text-neutral-400 truncate">
                    {visualDesc ? visualDesc : "AI Visual Description"}
                  </p>
                </div>
              </div>

              {/* Action Tools */}
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={(e) => handleCopyPrompt(index, promptText, e)}
                  className="p-1 px-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-[8px] font-mono flex items-center gap-1 transition-all"
                  title="Copy Prompt to Clipboard"
                >
                  {isCopied ? (
                    <Check className="h-2.5 w-2.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-2.5 w-2.5" />
                  )}
                  <span>{isCopied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const enhanced = `${promptText}, volumetric lighting, ultra-detailed manga linework, dynamic angle`;
                    onUpdatePrompt(index, enhanced);
                    onTriggerFeedback?.(`Enhanced prompt for Panel #${index + 1}`);
                  }}
                  className="p-1 px-1.5 rounded-lg bg-[#3B82F6]/20 hover:bg-[#3B82F6]/40 border border-[#3B82F6]/30 text-neutral-200 text-[8px] font-mono flex items-center gap-1 transition-all"
                  title="AI Enhance Prompt"
                >
                  <Wand2 className="h-2.5 w-2.5" />
                  <span>Enhance</span>
                </button>
              </div>
            </div>

            {/* Prompt Textarea */}
            <textarea
              value={promptText}
              placeholder="Enter visual generation prompt or description..."
              onClick={(e) => e.stopPropagation()}
              onChange={(e) => onUpdatePrompt(index, e.target.value)}
              className="w-full h-18 p-2 rounded-xl bg-black/50 border border-white/10 text-white placeholder-neutral-500 text-[10px] font-mono resize-none focus:outline-none focus:border-[#3B82F6]/30 transition-colors leading-relaxed"
            />

            {/* Style Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto mini-sidebar-scrollbar">
              <span className="text-[8px] font-mono text-neutral-500 shrink-0">Style:</span>
              {STYLE_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onUpdatePrompt(index, `${promptText}, ${tag} style`);
                    onTriggerFeedback?.(`Added ${tag} style to Panel #${index + 1}`);
                  }}
                  className="px-2 py-0.5 rounded-lg bg-black/40 hover:bg-neutral-900 border border-white/5 hover:border-[#3B82F6]/30 text-[8px] font-mono text-neutral-400 hover:text-neutral-200 whitespace-nowrap transition-all"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StoryboardPromptsView;
