import React from "react";
import { Star } from "lucide-react";
import {
  WorkspaceLayoutTabs,
  WorkspaceLayoutSearch,
} from "../../../shared/WorkspaceLayout";

interface FavoritesWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const FavoritesWorkspaceHeader: React.FC<
  FavoritesWorkspaceHeaderProps
> = ({ tabs, activeTab, onSelectTab, searchQuery, onSearchChange }) => {
  return (
    <div className="shrink-0">
      {/* Title row */}
      <div className="px-4 py-3 border-b border-amber-500/15 bg-[#100f20]/95 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-3xl bg-amber-500/12 border border-amber-500/25 flex items-center justify-center shadow-[0_0_18px_rgba(245,158,11,0.22)]">
            <Star className="h-4.5 w-4.5 text-amber-300 fill-amber-300" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.28em] font-mono truncate">
              Favorites Vault
            </h2>
            <p className="text-[10px] text-neutral-300 font-mono truncate max-w-xs">
              Quickly access saved assets across your project.
            </p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-100 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25 shadow-sm">
          <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-amber-300/15 text-amber-300">
            ★
          </span>
          Saved
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
        placeholder="Search favorited assets..."
      />
    </div>
  );
};
