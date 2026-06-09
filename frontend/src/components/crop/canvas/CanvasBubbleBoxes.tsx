import React from "react";

interface CanvasBubbleBoxesProps {
  detectedBubbles: Array<{ box: [number, number, number, number]; text: string; category?: string }>;
  selectedBubbleIdx: number | null;
  setSelectedBubbleIdx?: (idx: number | null) => void;
  onCleanSingleBubble?: (ymin: number, xmin: number, ymax: number, xmax: number, text: string) => Promise<void>;
}

export default function CanvasBubbleBoxes({
  detectedBubbles,
  selectedBubbleIdx,
  setSelectedBubbleIdx,
  onCleanSingleBubble,
}: CanvasBubbleBoxesProps) {
  if (detectedBubbles.length === 0) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {detectedBubbles.map((bubble, idx) => {
        const [ymin, xmin, ymax, xmax] = bubble.box;
        const top = ymin / 10;
        const left = xmin / 10;
        const width = (xmax - xmin) / 10;
        const height = (ymax - ymin) / 10;
        const isSelected = selectedBubbleIdx === idx;

        return (
          <div
            key={`bubble-box-${idx}`}
            className={`absolute border-2 pointer-events-auto cursor-pointer transition-all ${
              isSelected
                ? "border-amber-400 bg-amber-400/20 z-40 shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                : "border-purple-400/40 bg-purple-500/5 hover:border-purple-300 hover:bg-purple-500/20"
            }`}
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${width}%`,
              height: `${height}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (setSelectedBubbleIdx) setSelectedBubbleIdx(idx);
              if (onCleanSingleBubble) {
                onCleanSingleBubble(ymin, xmin, ymax, xmax, bubble.text);
              }
            }}
            title={bubble.text ? `Bubble OCR: "${bubble.text}" (Click to Clean/Select)` : "Detected Bubble (Click to Clean/Select)"}
          >
            <div className="absolute left-1 top-1 bg-black/85 text-[8px] text-purple-300 font-bold px-1 py-0.5 rounded border border-purple-500/20 max-w-[90%] overflow-hidden text-ellipsis whitespace-nowrap opacity-75 group-hover:opacity-100 transition-opacity">
              Bubble #{idx + 1}
            </div>
            {bubble.text && (
              <div className="absolute bottom-1 left-1 max-w-[95%] bg-black/90 text-[9px] text-neutral-200 px-1.5 py-0.5 rounded border border-white/5 opacity-0 hover:opacity-100 transition-opacity pointer-events-none overflow-hidden text-ellipsis whitespace-nowrap z-50">
                {bubble.text}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
