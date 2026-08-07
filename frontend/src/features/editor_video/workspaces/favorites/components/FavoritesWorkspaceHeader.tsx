import React from "react";
import { Star } from "lucide-react";
import { WorkspaceLayoutTabs, WorkspaceLayoutSearch } from "../../../shared/WorkspaceLayout";

interface FavoritesWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const FavoritesWorkspaceHeader: React.FC<FavoritesWorkspaceHeaderProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="shrink-0">
      {/* Title row */}
      <div className="px-3.5 py-2.5 border-b border-amber-500/20 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
            <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
          </div>
          <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">Favorites Vault</h2>
        </div>
        <span className="text-[9px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
          ⭐ Saved
        </span>
      </div>
      {/* Tabs row */}
      <WorkspaceLayoutTabs tabs={tabs} activeTab={activeTab} onSelectTab={onSelectTab} />
      {/* Search row */}
      <WorkspaceLayoutSearch value={searchQuery} onChange={onSearchChange} placeholder="Search favorited assets..." />
    </div>
  );
};
