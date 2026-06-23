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
