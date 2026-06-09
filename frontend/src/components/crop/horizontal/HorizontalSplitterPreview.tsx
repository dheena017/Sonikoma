import React from "react";
import { Split } from "lucide-react";

interface ResultingSegment {
  index: number;
  startPct: number;
  endPct: number;
  heightPct: number;
  heightPx: number | null;
}

interface HorizontalSplitterPreviewProps {
  resultingSegments: ResultingSegment[];
}

export default function HorizontalSplitterPreview({
  resultingSegments,
}: HorizontalSplitterPreviewProps) {
  if (resultingSegments.length <= 1) return null;

  return (
    <div className="bg-black/30 rounded-xl p-2.5 border border-white/5 space-y-1.5">
      <div className="text-[9px] uppercase font-mono text-neutral-600 pb-1 border-b border-white/5 flex items-center gap-1">
        <Split className="h-3 w-3 text-purple-400" />
        <span>Output Segments Preview ({resultingSegments.length})</span>
      </div>

      <div className="max-h-32 overflow-y-auto space-y-1.5 pr-0.5 scrollbar-thin">
        {resultingSegments.map((seg) => (
          <div
            key={seg.index}
            className="flex justify-between items-center text-[9px] text-neutral-400 font-mono bg-white/[0.01] hover:bg-white/[0.04] border border-white/[0.03] rounded-lg px-2.5 py-1"
          >
            <span className="text-neutral-500 font-bold">Part {seg.index}</span>
            <div className="flex items-center gap-2">
              <span className="text-purple-300 font-semibold">{seg.heightPct}%</span>
              {seg.heightPx !== null && (
                <span className="text-neutral-600 font-normal">({seg.heightPx}px)</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
