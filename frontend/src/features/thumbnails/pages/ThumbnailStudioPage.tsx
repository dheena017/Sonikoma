import React, { useState, useRef } from "react";
import {
  Image,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Lightbulb,
  Layers,
  LayoutGrid,
  Film,
  Loader2,
  CheckCircle2,
} from "lucide-react";

import { GeneratedPanel } from "@/types";

import ThumbnailGenerator from "@/features/thumbnails/components/ThumbnailGenerator";
import ThumbnailLayoutForm from "@/features/thumbnails/components/ThumbnailLayoutForm";
import ThumbnailCompositionGuide from "@/features/thumbnails/components/ThumbnailCompositionGuide";

interface ThumbnailStudioPageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  scrapedGenre?: string;
}

const ThumbnailStudioPage = React.memo(
  ({
    panels,
    onNavigateHome,
    addNotification,
    scrapedTitle,
    scrapedGenre,
  }: ThumbnailStudioPageProps) => {
    const [selectedIdx, setSelectedIdx] = useState(0);
    const [activeTab, setActiveTab] = useState<"ai" | "concept" | "layout" | "guide">("ai");
    const [conceptPrompt, setConceptPrompt] = useState("");
    const [recipes, setRecipes] = useState<any[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);

    const filmstripRef = useRef<HTMLDivElement>(null);

    const title = scrapedTitle || "Overpowered S-Rank Recap";
    const genre = scrapedGenre || "Fantasy Action";

    const scrollFilmstrip = (direction: "left" | "right") => {
      if (filmstripRef.current) {
        filmstripRef.current.scrollBy({
          left: direction === "left" ? -240 : 240,
          behavior: "smooth",
        });
      }
    };

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
            title,
            genre,
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

        // The skill returns a structured ThumbnailCompositionRecipeModel
        const recipe = data.data || data;
        setRecipes((prev) => [{ ...recipe, _ts: Date.now() }, ...prev].slice(0, 4));
        addNotification?.("Thumbnail composition recipe generated!", "success");
      } catch (e) {
        addNotification?.("Failed to generate thumbnail recipe.", "error");
      } finally {
        setIsGenerating(false);
      }
    };

    const tools = [
      {
        id: "ai" as const,
        label: "AI Auto Composer",
        description: "Generate from storyboard panels",
        icon: Sparkles,
        color: "text-purple-300",
      },
      {
        id: "concept" as const,
        label: "Concept Designer",
        description: "Draft clickbait thumbnail ideas",
        icon: Lightbulb,
        color: "text-amber-300",
      },
      {
        id: "layout" as const,
        label: "Layer Instructions",
        description: "Graphic artist layering guide",
        icon: Layers,
        color: "text-cyan-300",
      },
      {
        id: "guide" as const,
        label: "Canvas & Splits",
        description: "Composition and split rules",
        icon: LayoutGrid,
        color: "text-emerald-300",
      },
    ];

    const activeToolMeta = tools.find((t) => t.id === activeTab) ?? tools[0];
    const activePanel = panels.length > 0 ? panels[selectedIdx] : null;

    return (
      <div className="flex-1 w-full space-y-5 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">

        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <Image className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  VISUAL STUDIO • MARKETING
                </span>
                <span className="text-xs text-neutral-400 font-mono">
                  • {recipes.length} recipe{recipes.length !== 1 ? "s" : ""} generated
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Thumbnail Studio
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                Generate clickbait concepts, AI layout overlays, focal asset extraction, and thumbnail variations.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
              <span>Series: {title}</span>
            </div>
          </div>
        </div>

        {/* HORIZONTAL PANEL FILMSTRIP — only shown if panels exist */}
        {panels.length > 0 && (
          <div className="relative flex items-center bg-[#0d0b16] border border-[#1f1b2e] rounded-2xl p-2.5">
            <button
              onClick={() => scrollFilmstrip("left")}
              className="p-2 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer mr-2 shadow-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              ref={filmstripRef}
              className="flex gap-3 overflow-x-auto py-1 scrollbar-none flex-1 scroll-smooth"
            >
              {panels.map((panel, idx) => (
                <button
                  key={panel.id}
                  onClick={() => setSelectedIdx(idx)}
                  className={`w-20 shrink-0 h-16 rounded-xl overflow-hidden border transition-all cursor-pointer relative flex items-center justify-center bg-[#06050a] ${
                    selectedIdx === idx
                      ? "border-2 border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.35)] scale-105 bg-[#1a0f18]"
                      : "border-[#1e1930] opacity-50 hover:opacity-100 hover:border-pink-500/40"
                  }`}
                >
                  {panel.image_url ? (
                    <img src={panel.image_url} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Film className="w-5 h-5 text-neutral-600" />
                  )}
                  <div className="absolute bottom-1 right-1 bg-black/85 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-neutral-300 border border-neutral-800">
                    #{panel.id}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => scrollFilmstrip("right")}
              className="p-2 text-neutral-400 hover:text-white bg-[#151224] border border-[#25203b] hover:border-purple-500/50 rounded-xl transition-all shrink-0 cursor-pointer ml-2 shadow-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* THREE-COLUMN STUDIO WORKSPACE */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">

          {/* LEFT COLUMN: Selected Panel Preview + Context */}
          <div className="lg:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 space-y-4 shadow-xl">

            {/* Panel image preview */}
            <div className="relative h-52 sm:h-60 rounded-xl overflow-hidden border border-[#221d33] bg-[#06050a] flex items-center justify-center p-2">
              {activePanel?.image_url ? (
                <img
                  src={activePanel.image_url}
                  alt={`Panel #${activePanel.id}`}
                  className="max-h-full max-w-full object-contain rounded"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-neutral-600">
                  <Image className="w-10 h-10 opacity-30" />
                  <span className="text-[10px] font-mono">
                    {panels.length === 0 ? "No panels loaded" : "No image rendered"}
                  </span>
                </div>
              )}
              {activePanel && (
                <div className="absolute top-2 left-2 bg-black/80 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold text-pink-300 border border-pink-500/20">
                  PANEL #{activePanel.id}
                </div>
              )}
            </div>

            {/* Visual description */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                VISUAL DESCRIPTION
              </span>
              <div className="w-full bg-[#07060c] border border-[#1e1a2e] text-xs rounded-xl p-3 text-neutral-200 font-sans leading-relaxed min-h-[56px]">
                {activePanel?.visual_description ? (
                  <p>{activePanel.visual_description}</p>
                ) : (
                  <p className="text-neutral-500 italic">
                    {panels.length === 0
                      ? "Import panels to start composing thumbnails."
                      : "(No visual description for this panel)"}
                  </p>
                )}
              </div>
            </div>

            {/* Dialogue / mood */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                PANEL DIALOGUE
              </span>
              <div className="w-full bg-[#07060c] border border-[#1e1a2e] text-xs rounded-xl p-3 text-neutral-200 font-sans leading-relaxed min-h-[56px]">
                {activePanel?.speech_text ? (
                  <p className="italic text-neutral-300">"{activePanel.speech_text}"</p>
                ) : (
                  <p className="text-neutral-500 italic">(Silent panel — no dialogue)</p>
                )}
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#07060c] border border-[#1e1a2e] rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Panels</p>
                <p className="text-sm font-black text-white mt-0.5">{panels.length}</p>
              </div>
              <div className="bg-[#07060c] border border-[#1e1a2e] rounded-xl p-2.5 text-center">
                <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Recipes</p>
                <p className="text-sm font-black text-pink-300 mt-0.5">{recipes.length}</p>
              </div>
            </div>

            {/* Generated recipes mini-list */}
            {recipes.length > 0 && (
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block font-bold">
                  COMPOSITION BRIEFS
                </span>
                <div className="space-y-1.5">
                  {recipes.map((r, idx) => (
                    <div
                      key={r._ts || idx}
                      className="flex items-center gap-2 bg-[#07060c] border border-[#1e1a2e] rounded-xl px-3 py-2"
                    >
                      <div
                        className="w-4 h-4 rounded-md border border-white/10 shrink-0"
                        style={{ backgroundColor: r.text_color || "#a855f7" }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-bold text-white truncate">{r.overlay_text || "Untitled"}</p>
                        <p className="text-[9px] font-mono text-neutral-500 truncate">{r.layout_archetype || ""}</p>
                      </div>
                      <span className="text-[8px] font-mono text-neutral-600 shrink-0">#{idx + 1}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT SECTION: Tool Menu + Workflow */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-5">

            {/* CENTER COLUMN: Vertical Tool Menu */}
            <div className="md:col-span-4 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 shadow-xl">
              <div className="mb-3 px-1">
                <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                  STUDIO TOOLS
                </p>
                <h3 className="mt-0.5 text-sm font-bold text-white">Design thumbnail</h3>
              </div>
              <div className="space-y-2">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => setActiveTab(tool.id)}
                      className={`w-full rounded-xl border px-3 py-3 text-left transition-all cursor-pointer ${
                        isActive
                          ? "border-2 border-purple-500/80 bg-purple-500/15 text-white shadow-[0_0_12px_rgba(168,85,247,0.25)]"
                          : "border-[#1c182b] bg-[#07060c] text-neutral-400 hover:border-neutral-700 hover:text-white"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${isActive ? tool.color : "text-neutral-500"}`} />
                        <span className="text-xs font-bold">{tool.label}</span>
                      </div>
                      <p className="mt-1 text-[10px] leading-relaxed text-neutral-400 font-mono">
                        {tool.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* RIGHT COLUMN: Active Workflow Canvas */}
            <div className="md:col-span-8 rounded-2xl border border-[#1f1b2e] bg-[#0c0a15] p-4 shadow-xl flex flex-col min-h-[460px]">

              {/* Workflow header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1b172b] pb-3 mb-4">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-neutral-400 font-bold">
                    ACTIVE WORKFLOW
                  </p>
                  <h4 className="text-sm font-bold text-white mt-0.5">{activeToolMeta.label}</h4>
                  <p className="mt-0.5 text-xs text-neutral-400">{activeToolMeta.description}</p>
                </div>
                {activeTab === "ai" && (
                  <button
                    onClick={handleGenerateVariation}
                    disabled={isGenerating || panels.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 active:scale-95 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 shadow-lg shadow-purple-950/40 cursor-pointer border border-purple-400/30"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {isGenerating ? "Composing..." : "✦ Generate"}
                  </button>
                )}
              </div>

              {/* AI Auto Composer Tab */}
              <div className={activeTab === "ai" ? "block flex-1" : "hidden"}>
                {recipes.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 gap-4 text-center">
                    <div className="p-5 bg-[#0f0d1a] border border-[#1f1b2e] rounded-2xl">
                      <Sparkles className="w-10 h-10 text-purple-400/50 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-neutral-300">
                        AI Thumbnail Composer
                      </p>
                      <p className="text-xs text-neutral-500 font-mono mt-1 max-w-xs">
                        Analyzes storyboard panels to generate a full composition recipe —
                        focal assets, layout archetype, overlay text, and background style.
                      </p>
                    </div>
                    {panels.length > 0 && (
                      <p className="text-[10px] text-neutral-500 font-mono">
                        {panels.length} panels ready → click <strong className="text-purple-300">✦ Generate</strong> above
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3 overflow-y-auto">
                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-mono">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{recipes.length} composition recipe{recipes.length !== 1 ? "s" : ""} generated</span>
                    </div>
                    {recipes.map((recipe, idx) => (
                      <div
                        key={recipe._ts || idx}
                        className="bg-[#0d0b18] border border-[#1f1b2e] rounded-2xl p-4 space-y-3"
                      >
                        {/* Recipe header */}
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-bold">
                            COMPOSITION BRIEF #{idx + 1}
                          </span>
                          <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                            {recipe.layout_archetype?.replace(/_/g, " ").toUpperCase() || "LAYOUT"}
                          </span>
                        </div>

                        {/* Overlay text */}
                        <div className="flex items-center gap-3">
                          <div
                            className="w-5 h-5 rounded border border-white/10 shrink-0"
                            style={{ backgroundColor: recipe.text_color || "#ffffff" }}
                          />
                          <p className="text-base font-black text-white">{recipe.overlay_text || "—"}</p>
                        </div>

                        {/* Meta grid */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-[#07060c] border border-[#1a1728] rounded-xl p-2.5">
                            <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">Background</p>
                            <p className="text-xs font-bold text-neutral-200 mt-0.5">
                              {recipe.background_type?.replace(/_/g, " ") || "—"}
                            </p>
                          </div>
                          <div className="bg-[#07060c] border border-[#1a1728] rounded-xl p-2.5">
                            <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest">BG Panel</p>
                            <p className="text-xs font-bold text-neutral-200 mt-0.5">
                              {recipe.background_panel_index != null ? `#${recipe.background_panel_index + 1}` : "—"}
                            </p>
                          </div>
                        </div>

                        {/* Focal assets */}
                        {recipe.focal_assets?.length > 0 && (
                          <div className="space-y-1.5">
                            <p className="text-[9px] font-mono text-neutral-400 uppercase tracking-widest font-bold">FOCAL ASSETS</p>
                            {recipe.focal_assets.map((asset: any, ai: number) => (
                              <div key={ai} className="flex items-center gap-2 text-xs">
                                <span className="w-5 h-5 rounded-md bg-[#1a1728] border border-[#25203b] flex items-center justify-center text-[9px] font-mono text-purple-300 shrink-0">
                                  P{(asset.panel_index ?? ai) + 1}
                                </span>
                                <span className="text-neutral-300 truncate">{asset.description || asset.character_name || "Asset"}</span>
                                {asset.style_effect && (
                                  <span className="text-[9px] font-mono text-neutral-500 shrink-0">[{asset.style_effect}]</span>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Concept Designer Tab */}
              <div className={activeTab === "concept" ? "block flex-1 overflow-y-auto" : "hidden"}>
                <ThumbnailGenerator
                  title={title}
                  genre={genre}
                  onGeneratedConcept={(c) => {
                    setConceptPrompt(c);
                    if (addNotification)
                      addNotification("Thumbnail clickbait concept generated!", "success");
                  }}
                />
              </div>

              {/* Layout Instructions Tab */}
              <div className={activeTab === "layout" ? "block flex-1 overflow-y-auto" : "hidden"}>
                <ThumbnailLayoutForm conceptPrompt={conceptPrompt} />
              </div>

              {/* Canvas Splits Tab */}
              <div className={activeTab === "guide" ? "block flex-1 overflow-y-auto" : "hidden"}>
                <ThumbnailCompositionGuide conceptPrompt={conceptPrompt} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

export default ThumbnailStudioPage;
