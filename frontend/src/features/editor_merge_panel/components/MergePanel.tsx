import React, { useState } from "react";
import {
  Layers,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Link2,
  Image as ImageIcon,
} from "lucide-react";
import MergePanelOptions from "./MergePanelOptions";
import MergePanelList from "./MergePanelList";

interface MergePanelProps {
  editingImageIdx: number;
  scrapedImages: string[];
  isMerging: boolean;
  onMerge: (
    count: number,
    config: {
      direction: "next" | "prev";
      layout: "vertical" | "horizontal";
      spacing: number;
      spacingColor: string;
      scaleToFit: boolean;
      alignMode: "center" | "start" | "end";
      padding: number;
    }
  ) => Promise<void>;
}

export default function MergePanel({
  editingImageIdx,
  scrapedImages,
  isMerging,
  onMerge,
}: MergePanelProps) {
  const [mergeCount, setMergeCount] = useState<number>(1);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [layout, setLayout] = useState<"vertical" | "horizontal">("vertical");
  const [spacing, setSpacing] = useState<number>(0);
  const [spacingColor, setSpacingColor] = useState<string>("white");
  const [padding, setPadding] = useState<number>(0);
  const [scaleToFit, setScaleToFit] = useState<boolean>(true);
  const [alignMode, setAlignMode] = useState<"center" | "start" | "end">(
    "center"
  );

  const maxNext = scrapedImages.length - 1 - editingImageIdx;
  const maxPrev = editingImageIdx;
  const maxMergeable = direction === "next" ? maxNext : maxPrev;
  const canMerge = maxMergeable > 0;

  // Build a preview list of which image indices will be merged
  const previewIndices: number[] = [];
  if (direction === "next") {
    for (
      let i = editingImageIdx;
      i <= editingImageIdx + mergeCount && i < scrapedImages.length;
      i++
    ) {
      previewIndices.push(i);
    }
  } else {
    const startIdx = Math.max(0, editingImageIdx - mergeCount);
    for (let i = startIdx; i <= editingImageIdx; i++) {
      previewIndices.push(i);
    }
  }

  const increment = () =>
    setMergeCount((v) => Math.min(v + 1, Math.min(maxMergeable, 9)));
  const decrement = () => setMergeCount((v) => Math.max(1, v - 1));

  // When direction changes, make sure count doesn't exceed new max
  const handleDirectionChange = (newDir: "next" | "prev") => {
    setDirection(newDir);
    const newMax = newDir === "next" ? maxNext : maxPrev;
    if (mergeCount > newMax) {
      setMergeCount(Math.max(1, newMax));
    }
  };

  return (
    <div className="space-y-4 font-sans text-left w-full">
      {/* ── Header ── */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/30 text-teal-400">
            <Link2 className="h-4 w-4" />
          </div>
          <span className="text-xs uppercase font-mono font-bold text-white tracking-wider">
            Panel Stitching
          </span>
        </div>
      </div>

      {/* ── Configuration Options ── */}
      <MergePanelOptions
        direction={direction}
        setDirection={setDirection}
        layout={layout}
        setLayout={setLayout}
        spacing={spacing}
        setSpacing={setSpacing}
        spacingColor={spacingColor}
        setSpacingColor={setSpacingColor}
        padding={padding}
        setPadding={setPadding}
        scaleToFit={scaleToFit}
        setScaleToFit={setScaleToFit}
        alignMode={alignMode}
        setAlignMode={setAlignMode}
        handleDirectionChange={handleDirectionChange}
      />

      {!canMerge ? (
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-4 text-center space-y-2">
          <ImageIcon className="h-6 w-6 text-neutral-600 mx-auto" />
          <p className="text-[10px] text-neutral-500 font-mono">
            {direction === "next"
              ? "This is the last image in the deck. No next images available to merge."
              : "This is the first image in the deck. No previous images available to merge."}
          </p>
        </div>
      ) : (
        <>
          {/* ── Number selector ── */}
          <div className="bg-black/30 border border-white/6 rounded-2xl p-4 space-y-3">
            <span className="text-[9px] font-bold text-neutral-600 uppercase font-mono tracking-widest block">
              Images to merge with
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={decrement}
                disabled={mergeCount <= 1 || isMerging}
                className="p-2 rounded-xl bg-black/40 border border-white/6 hover:bg-teal-500/10 hover:border-teal-500/30 text-neutral-500 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90"
              >
                <ChevronDown className="h-4 w-4" />
              </button>

              <div className="flex-1 flex flex-col items-center gap-0.5">
                <span
                  className="text-5xl font-black font-mono text-white tabular-nums leading-none"
                  style={{ textShadow: "0 0 30px rgba(45,212,191,0.4)" }}
                >
                  {mergeCount}
                </span>
                <span className="text-[9px] font-mono text-neutral-600">
                  {direction === "next" ? "next image" : "previous image"}
                  {mergeCount !== 1 ? "s" : ""}
                </span>
              </div>

              <button
                type="button"
                onClick={increment}
                disabled={mergeCount >= Math.min(maxMergeable, 9) || isMerging}
                className="p-2 rounded-xl bg-black/40 border border-white/6 hover:bg-teal-500/10 hover:border-teal-500/30 text-neutral-500 hover:text-teal-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer active:scale-90"
              >
                <ChevronUp className="h-4 w-4" />
              </button>
            </div>

            <div className="flex gap-1.5 flex-wrap">
              {[1, 2, 3, 4, 5]
                .filter((n) => n <= maxMergeable)
                .map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setMergeCount(n)}
                    className={`px-3 py-1 rounded-lg border text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95 ${
                      mergeCount === n
                        ? "bg-[#3B82F6] border-[#60A5FA]/40 text-white font-bold"
                        : "bg-[#2A2A2A] border-[#2F2F2F] text-neutral-400 hover:text-white hover:border-[#3B82F6]"
                    }`}
                  >
                    +{n}
                  </button>
                ))}

              {maxMergeable > 5 && mergeCount !== maxMergeable && (
                <button
                  type="button"
                  onClick={() => setMergeCount(maxMergeable)}
                  className="px-3 py-1 rounded-lg border text-[10px] font-bold font-mono transition-all cursor-pointer active:scale-95 bg-[#2A2A2A] border-[#2F2F2F] hover:border-[#3B82F6] hover:bg-[#3B82F6] text-white"
                >
                  Merge All Remaining
                </button>
              )}
            </div>
          </div>

          {/* ── Preview list of frames to merge ── */}
          <MergePanelList
            previewIndices={previewIndices}
            editingImageIdx={editingImageIdx}
            scrapedImages={scrapedImages}
            layout={layout}
          />

          {/* ── Result summary ── */}
          <div className="flex items-center gap-2.5 bg-[#121212] border border-[#2F2F2F] rounded-xl px-3 py-2.5">
            <Layers className="h-3.5 w-3.5 text-[#3B82F6] flex-shrink-0" />
            <p className="text-[10px] text-neutral-300 font-sans leading-snug">
              <strong>{previewIndices.length} images</strong> →{" "}
              <strong>1 merged panel</strong> (frames{" "}
              <span className="font-mono text-[#3B82F6]">
                #{previewIndices[0] + 1}–#
                {previewIndices[previewIndices.length - 1] + 1}
              </span>{" "}
              will be removed from the deck)
            </p>
          </div>

          {/* ── Merge button ── */}
          <button
            type="button"
            onClick={() => {
              console.log(
                `[MergePanel] Executing merge for ${mergeCount} images in direction: ${direction}`
              );
              onMerge(mergeCount, {
                direction,
                layout,
                spacing,
                spacingColor,
                scaleToFit,
                alignMode,
                padding,
              });
            }}
            disabled={isMerging || !canMerge}
            className="w-full flex items-center justify-center gap-2.5 py-3 rounded-xl bg-[#2A2A2A] hover:bg-[#3B82F6] border border-[#2F2F2F] hover:border-[#60A5FA]/40 text-white text-xs font-bold font-sans transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 shadow-sm"
          >
            {isMerging ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-white" />
                <span>Merging Frames…</span>
              </>
            ) : (
              <>
                <Link2 className="h-4 w-4 text-white" />
                <span>
                  Merge Frame #{editingImageIdx + 1} +{" "}
                  {direction === "next" ? "Next" : "Prev"} {mergeCount}
                </span>
              </>
            )}
          </button>
        </>
      )}
    </div>
  );
}
