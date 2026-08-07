import React from "react";
import { Package } from "lucide-react";
import { WorkspaceLayoutTabs, WorkspaceLayoutSearch } from "../../../shared/WorkspaceLayout";

interface ResourcesWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const ResourcesWorkspaceHeader: React.FC<ResourcesWorkspaceHeaderProps> = ({
  tabs, activeTab, onSelectTab, searchQuery, onSearchChange,
}) => (
  <div className="shrink-0">
    <div className="px-3.5 py-2.5 border-b border-purple-900/30 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.3)]">
          <Package className="h-3.5 w-3.5 text-indigo-400" />
        </div>
        <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">Brand & Resources</h2>
      </div>
      <span className="text-[9px] font-mono text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">
        🎨 Brand Kit
      </span>
    </div>
    <WorkspaceLayoutTabs tabs={tabs} activeTab={activeTab} onSelectTab={onSelectTab} />
    <WorkspaceLayoutSearch value={searchQuery} onChange={onSearchChange} placeholder="Search brand kit..." />
  </div>
);
