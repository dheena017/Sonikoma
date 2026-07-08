import React, { useState } from "react";
import {
  Sliders,
  Search,
  ArrowLeft,
  Settings,
  Globe,
  Radio,
  Sparkles,
} from "lucide-react";
import { GeneratedPanel } from "@/types";

import SeoOptimizationTab from "./SeoOptimizationTab.js";
import ShortsScriptTab from "./ShortsScriptTab.js";
import SoundOutroTab from "./SoundOutroTab.js";
import AdPlacementTab from "./AdPlacementTab.js";
import EngagementTab from "./EngagementTab.js";

interface AIOptimizerPageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  scrapedGenre?: string;
  videoUrl?: string | null;
}

const AIOptimizerPage = React.memo(
  ({
    panels,
    onNavigateHome,
    addNotification,
    scrapedTitle,
    scrapedGenre,
    videoUrl,
  }: AIOptimizerPageProps) => {
    if (panels.length === 0) {
      return (
        <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in flex flex-col items-center justify-center min-h-[400px]">
          <Sparkles className="h-10 w-10 text-neutral-600 mb-3" />
          <h3 className="text-neutral-450 font-mono text-sm font-semibold mb-1">
            No Panels Available
          </h3>
          <p className="text-neutral-500 text-xs text-center max-w-xs leading-relaxed">
            Please import a series or add panels to your storyboard timeline to optimize video settings.
          </p>
        </div>
      );
    }


    const [activeTab, setActiveTab] = useState<
      "seo" | "shorts" | "sound" | "ads" | "engagement"
    >("seo");

    // Compile overall storyboard details for prompts
    const title = scrapedTitle || "Overpowered S-Rank Recap";
    const genre = scrapedGenre || "Fantasy Action";

    const storyboardSummary = panels
      .map(
        (p, idx) =>
          `Panel ${idx + 1}: Dialogue: "${
            p.speech_text || "Silent scene"
          }" | Visual action: ${p.visual_description || "No visual details"}`
      )
      .join("\n");

    // Compile chronological script timestamps for chapter splits
    let currentAccumulator = 0.0;
    const compiledScript = panels
      .map((p, idx) => {
        const minutes = Math.floor(currentAccumulator / 60);
        const seconds = Math.floor(currentAccumulator % 60);
        const timestamp = `${minutes.toString().padStart(2, "0")}:${seconds
          .toString()
          .padStart(2, "0")}`;
        currentAccumulator += p.duration || 4.5;
        return `${timestamp} - Panel ${idx + 1}: ${
          p.speech_text || "(Silent)"
        }`;
      })
      .join("\n");

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">

        {/* TABS SELECTOR */}

        <div className="flex border-b border-neutral-800 overflow-x-auto scrollbar-none font-mono">
          <button
            onClick={() => setActiveTab("seo")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "seo"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ SEO & Chapters
          </button>
          <button
            onClick={() => setActiveTab("shorts")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "shorts"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ Reels & Shorts
          </button>
          <button
            onClick={() => setActiveTab("sound")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "sound"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ Sound & Vibes
          </button>
          <button
            onClick={() => setActiveTab("ads")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "ads"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ Ad Placements
          </button>
          <button
            onClick={() => setActiveTab("engagement")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "engagement"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ Engagement & Outros
          </button>
        </div>

        {/* ACTIVE TAB VIEWS */}
        <div className="bg-neutral-900/10 border border-neutral-800/80 rounded-2xl p-5 md:p-6 space-y-4">
          {activeTab === "seo" && (
            <SeoOptimizationTab
              title={title}
              genre={genre}
              storyboardSummary={storyboardSummary}
              videoUrl={videoUrl}
              panels={panels}
              addNotification={addNotification}
            />
          )}
          {activeTab === "shorts" && (
            <ShortsScriptTab
              title={title}
              storyboardSummary={storyboardSummary}
              videoUrl={videoUrl}
              panels={panels}
              addNotification={addNotification}
            />
          )}
          {activeTab === "sound" && (
            <SoundOutroTab
              title={title}
              storyboardSummary={storyboardSummary}
              videoUrl={videoUrl}
              panels={panels}
              addNotification={addNotification}
            />
          )}
          {activeTab === "ads" && (
            <AdPlacementTab
              compiledScript={compiledScript}
              videoUrl={videoUrl}
              panels={panels}
              addNotification={addNotification}
            />
          )}
          {activeTab === "engagement" && (
            <EngagementTab
              title={title}
              storyboardSummary={storyboardSummary}
              videoUrl={videoUrl}
              panels={panels}
              addNotification={addNotification}
            />
          )}
        </div>
      </div>
    );
  }
);

export default AIOptimizerPage;
