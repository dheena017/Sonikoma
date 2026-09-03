import React from "react";
import { Users, Plus } from "lucide-react";
import {
  WorkspaceLayoutTabs,
  WorkspaceLayoutSearch,
} from "../../../shared/WorkspaceLayout";

interface CharactersWorkspaceHeaderProps {
  characterCount: number;
  onAddCharacter: () => void;
  tabs: string[];
  activeTab: string;
  onSelectTab: (tab: string) => void;
  searchQuery: string;
  onSearchChange: (val: string) => void;
}

export const CharactersWorkspaceHeader: React.FC<
  CharactersWorkspaceHeaderProps
> = ({
  characterCount,
  onAddCharacter,
  tabs,
  activeTab,
  onSelectTab,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="shrink-0">
      <div className="px-4 py-3 border-b border-[#2F2F2F] bg-[#100f20]/95 backdrop-blur-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-10 w-10 rounded-3xl bg-indigo-500/12 border border-[#2F2F2F] flex items-center justify-center shadow-[0_0_18px_rgba(99,102,241,0.18)]">
            <Users className="h-4.5 w-4.5 text-neutral-300" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.28em] font-mono truncate">
              Characters Roster
            </h2>
            <p className="text-[10px] text-neutral-300 font-mono truncate max-w-xs">
              Manage your cast, expressions, and pose presets.
            </p>
          </div>
        </div>
        <button
          onClick={onAddCharacter}
          className="inline-flex items-center gap-2 rounded-full bg-pink-500/12 px-3 py-1 text-[9px] font-semibold text-pink-100 border border-pink-500/25 shadow-sm transition hover:bg-pink-500/15"
        >
          <Plus className="h-3.5 w-3.5 text-pink-200" />
          Cast ({characterCount})
        </button>
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
        placeholder="Search characters..."
      />
    </div>
  );
};
