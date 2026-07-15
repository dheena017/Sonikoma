import React from "react";
import { ArrowDown } from "lucide-react";

interface MergePanelListProps {
  previewIndices: number[];
  editingImageIdx: number;
  scrapedImages: string[];
  layout: "vertical" | "horizontal";
}

export default function MergePanelList({
  previewIndices,
  editingImageIdx,
  scrapedImages,
  layout,
}: MergePanelListProps) {
  return (
    <div className="space-y-1.5">
      <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono tracking-widest block">
        Frames to be merged ({previewIndices.length} total)
      </span>
      <div
        className={`space-y-1 max-h-48 overflow-y-auto pr-1 scrollbar-thin flex ${
          layout === "horizontal"
            ? "flex-row gap-2 overflow-x-auto overflow-y-hidden"
            : "flex-col"
        }`}
      >
        {previewIndices.map((imgIdx, i) => {
          const imgUrl = scrapedImages[imgIdx];
          const isCurrent = imgIdx === editingImageIdx;
          const isLast = i === previewIndices.length - 1;
          return (
            <React.Fragment key={imgIdx}>
              <div
                className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border flex-shrink-0 ${
                  isCurrent
                    ? "bg-teal-950/30 border-teal-800/40"
                    : "bg-black/20 border-white/5"
                }`}
              >
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 flex-shrink-0 bg-neutral-900 flex items-center justify-center">
                  <img
                    src={imgUrl}
                    alt={`Frame ${imgIdx + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const img = e.currentTarget;
                      if (img.dataset.retried) return;
                      img.dataset.retried = "1";
                      const src = img.src;
                      if (!src.includes("/api/proxy-image") && !src.includes("/api/image/")) {
                        img.src = `/api/proxy-image?url=${encodeURIComponent(src)}`;
                      }
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`text-[10px] font-bold font-mono ${
                      isCurrent ? "text-teal-300" : "text-neutral-400"
                    }`}
                  >
                    Frame #{imgIdx + 1}
                  </span>
                  {isCurrent && (
                    <span className="ml-2 text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-md bg-teal-950 text-teal-400 border border-teal-800/50">
                      CURRENT
                    </span>
                  )}
                </div>
              </div>
              {!isLast && layout === "vertical" && (
                <div className="flex justify-center">
                  <ArrowDown className="h-3 w-3 text-teal-700/60" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
