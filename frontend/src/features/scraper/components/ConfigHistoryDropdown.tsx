import React from "react";
import { History, RotateCcw } from "lucide-react";

interface Props {
  history: any[];
  onApply: (state: any) => void;
}

export function ConfigHistoryDropdown({ history, onApply }: Props) {
  if (history.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-[9px] font-mono font-bold text-neutral-500 uppercase tracking-widest">
        <History className="h-3 w-3" />
        <span>Recent Configurations</span>
      </div>
      <div className="flex flex-col gap-1.5">
        {history.map((item, i) => (
          <button
            key={i}
            onClick={() => onApply(item)}
            className="flex items-center justify-between px-3 py-2 bg-neutral-900/50 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition-all text-left group"
          >
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-300 font-bold">
                {item.name || `Session Config ${i + 1}`}
              </span>
              <span className="text-[8px] text-neutral-500 font-mono">
                {item.cropSensitivity || item.sensitivity}% sens ·{" "}
                {item.aspectRatioLock || item.detectionStyle}
              </span>
            </div>
            <RotateCcw className="h-3 w-3 text-neutral-600 group-hover:text-indigo-400 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}
