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
        <div className="flex-grow flex flex-col items-center justify-center p-8 text-center min-h-[60vh] max-w-xl mx-auto space-y-5 animate-fade-in">
          <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-650 to-indigo-650 flex items-center justify-center shadow-lg shadow-purple-950/40">
            <Sparkles className="h-8 w-8 text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white tracking-tight">
              AI Video Optimizer Locked
            </h3>
            <p className="text-xs text-neutral-400 font-mono leading-relaxed max-w-sm">
              This module compiles dialogue scripts and panel descriptions
              chronologically to perform A/B title analysis, SEO indexing, and
              cliffhanger audits.
            </p>
          </div>
          <div className="bg-neutral-950/80 p-4 rounded-xl border border-neutral-900 text-left text-[11px] text-neutral-500 font-mono space-y-1.5 w-full">
            <div className="text-neutral-400 font-bold mb-1">
              💡 How to unlock:
            </div>
            <div>1. Go to the main Workspace</div>
            <div>2. Enter a Webtoon URL to scrape image strips</div>
            <div>3. Slice the strips into storyboard panels</div>
          </div>
          <button
            onClick={onNavigateHome}
            className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-mono font-bold shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
          >
            Go to Workspace
          </button>
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-500 mb-1.5">
              <span
                className="hover:text-purple-400 cursor-pointer"
                onClick={onNavigateHome}
              >
                Dashboard
              </span>
              <span>&gt;</span>
              <span className="text-purple-400">Video Optimizer</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <Sliders className="h-5 w-5" />
              </div>
              AI Video Production & SEO Assistant
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Optimize your recap video content metadata, hook retention, and chapters
            </p>
          </div>
          <button
            onClick={onNavigateHome}
            className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-mono transition-all cursor-pointer font-bold shadow-lg shadow-purple-950/30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
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
