import React, { useState } from "react";
import { AreaChart, ArrowLeft } from "lucide-react";
import TitleABValidator from "./TitleABValidator.js";
import OutroCliffhangerAnalyzer from "./OutroCliffhangerAnalyzer.js";

import { GeneratedPanel } from "../../types";

interface CTRAnalyticsPageProps {
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  panels?: GeneratedPanel[];
}

export default function CTRAnalyticsPage({
  onNavigateHome,
  addNotification,
  scrapedTitle,
  panels,
}: CTRAnalyticsPageProps) {
  const [activeTab, setActiveTab] = useState<"titles" | "outros">("titles");

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between border-b border-neutral-850 pb-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <AreaChart className="h-5 w-5 text-purple-400" />
            AI CTR & Video Performance Predictor
          </h2>
          <p className="text-xs text-neutral-400 font-mono mt-0.5">
            Analyze click-through rate indices and retention cliffhanger
            dynamics
          </p>
        </div>
        <button
          onClick={onNavigateHome}
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white rounded-xl text-xs font-mono transition-all hover:bg-neutral-855 cursor-pointer"
        >
          ← Dashboard
        </button>
      </div>

      {/* TABS SELECTOR */}
      <div className="flex border-b border-neutral-800 overflow-x-auto scrollbar-none font-mono">
        <button
          onClick={() => setActiveTab("titles")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "titles"
              ? "border-purple-500 text-white"
              : "border-transparent text-neutral-400 hover:text-neutral-250"
          }`}
        >
          ✦ A/B Title Tester
        </button>
        <button
          onClick={() => setActiveTab("outros")}
          className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
            activeTab === "outros"
              ? "border-purple-500 text-white"
              : "border-transparent text-neutral-400 hover:text-neutral-250"
          }`}
        >
          ✦ Outro Cliffhanger Scores
        </button>
      </div>

      {/* ACTIVE VIEW */}
      <div className="space-y-4">
        {activeTab === "titles" && (
          <TitleABValidator
            addNotification={addNotification}
            scrapedTitle={scrapedTitle}
            panels={panels}
          />
        )}
        {activeTab === "outros" && (
          <OutroCliffhangerAnalyzer
            addNotification={addNotification}
            panels={panels}
          />
        )}
      </div>
    </div>
  );
}
