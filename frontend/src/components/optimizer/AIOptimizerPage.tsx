import React, { useState } from "react";
import {
  Sliders,
  Search,
  ArrowLeft,
  Settings,
  Globe,
  Radio,
} from "lucide-react";
import { GeneratedPanel } from "../../types";

import SeoOptimizationTab from "./SeoOptimizationTab.js";
import ShortsScriptTab from "./ShortsScriptTab.js";
import SoundOutroTab from "./SoundOutroTab.js";
import AdPlacementTab from "./AdPlacementTab.js";

interface AIOptimizerPageProps {
  panels: GeneratedPanel[];
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
}

export default function AIOptimizerPage({
  panels,
  onNavigateHome,
  addNotification,
}: AIOptimizerPageProps) {
  const [activeTab, setActiveTab] = useState<
    "seo" | "shorts" | "sound" | "ads"
  >("seo");

  // Compile overall storyboard details for prompts
  const title = "Overpowered S-Rank Recap";
  const genre = "Fantasy Action";

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
      return `${timestamp} - Panel ${idx + 1}: ${p.speech_text || "(Silent)"}`;
    })
    .join("\n");

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Sliders className="h-5 w-5 text-purple-400" />
            AI Video Production & SEO Assistant
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Optimize your recap video content metadata, hook retention, and
            chapters
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-850 cursor-pointer"
        >
          ← Dashboard
        </button>
      </div>

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
      </div>

      {/* ACTIVE TAB VIEWS */}
      <div className="bg-neutral-900/10 border border-neutral-800/80 rounded-2xl p-5 md:p-6 space-y-4">
        {activeTab === "seo" && (
          <SeoOptimizationTab
            title={title}
            genre={genre}
            storyboardSummary={storyboardSummary}
          />
        )}
        {activeTab === "shorts" && (
          <ShortsScriptTab
            title={title}
            storyboardSummary={storyboardSummary}
          />
        )}
        {activeTab === "sound" && (
          <SoundOutroTab title={title} storyboardSummary={storyboardSummary} />
        )}
        {activeTab === "ads" && (
          <AdPlacementTab compiledScript={compiledScript} />
        )}
      </div>
    </div>
  );
}
