import React, { useState } from "react";
import { Sparkles, Image, RefreshCw, Lightbulb, Layers, LayoutGrid, CheckCircle2 } from "lucide-react";
import { GeneratedPanel } from "@/types";
import ThumbnailGenerator from "@/features/thumbnails/components/ThumbnailGenerator";
import ThumbnailLayoutForm from "@/features/thumbnails/components/ThumbnailLayoutForm";
import ThumbnailCompositionGuide from "@/features/thumbnails/components/ThumbnailCompositionGuide";

interface ThumbnailStudioTabProps {
  title: string;
  genre: string;
  storyboardSummary: string;
  videoUrl?: string | null;
  panels?: GeneratedPanel[];
  addNotification?: (msg: string, type: any) => void;
}

export default function ThumbnailStudioTab({
  title,
  genre,
  storyboardSummary,
  videoUrl,
  panels = [],
  addNotification,
}: ThumbnailStudioTabProps) {
  const [activeSubTab, setActiveSubTab] = useState<"ai" | "concept" | "layout" | "guide">("ai");
  const [recipes, setRecipes] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [conceptPrompt, setConceptPrompt] = useState("");

  const handleGenerateVariation = async () => {
    if (panels.length === 0) {
      addNotification?.("No storyboard panels found to analyze.", "error");
      return;
    }
    setIsGenerating(true);
    try {
      const res = await fetch("/api/skills/generate-thumbnail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Solo Leveling Recap",
          genre: genre || "Action",
          panels: panels.map((p) => ({
            visual_description: p.visual_description,
            image_url: p.image_url,
          })),
          model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
        }),
      });
      const data = await res.json();

      if (!data.success) {
        addNotification?.(data.error || "Thumbnail generation failed.", "error");
        return;
      }

      const recipe = data.data || data;
      setRecipes((prev) => [{ ...recipe, _ts: Date.now() }, ...prev].slice(0, 4));
      addNotification?.("Thumbnail composition recipe generated!", "success");
    } catch (e) {
      addNotification?.("Failed to generate thumbnail recipe.", "error");
    } finally {
      setIsGenerating(false);
    }
  };

  const subTools = [
    { id: "ai" as const, label: "AI Auto Composer", icon: Sparkles },
    { id: "concept" as const, label: "Concept Designer", icon: Lightbulb },
    { id: "layout" as const, label: "Layer Instructions", icon: Layers },
    { id: "guide" as const, label: "Canvas & Splits", icon: LayoutGrid },
  ];

  return (
    <div className="space-y-4 w-full animate-fade-in">
      {/* COMPILER ACTION BANNER */}
      <div className="bg-[#0c0a15] p-4 rounded-2xl border border-[#1f1b2e] hover:border-purple-500/40 transition-all space-y-2 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-pink-500/10 border border-pink-500/30 rounded-lg text-pink-400 shrink-0">
              <Image className="w-4 h-4" />
            </span>
            <h4 className="text-xs font-mono font-bold text-white uppercase">
              Thumbnail Composition & CTR Studio
            </h4>
          </div>

          <button
            onClick={handleGenerateVariation}
            disabled={isGenerating}
            className="px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-pink-950/50 hover:shadow-pink-600/30 active:scale-95 shrink-0"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>{isGenerating ? "Composing..." : "✦ Generate Thumbnail Recipe"}</span>
          </button>
        </div>
        <p className="text-[10px] text-neutral-400 font-mono">
          Extract key focal assets, draft high-CTR text overlays, and generate 16:9 clickbait composition recipes.
        </p>
      </div>

      {/* SUB-TAB SELECTOR */}
      <div className="flex border-b border-[#1b172b] gap-2 font-mono overflow-x-auto pb-1">
        {subTools.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeSubTab === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => setActiveSubTab(tool.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isActive
                  ? "bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm"
                  : "bg-[#07060c] text-neutral-400 border-[#1e1a2e] hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* ACTIVE SUB-TAB WORKFLOW */}
      <div className="space-y-4 pt-1">
        {activeSubTab === "ai" && (
          <ThumbnailGenerator
            recipes={recipes}
            title={title}
            genre={genre}
            panels={panels}
            addNotification={addNotification}
          />
        )}

        {activeSubTab === "concept" && (
          <div className="bg-[#0c0a15] border border-[#1f1b2e] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#1b172b] pb-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400" /> Clickbait Concept Drafts
              </span>
              <span className="text-[10px] font-mono text-neutral-400">High CTR Text Hooks</span>
            </div>
            <textarea
              value={conceptPrompt}
              onChange={(e) => setConceptPrompt(e.target.value)}
              placeholder="e.g. HUGE RED ARROW pointing to hero's glowing purple eyes with text: 'HE UNLOCKED IT?!'"
              rows={4}
              className="w-full text-xs font-sans text-white bg-[#06050a] p-3 rounded-xl border border-[#1d182e] outline-none focus:border-pink-500/50 resize-y"
            />
            <div className="p-3 bg-[#06050a] border border-[#1d182e] rounded-xl text-[11px] text-neutral-300 space-y-1">
              <p className="font-bold text-pink-300">Recommended Thumbnail Overlay Formula:</p>
              <p className="text-neutral-400">1. Maximum 3 to 4 high-contrast words (yellow or white text with thick black stroke).</p>
              <p className="text-neutral-400">2. Exaggerated expression (shock, fury, or sinister smirk).</p>
              <p className="text-neutral-400">3. Dark background with vibrant neon focal glow (purple or cyan aura).</p>
            </div>
          </div>
        )}

        {activeSubTab === "layout" && (
          <ThumbnailLayoutForm addNotification={addNotification} />
        )}

        {activeSubTab === "guide" && (
          <ThumbnailCompositionGuide />
        )}
      </div>
    </div>
  );
}
