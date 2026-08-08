import React from "react";

export type AnalyticsTab = "overview" | "trends" | "leaderboard";

interface AnalyticsHeaderTabsProps {
  seriesTitle: string;
  activeTab: AnalyticsTab;
  onTabChange: (tab: AnalyticsTab) => void;
}

const AnalyticsHeaderTabs: React.FC<AnalyticsHeaderTabsProps> = ({
  seriesTitle,
  activeTab,
  onTabChange,
}) => {
  const tabs: Array<{ key: AnalyticsTab; label: string }> = [
    { key: "overview", label: "Overview" },
    { key: "trends", label: "Trends Chart" },
    { key: "leaderboard", label: "Leaderboard" },
  ];

  return (
    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 pb-1 border-b border-neutral-800/80">
      <div>
        <h2 className="text-base font-black text-white">{seriesTitle}</h2>
        <p className="text-xs text-neutral-500 font-medium">Performance Metrics & Engagement Trends</p>
      </div>

      <div className="flex bg-neutral-950/80 p-1 rounded-xl border border-neutral-800 w-fit select-none">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key)}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === tab.key
                ? "bg-purple-600 text-white shadow-md"
                : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AnalyticsHeaderTabs;
