import React, { useState } from "react";
import { AreaChart, ArrowLeft } from "lucide-react";
import TitleABValidator from "./TitleABValidator.js";
import OutroCliffhangerAnalyzer from "./OutroCliffhangerAnalyzer.js";
import TokenUsageDashboard from "./TokenUsageDashboard.js";

import { GeneratedPanel } from "@/types";

interface CTRAnalyticsPageProps {
  onNavigateHome: () => void;
  addNotification?: (msg: string, type: any) => void;
  scrapedTitle?: string;
  panels?: GeneratedPanel[];
}

const CTRAnalyticsPage = React.memo(
  ({
    onNavigateHome,
    addNotification,
    scrapedTitle,
    panels,
  }: CTRAnalyticsPageProps) => {
    const [activeTab, setActiveTab] = useState<"titles" | "outros" | "tokens">(
      "titles"
    );

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
              <span className="text-purple-400">CTR Predictor</span>
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <AreaChart className="h-5 w-5" />
              </div>
              AI CTR & Video Performance Predictor
            </h2>
            <p className="text-xs text-neutral-400 font-mono mt-0.5">
              Analyze click-through rate indices and retention cliffhanger dynamics
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
          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-4 py-2 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "tokens"
                ? "border-purple-500 text-white"
                : "border-transparent text-neutral-400 hover:text-neutral-250"
            }`}
          >
            ✦ API Token Usage
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
          {activeTab === "tokens" && (
            <TokenUsageDashboard addNotification={addNotification} />
          )}
        </div>
      </div>
    );
  }
);

export default CTRAnalyticsPage;
