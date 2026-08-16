import React from "react";
import { LayoutTemplate } from "lucide-react";
import {
  WorkspaceLayoutTabs,
  WorkspaceLayoutSearch,
} from "../../../shared/WorkspaceLayout";

interface TemplatesWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const TemplatesWorkspaceHeader: React.FC<
  TemplatesWorkspaceHeaderProps
> = ({ tabs, activeTab, onSelectTab, searchQuery, onSearchChange }) => (
  <div className="shrink-0">
    <div className="px-3.5 py-2.5 border-b border-amber-900/30 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,0.3)]">
          <LayoutTemplate className="h-3.5 w-3.5 text-amber-400" />
        </div>
        <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">
          Comic Templates
        </h2>
      </div>
      <span className="text-[9px] font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
        📐 Modular
      </span>
    </div>
    <WorkspaceLayoutTabs
      tabs={tabs}
      activeTab={activeTab}
      onSelectTab={onSelectTab}
    />
    <WorkspaceLayoutSearch
      value={searchQuery}
      onChange={onSearchChange}
      placeholder="Search templates..."
    />
  </div>
);
