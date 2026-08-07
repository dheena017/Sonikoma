import React from "react";
import { BookOpen } from "lucide-react";
import { WorkspaceLayoutTabs, WorkspaceLayoutSearch } from "../../../shared/WorkspaceLayout";

interface StoryWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const StoryWorkspaceHeader: React.FC<StoryWorkspaceHeaderProps> = ({
  tabs, activeTab, onSelectTab, searchQuery, onSearchChange,
}) => (
  <div className="shrink-0">
    <div className="px-3.5 py-2.5 border-b border-purple-900/30 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(168,85,247,0.3)]">
          <BookOpen className="h-3.5 w-3.5 text-purple-400" />
        </div>
        <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">Story Studio</h2>
      </div>
      <span className="text-[9px] font-mono text-pink-300 bg-pink-500/10 px-2 py-0.5 rounded-full border border-pink-500/30">
        ❤️ Heart of Sonikoma
      </span>
    </div>
    <WorkspaceLayoutTabs tabs={tabs} activeTab={activeTab} onSelectTab={onSelectTab} />
    <WorkspaceLayoutSearch value={searchQuery} onChange={onSearchChange} placeholder="Search scenes & acts..." />
  </div>
);
