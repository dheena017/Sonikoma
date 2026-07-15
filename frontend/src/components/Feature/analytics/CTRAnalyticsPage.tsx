import React, { useState } from "react";
import { AreaChart, ArrowLeft } from "lucide-react";
import TitleABValidator from "./TitleABValidator.js";
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
    const [activeTab, setActiveTab] = useState<"titles" | "tokens">(
      "titles"
    );

    return (
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-6 md:py-10 space-y-6 animate-fade-in">

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
          {activeTab === "tokens" && (
            <TokenUsageDashboard addNotification={addNotification} />
          )}
        </div>
      </div>
    );
  }
);

export default CTRAnalyticsPage;
