import React from "react";
import { BookOpen } from "lucide-react";
import {
  WorkspaceLayoutTabs,
  WorkspaceLayoutSearch,
} from "../../../shared/WorkspaceLayout";

interface StoryWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const StoryWorkspaceHeader: React.FC<StoryWorkspaceHeaderProps> = ({
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => (
  <div className="shrink-0">
    <div className="px-4 py-3 border-b border-purple-500/15 bg-[#100f20]/95 backdrop-blur-xl flex items-center justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="h-10 w-10 rounded-3xl bg-purple-500/12 border border-purple-500/25 flex items-center justify-center shadow-[0_0_18px_rgba(168,85,247,0.18)]">
          <BookOpen className="h-4.5 w-4.5 text-purple-300" />
        </div>
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-[11px] font-black text-white uppercase tracking-[0.28em] font-mono truncate">
            Story Studio
          </h2>
          <p className="text-[10px] text-neutral-300 font-mono truncate max-w-xs">
            Build your narrative arcs, scenes, and cinematic beats.
          </p>
        </div>
      </div>
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pink-100 bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/25 shadow-sm">
        <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-pink-300/15 text-pink-300">
          ❤️
        </span>
        Heart of Sonikoma
      </span>
    </div>
    <div className="px-3.5 pt-3 pb-2">
      <WorkspaceLayoutTabs
        tabs={tabs}
        activeTab={activeTab}
        onSelectTab={onSelectTab}
      />
    </div>
    <WorkspaceLayoutSearch
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Search scenes & acts..."
    />
  </div>
);
