import React, { useState } from "react";
import { AreaChart, ArrowLeft } from "lucide-react";
import TitleABValidator from "@/features/analytics/components/TitleABValidator";
import TokenUsageDashboard from "@/features/analytics/components/TokenUsageDashboard";

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
    const [activeTab, setActiveTab] = useState<"titles" | "tokens">(
      "titles"
    );

    return (
      <div className="flex-1 w-full space-y-6 animate-fade-in rounded-[24px] border border-[#1f1b2e] bg-[#09080e] p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        {/* PAGE HERO HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#1b172b] pb-5">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-[#181229] border border-purple-500/30 rounded-2xl text-purple-400 shadow-lg shadow-purple-950/50">
              <AreaChart className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/10 text-purple-300 border border-purple-500/20">
                  VISUAL STUDIO • MARKETING
                </span>
                <span className="text-xs text-emerald-400 font-mono">• Predicted CTR: 88.4%</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                CTR Predictor
              </h1>
              <p className="text-xs text-neutral-400 font-mono mt-0.5">
                A/B click-through rate scoring, title optimization, and LLM token consumption analytics.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="px-3.5 py-1.5 rounded-full bg-[#12101d] border border-[#231e38] text-neutral-300 text-xs font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Series: {scrapedTitle || "Active Storyboard"}</span>
            </div>
          </div>
        </div>

        {/* TABS SELECTOR */}
        <div className="flex border-b border-[#1b172b] overflow-x-auto scrollbar-none font-mono">
          <button
            onClick={() => setActiveTab("titles")}
            className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "titles"
                ? "border-purple-500 text-purple-300 bg-purple-500/10"
                : "border-transparent text-neutral-400 hover:text-white"
            }`}
          >
            ✦ A/B Title Tester
          </button>
          <button
            onClick={() => setActiveTab("tokens")}
            className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer whitespace-nowrap ${
              activeTab === "tokens"
                ? "border-purple-500 text-purple-300 bg-purple-500/10"
                : "border-transparent text-neutral-400 hover:text-white"
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
          {activeTab === "tokens" && (
            <TokenUsageDashboard addNotification={addNotification} />
          )}
        </div>
      </div>
    );
  }
);

export default CTRAnalyticsPage;
