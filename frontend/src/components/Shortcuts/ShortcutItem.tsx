import React from "react";
import { Edit3, RefreshCw, Trash2 } from "lucide-react";
import { ShortcutActionDetails } from "./shortcutTypes";
import { renderKeyCombo, highlightText } from "./shortcutUtils";

interface ShortcutItemProps {
  id: string;
  value: string;
  details: ShortcutActionDetails;
  isRecording: boolean;
  isModified: boolean;
  searchQuery: string;
  onStartRecording: (id: string) => void;
  onDisableSingle: (id: string, event: React.MouseEvent) => void;
  onResetSingle: (id: string, event: React.MouseEvent) => void;
}

export default function ShortcutItem({
  id,
  value,
  details,
  isRecording,
  isModified,
  searchQuery,
  onStartRecording,
  onDisableSingle,
  onResetSingle,
}: ShortcutItemProps) {
  return (
    <div
      onClick={() => {
        if (!isRecording) {
          onStartRecording(id);
        }
      }}
      className={`grid grid-cols-12 items-center px-6 py-4 transition-all cursor-pointer group relative ${
        isRecording ? "bg-purple-950/20 z-10" : "hover:bg-white/[0.02]"
      }`}
    >
      {isRecording && <div className="absolute inset-y-0 left-0 w-1 bg-purple-500" />}

      <div className="col-span-6 sm:col-span-7 flex items-center gap-4">
        <div
          className={`p-2 rounded-lg ${
            isRecording
              ? "bg-purple-500 text-white"
              : "bg-neutral-900 text-neutral-500 group-hover:text-neutral-300 group-hover:bg-neutral-800"
          } transition-all`}
        >
          {details.icon}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white text-sm tracking-tight">
              {highlightText(details.label, searchQuery)}
            </span>
            {isModified && (
              <span
                className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
                title="Modified from default"
              />
            )}
          </div>
          <span className="text-[10px] text-neutral-500 font-mono mt-0.5 sm:hidden">
            Scope: {details.scope}
          </span>
        </div>
      </div>

      <div className="col-span-2 hidden sm:block">
        <span className="px-2 py-0.5 rounded-md bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-500 font-medium">
          {details.scope}
        </span>
      </div>

      <div className="col-span-6 sm:col-span-3 flex items-center gap-4 justify-end">
        {isRecording ? (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold font-mono px-3 py-1.5 rounded-lg bg-purple-500 text-white animate-pulse shadow-lg shadow-purple-500/20">
              RECORDING...
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {renderKeyCombo(value)}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all ml-2">
              {value && (
                <button
                  onClick={(e) => onDisableSingle(id, e)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-rose-400 transition-all"
                  title="Disable Shortcut"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {isModified && (
                <button
                  onClick={(e) => onResetSingle(id, e)}
                  className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-amber-400 transition-all"
                  title="Reset to Default"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              )}
              <button className="p-1.5 rounded-lg hover:bg-neutral-800 text-neutral-500 hover:text-purple-400 transition-all" title="Edit Shortcut">
                <Edit3 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
