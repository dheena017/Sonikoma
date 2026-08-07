// ─── StoryboardStrip ─────────────────────────────────────────────────────────
// Canonical location: timeline/components/storyboard/StoryboardStrip.tsx

import React from "react";
import ChapterMarker from "./ChapterMarker";
import { LayoutGrid } from "lucide-react";

interface StoryboardStripProps {
  panels: any[];
  currentPanelIndex: number;
  onSelectPanel: (idx: number) => void;
}

const StoryboardStrip: React.FC<StoryboardStripProps> = ({
  panels, currentPanelIndex, onSelectPanel,
}) => {
  const total = Math.max(panels.length, 1);

  return (
    <div className="h-10 bg-[#0a0a0e] border-b border-white/[0.06] flex items-center shrink-0 relative overflow-hidden select-none">
      {/* Label */}
      <div className="w-28 shrink-0 h-full flex items-center gap-1.5 px-3 border-r border-white/5 bg-[#0d0d12]">
        <LayoutGrid className="h-3 w-3 text-purple-400" />
        <span className="text-[10px] font-bold text-neutral-400">Storyboard</span>
      </div>

      {/* Panels filmstrip */}
      <div className="flex-1 flex items-center gap-1.5 px-2 h-full overflow-x-auto [scrollbar-width:none] relative">
        {/* Sample chapter marker at index 3 */}
        {total > 3 && <ChapterMarker title="Ch. 1 - Arrival" leftPct={40} />}

        {panels.map((panel, idx) => {
          const imgUrl =
            panel.thumbnail ||
            panel.image_url ||
            panel.img_url ||
            panel.imageUrl ||
            panel.url ||
            panel.original_url ||
            panel.src ||
            `https://placehold.co/80x50/1a1a24/a855f7?text=${idx + 1}`;
          const isActive = idx === currentPanelIndex;

          return (
            <div
              key={idx}
              onClick={() => onSelectPanel(idx)}
              className={`h-7 px-2 rounded-md flex items-center gap-1.5 cursor-pointer border transition-all shrink-0 ${
                isActive
                  ? "bg-purple-900/60 border-purple-400 text-purple-100 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                  : "bg-white/5 border-white/10 hover:border-white/30 text-neutral-400"
              }`}
            >
              <img src={imgUrl} alt={`P${idx + 1}`} className="w-5 h-5 rounded object-cover" />
              <span className="text-[9px] font-mono font-bold">P#{idx + 1}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(StoryboardStrip);
