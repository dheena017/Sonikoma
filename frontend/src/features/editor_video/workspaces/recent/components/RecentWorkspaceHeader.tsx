import React from "react";
import { History } from "lucide-react";
import {
  WorkspaceLayoutTabs,
  WorkspaceLayoutSearch,
} from "../../../shared/WorkspaceLayout";

interface RecentWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const RecentWorkspaceHeader: React.FC<RecentWorkspaceHeaderProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="shrink-0">
      {/* Title row */}
      <div className="px-4 py-3 border-b border-[#3B82F6]/15 bg-[#100f20]/95 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-3xl bg-purple-500/12 border border-[#3B82F6]/25 flex items-center justify-center ">
            <History className="h-4.5 w-4.5 text-[#60A5FA]" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.28em] font-mono truncate">
              Recently Used
            </h2>
            <p className="text-[10px] text-neutral-300 font-mono truncate max-w-xs">
              Quickly re-open recent assets and previews from your project.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-100 bg-[#3B82F6]/10 px-3 py-1 rounded-full border border-[#3B82F6]/25 shadow-sm">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-purple-300/15 text-[#60A5FA]">
            🕒
          </span>
          Log
        </span>
      </div>
      {/* Tabs row */}
      <div className="px-3.5 pt-3 pb-2">
        <WorkspaceLayoutTabs
          tabs={tabs}
          activeTab={activeTab}
          onSelectTab={onSelectTab}
        />
      </div>
      {/* Search row */}
      <WorkspaceLayoutSearch
        value={searchQuery}
        onChange={onSearchChange}
        placeholder="Search recent assets..."
      />
    </div>
  );
};
