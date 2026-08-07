// ─── ChapterMarker ────────────────────────────────────────────────────────────
// Canonical location: timeline/components/storyboard/ChapterMarker.tsx

import React from "react";
import { BookOpen } from "lucide-react";

interface ChapterMarkerProps {
  title: string;
  leftPct: number;
}

const ChapterMarker: React.FC<ChapterMarkerProps> = ({ title, leftPct }) => (
  <div
    className="absolute top-0 bottom-0 pointer-events-none z-20 flex flex-col items-center"
    style={{ left: `${leftPct}%` }}
  >
    <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-900/90 border border-purple-400/50 text-purple-200 text-[8px] font-mono font-bold shadow-md">
      <BookOpen className="h-2.5 w-2.5" />
      <span>{title}</span>
    </div>
    <div className="w-px flex-1 border-r border-dashed border-purple-400/50" />
  </div>
);

export default React.memo(ChapterMarker);
