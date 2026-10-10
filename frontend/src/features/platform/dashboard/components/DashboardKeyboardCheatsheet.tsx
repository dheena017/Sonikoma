import React, { useState } from "react";
import { Keyboard, ChevronDown, ChevronUp, Command } from "lucide-react";

interface ShortcutItem {
  keys: string[];
  label: string;
  scope: string;
}

const SHORTCUTS: ShortcutItem[] = [
  { keys: ["Ctrl", "N"], label: "Create New Chapter", scope: "Global" },
  { keys: ["Space"], label: "Preview / Pause Video", scope: "Timeline" },
  { keys: ["S"], label: "Slice Comic Strip", scope: "Image Editor" },
  { keys: ["O"], label: "Inpaint Bubble & OCR", scope: "Speech Clean" },
  { keys: ["V"], label: "Cast Dialogue Voice", scope: "Audio Lab" },
  { keys: ["Ctrl", "E"], label: "Export Final Video", scope: "Compositor" },
];

export default function DashboardKeyboardCheatsheet() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-[#2F2F2F] bg-[#1E1E1E] p-3.5 sm:p-4 text-left shadow-sm transition-all">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#141414] text-[#9CA3AF] border border-[#2F2F2F]">
            <Keyboard className="w-4 h-4 text-[#3B82F6]" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#E5E5E5] flex items-center gap-2">
              <span>Studio Keyboard Shortcuts</span>
              <span className="text-[10px] font-mono text-[#6B7280]">
                (Fast Workflow)
              </span>
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="text-xs font-mono text-[#9CA3AF] hover:text-[#E5E5E5] flex items-center gap-1 cursor-pointer py-1 px-2 rounded-lg hover:bg-[#141414] transition-colors"
        >
          <span>{isOpen ? "Hide Shortcuts" : "View All Shortcuts"}</span>
          {isOpen ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {isOpen && (
        <div className="mt-3 pt-3 border-t border-[#282828] grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono">
          {SHORTCUTS.map((item, idx) => (
            <div
              key={idx}
              className="p-2.5 rounded-xl bg-[#141414] border border-[#282828] flex flex-col justify-between gap-1.5"
            >
              <div className="flex items-center gap-1">
                {item.keys.map((k, kIdx) => (
                  <React.Fragment key={kIdx}>
                    <kbd className="px-1.5 py-0.5 rounded bg-[#1E1E1E] border border-[#2F2F2F] text-[10px] font-bold text-[#E5E5E5]">
                      {k}
                    </kbd>
                    {kIdx < item.keys.length - 1 && (
                      <span className="text-[10px] text-[#6B7280]">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <span className="text-[11px] font-sans text-[#9CA3AF] leading-tight">
                {item.label}
              </span>
              <span className="text-[9px] font-mono text-[#6B7280]">
                {item.scope}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
