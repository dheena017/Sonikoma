import React from "react";
import { Search } from "lucide-react";
import { ShortcutActionDetails } from "./shortcutTypes";
import ShortcutItem from "./ShortcutItem";
import { getActionDetails } from "./shortcutUtils";

interface ShortcutListProps {
  shortcuts: Record<string, string>;
  filteredShortcuts: [string, string][];
  recordingActionId: string | null;
  searchQuery: string;
  defaultShortcuts: Record<string, string>;
  onStartRecording: (id: string) => void;
  onDisableSingle: (id: string, event: React.MouseEvent) => void;
  onResetSingle: (id: string, event: React.MouseEvent) => void;
  onClearFilters: () => void;
}

export default function ShortcutList({
  shortcuts,
  filteredShortcuts,
  recordingActionId,
  searchQuery,
  defaultShortcuts,
  onStartRecording,
  onDisableSingle,
  onResetSingle,
  onClearFilters,
}: ShortcutListProps) {
  return (
    <div className="bg-neutral-900/30 border border-neutral-800/60 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
      <div className="grid grid-cols-12 bg-neutral-950/50 px-6 py-4 border-b border-neutral-800 text-[10px] font-bold font-mono text-neutral-500 tracking-wider uppercase">
        <div className="col-span-6 sm:col-span-7">Action & Description</div>
        <div className="col-span-2 hidden sm:block">Scope</div>
        <div className="col-span-6 sm:col-span-3 text-right">Mapping</div>
      </div>

      <div className="divide-y divide-neutral-800/40 max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-neutral-800 scrollbar-track-transparent">
        {filteredShortcuts.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <div className="inline-flex p-4 rounded-full bg-neutral-900 border border-neutral-800">
              <Search className="h-8 w-8 text-neutral-700" />
            </div>
            <p className="text-sm text-neutral-500 font-medium">
              No shortcuts found matching your criteria.
            </p>
            <button
              onClick={onClearFilters}
              className="text-xs text-purple-400 hover:text-purple-300 font-bold uppercase tracking-wider"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          filteredShortcuts.map(([id, value]) => {
            const details = getActionDetails(id);
            const isRecording = recordingActionId === id;
            const isModified = value !== defaultShortcuts[id];

            return (
              <ShortcutItem
                key={id}
                id={id}
                value={value}
                details={details}
                isRecording={isRecording}
                isModified={isModified}
                searchQuery={searchQuery}
                onStartRecording={onStartRecording}
                onDisableSingle={onDisableSingle}
                onResetSingle={onResetSingle}
              />
            );
          })
        )}
      </div>

      <div className="bg-neutral-950/80 px-6 py-3 border-t border-neutral-800 flex justify-between items-center">
        <span className="text-[10px] text-neutral-500 font-mono">
          Showing {filteredShortcuts.length} of {Object.keys(shortcuts).length} actions
        </span>
        <div className="flex items-center gap-4 text-[10px] text-neutral-600 font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Customized</span>
          </div>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[9px]">
              Esc
            </kbd>
            <span>Cancel recording</span>
          </div>
        </div>
      </div>
    </div>
  );
}
