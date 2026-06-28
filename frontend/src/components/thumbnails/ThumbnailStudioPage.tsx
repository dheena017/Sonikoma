import React, { useState } from "react";
import { Image } from "lucide-react";
import { GeneratedPanel } from "../../types";

import ThumbnailGenerator from "./ThumbnailGenerator.js";
import ThumbnailLayoutForm from "./ThumbnailLayoutForm.js";
import ThumbnailCompositionGuide from "./ThumbnailCompositionGuide.js";

interface ThumbnailStudioPageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  scrapedGenre?: string;
}

export default function ThumbnailStudioPage({
  panels,
  onNavigateHome,
  addNotification,
  scrapedTitle,
  scrapedGenre,
}: ThumbnailStudioPageProps) {
  const [conceptPrompt, setConceptPrompt] = useState("");
  const [generatedThumbs, setGeneratedThumbs] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const title = scrapedTitle || "Overpowered S-Rank Recap";
  const genre = scrapedGenre || "Fantasy Action";

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Image className="h-5 w-5 text-purple-400" />
            Clickbait Thumbnail Studio
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Optimize thumbnail clickbait text overlays, split screens, and
            layout assets
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
        >
          ← Dashboard
        </button>
      </div>

      {/* AI Automatic Composition Section */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-2xl p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-950/40 rounded-lg border border-purple-800/30">
              <Sparkles className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                AI Automatic Thumbnail Composer
              </h3>
              <p className="text-[10px] text-neutral-500 font-mono">
                Analyze storyboard to extract focal assets & compose clickbait
                layouts
              </p>
            </div>
          </div>
          <button
            onClick={async () => {
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
                    panels: panels.map(p => ({ visual_description: p.visual_description, image_url: p.image_url })),
                    model: localStorage.getItem("ai_comic_model") || "gemini-2.5-flash",
                  }),
                });
                const data = await res.json();
                if (data.success) {
                  setGeneratedThumbs(prev => [data.url, ...prev].slice(0, 4));
                  addNotification?.("Thumbnail variation generated successfully!", "success");
                }
              } catch (e) {
                addNotification?.("Failed to generate thumbnail.", "error");
              } finally {
                setIsGenerating(false);
              }
            }}
            disabled={isGenerating || panels.length === 0}
            className="px-5 py-2 bg-purple-650 hover:bg-purple-550 text-white rounded-xl text-xs font-mono font-bold transition-all disabled:opacity-40 shadow-lg shadow-purple-900/20 cursor-pointer"
          >
            {isGenerating ? "Composing..." : "✦ Generate Variation"}
          </button>
        </div>

        {generatedThumbs.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
            {generatedThumbs.map((url, idx) => (
              <div key={idx} className="group relative aspect-video bg-neutral-950 rounded-lg border border-neutral-800 overflow-hidden hover:border-purple-500/50 transition-all">
                <img src={url} alt={`Variation ${idx}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                   <button
                     onClick={() => {
                        // In a real app, we'd save this to the project's permanent thumbnails list
                        const saved = JSON.parse(localStorage.getItem(`project_thumbnails_${title}`) || "[]");
                        localStorage.setItem(`project_thumbnails_${title}`, JSON.stringify([url, ...saved]));
                        addNotification?.("Thumbnail saved to project library!", "success");
                     }}
                     className="px-3 py-1.5 bg-white text-black text-[10px] font-bold rounded-lg hover:bg-neutral-200 transition-colors"
                   >
                     Save to Project
                   </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Concept generator */}
        <ThumbnailGenerator
          title={title}
          genre={genre}
          onGeneratedConcept={(c) => {
            setConceptPrompt(c);
            if (addNotification)
              addNotification(
                "Thumbnail clickbait concept generated!",
                "success"
              );
          }}
        />

        {/* Layout layering designer */}
        <ThumbnailLayoutForm conceptPrompt={conceptPrompt} />

        {/* Splits & Composition Guide */}
        <ThumbnailCompositionGuide conceptPrompt={conceptPrompt} />
      </div>
    </div>
  );
}
