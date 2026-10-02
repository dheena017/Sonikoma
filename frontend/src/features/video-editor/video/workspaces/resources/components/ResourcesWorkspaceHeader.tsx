import React from "react";
import { Package } from "lucide-react";
import {
  WorkspaceLayoutTabs,
  WorkspaceLayoutSearch,
} from "../../../shared/WorkspaceLayout";

interface ResourcesWorkspaceHeaderProps {
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const ResourcesWorkspaceHeader: React.FC<
  ResourcesWorkspaceHeaderProps
> = ({ tabs, activeTab, onSelectTab, searchQuery, onSearchChange }) => (
  <div className="shrink-0">
    <div className="px-3.5 py-2.5 border-b border-[#2F2F2F] bg-neutral-950/80 backdrop-blur-md flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="h-6 w-6 rounded-lg bg-[#3B82F6]/20 border border-[#2F2F2F] flex items-center justify-center shadow-sm">
          <Package className="h-3.5 w-3.5 text-[#60A5FA]" />
        </div>
        <h2 className="text-xs font-black text-white uppercase tracking-wider font-mono">
          Brand & Resources
        </h2>
      </div>
      <span className="text-[9px] font-mono text-[#60A5FA] bg-[#3B82F6]/10 px-2 py-0.5 rounded-full border border-[#3B82F6]/30">
        🎨 Brand Kit
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
      placeholder="Search brand kit..."
    />
  </div>
);
