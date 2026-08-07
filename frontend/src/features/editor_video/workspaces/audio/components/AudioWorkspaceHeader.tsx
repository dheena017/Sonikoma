import React from "react";
import { Music } from "lucide-react";
import { WorkspaceLayoutTabs, WorkspaceLayoutSearch } from "../../../shared/WorkspaceLayout";

interface AudioWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const AudioWorkspaceHeader: React.FC<AudioWorkspaceHeaderProps> = ({
  tabs, activeTab, onSelectTab, searchQuery, onSearchChange,
}) => (
  <div className="shrink-0">
    <div className="px-3.5 py-2.5 border-b border-violet-900/30 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-violet-500/20 border border-violet-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
          <Music className="h-3.5 w-3.5 text-violet-400" />
        </div>
        <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">Audio Studio</h2>
      </div>
      <span className="text-[9px] font-mono text-violet-300 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/30">
        🎵 Audio Library
      </span>
    </div>
    <WorkspaceLayoutTabs tabs={tabs} activeTab={activeTab} onSelectTab={onSelectTab} />
    <WorkspaceLayoutSearch value={searchQuery} onChange={onSearchChange} placeholder="Search audio tracks..." />
  </div>
);
