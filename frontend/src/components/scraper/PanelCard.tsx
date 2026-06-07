import React from "react";
import { RefreshCw, Check, Scissors, Trash, RotateCw, FlipHorizontal, Undo2 } from "lucide-react";
import { ScraperDeckProps } from "./types";

interface PanelCardProps
  extends Pick<
    ScraperDeckProps,
    | "setEditingImageIdx"
    | "openEditingImageIdx"
    | "setEditCropTop"
    | "setEditCropBottom"
    | "setEditCropLeft"
    | "setEditCropRight"
    | "setEditAutoTrim"
    | "setScrapedImages"
    | "setSelectedScraped"
    | "setConsoleLogs"
    | "mergingIndices"
    | "handleMergeWithNext"
    | "scrapedImages"
    | "bubbleCroppingImgUrl"
  > {
  imgUrl: string;
  idx: number;
  isSelected: boolean;
  isBatchCropping: boolean;
  croppingImgUrl: string | null;
  addPanelsWithAutoAnalysis: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
  key?: React.Key;
}

export default function PanelCard({
  imgUrl,
  idx,
  isSelected,
  isBatchCropping,
  croppingImgUrl,
  bubbleCroppingImgUrl,
  scrapedImages,
  mergingIndices,
  handleMergeWithNext,
  setEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  openEditingImageIdx,
  addPanelsWithAutoAnalysis,
}: PanelCardProps) {
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const isProcessing =
    croppingImgUrl === imgUrl || bubbleCroppingImgUrl === imgUrl || isEditing;

  const handleRotateClockwise = async () => {
    setIsEditing(true);
    setConsoleLogs?.((prev) => [
      `[Image Editor] Rotating Panel #${idx + 1} 90° clockwise...`,
      ...prev,
    ]);
    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imgUrl,
          rotate: 90,
          autoTrim: false,
        }),
      });
      if (!response.ok) throw new Error(`Rotate failed with status ${response.status}`);
      const data = await response.json();
      
      setScrapedImages?.((prev) => prev.map((img, i) => (i === idx ? data.url : img)));
      setSelectedScraped?.((prev) => prev.map((img) => (img === imgUrl ? data.url : img)));
      setConsoleLogs?.((prev) => [
        `[Image Editor] Successfully rotated Panel #${idx + 1}!`,
        ...prev,
      ]);
    } catch (err: any) {
      console.error(err);
      setConsoleLogs?.((prev) => [`[Image Editor Error] Rotation failed: ${err.message}`, ...prev]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleFlipHorizontal = async () => {
    setIsEditing(true);
    setConsoleLogs?.((prev) => [
      `[Image Editor] Flipping Panel #${idx + 1} horizontally...`,
      ...prev,
    ]);
    try {
      const response = await fetch("/api/edit-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: imgUrl,
          flipHorizontal: true,
          autoTrim: false,
        }),
      });
      if (!response.ok) throw new Error(`Flip failed with status ${response.status}`);
      const data = await response.json();

      setScrapedImages?.((prev) => prev.map((img, i) => (i === idx ? data.url : img)));
      setSelectedScraped?.((prev) => prev.map((img) => (img === imgUrl ? data.url : img)));
      setConsoleLogs?.((prev) => [
        `[Image Editor] Successfully flipped Panel #${idx + 1} horizontally!`,
        ...prev,
      ]);
    } catch (err: any) {
      console.error(err);
      setConsoleLogs?.((prev) => [`[Image Editor Error] Flipping failed: ${err.message}`, ...prev]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = async () => {
    setIsEditing(true);
    setConsoleLogs?.((prev) => [
      `[Image Editor] Restoring previous state for Panel #${idx + 1}...`,
      ...prev,
    ]);
    try {
      const response = await fetch("/api/undo-crop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: imgUrl }),
      });
      if (!response.ok) throw new Error(`Undo failed with status ${response.status}`);
      const data = await response.json();

      if (data.success && data.previous_url) {
        setScrapedImages?.((prev) => prev.map((img, i) => (i === idx ? data.previous_url : img)));
        setSelectedScraped?.((prev) => prev.map((img) => (img === imgUrl ? data.previous_url : img)));
        setConsoleLogs?.((prev) => [
          `[Image Editor] Successfully restored previous state for Panel #${idx + 1}!`,
          ...prev,
        ]);
      } else {
        throw new Error(data.error || "No previous state found");
      }
    } catch (err: any) {
      console.error(err);
      setConsoleLogs?.((prev) => [`[Image Editor Error] Undo failed: ${err.message}`, ...prev]);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={() => {
        if (setSelectedScraped) {
          setSelectedScraped((prev) => {
            if (isSelected) {
              return prev.filter((img) => img !== imgUrl);
            } else {
              return [...prev, imgUrl];
            }
          });
        }
      }}
      className={`group relative w-[150px] shrink-0 rounded-2xl border p-2.5 space-y-2.5 transition-all text-center cursor-pointer select-none ${
        isSelected
          ? "border-purple-500 bg-purple-950/20 shadow-lg shadow-purple-900/40"
          : "border-neutral-800/80 bg-neutral-950 hover:border-purple-500/60"
      }`}
    >
      {/* Image thumbnail */}
      <div className="relative h-28 rounded-lg overflow-hidden bg-neutral-900 flex items-center justify-center">
        <img
          src={imgUrl}
          alt=""
          className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-300 ${
            isProcessing ? "opacity-30 blur-[4px]" : ""
          }`}
          referrerPolicy="no-referrer"
        />

        {isProcessing && (
          <div
            className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-black/85 backdrop-blur-xs animate-fadeIn p-2 text-center select-none"
            id={`loading_overlay_${idx}`}
          >
            <RefreshCw className="h-6 w-6 text-purple-400 animate-spin drop-shadow-md mb-2" />
            <span className="text-[9px] font-mono font-bold tracking-wider text-purple-300 uppercase animate-pulse">
              {isBatchCropping
                ? "Auto-Cropping"
                : bubbleCroppingImgUrl === imgUrl
                ? "Cleaning Bubbles"
                : "Processing"}
            </span>
            <span className="text-[8px] font-sans text-neutral-400 mt-1">
              Processing panel...
            </span>
          </div>
        )}

        {/* Index badge */}
        <div className="absolute top-1 left-1 bg-black/75 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold text-purple-400">
          #{idx + 1}
        </div>

        {/* Selection indicator */}
        <div
          className={`absolute top-1 right-1 rounded-full p-0.5 border transition-all ${
            isSelected
              ? "bg-purple-600 border-purple-400 text-white opacity-100"
              : "bg-black/60 border-neutral-700 text-transparent opacity-0 group-hover:opacity-100 hover:text-neutral-300"
          }`}
        >
          <Check className="h-2.5 w-2.5 font-bold text-white" />
        </div>

        {/* Quick action controls on hover */}
        {!isProcessing && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute bottom-1.5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1.5 bg-black/90 border border-neutral-800/90 px-2 py-0.5 rounded-full z-30 pointer-events-auto shadow-md"
          >
            <button
              onClick={handleRotateClockwise}
              title="Rotate 90° Clockwise"
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 rounded-full transition-colors cursor-pointer"
            >
              <RotateCw className="h-3 w-3" />
            </button>
            <button
              onClick={handleFlipHorizontal}
              title="Flip Horizontally"
              className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 rounded-full transition-colors cursor-pointer"
            >
              <FlipHorizontal className="h-3 w-3" />
            </button>
            {imgUrl.includes("/cached/") && (
              <button
                onClick={handleUndo}
                title="Undo Last Edit"
                className="p-1 hover:bg-neutral-800 text-neutral-400 hover:text-purple-400 rounded-full transition-colors cursor-pointer"
              >
                <Undo2 className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={() => addPanelsWithAutoAnalysis([imgUrl])}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white text-[9px] py-1 rounded font-mono transition-colors font-medium border border-purple-500/30 cursor-pointer text-center flex items-center justify-center gap-1"
        >
          <span>+ Insert to Storyboard</span>
        </button>

        {idx < scrapedImages.length - 1 && (
          <button
            onClick={() => handleMergeWithNext(idx)}
            disabled={mergingIndices.includes(idx)}
            className="w-full bg-indigo-950/40 hover:bg-indigo-900 border border-indigo-900/60 text-indigo-300 hover:text-indigo-100 text-[9px] py-1 rounded font-mono transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {mergingIndices.includes(idx) ? (
              <RefreshCw className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <span className="text-[10px] font-bold">🔗</span>
            )}
            <span>The Mearge</span>
          </button>
        )}

        <div className="flex gap-1 justify-between items-center bg-transparent w-full">
          <button
            onClick={() => {
              if (openEditingImageIdx) {
                openEditingImageIdx(idx);
              } else {
                setEditingImageIdx(idx);
              }
            }}
            title="Crop & Trim White Background"
            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-purple-950 hover:text-purple-400 text-neutral-400 py-1 rounded border border-neutral-800 hover:border-purple-900/60 transition-colors cursor-pointer text-[10px] font-mono"
          >
            <Scissors className="h-3 w-3" />
            <span>Edit</span>
          </button>

          <button
            onClick={() => {
              setScrapedImages((prev) => prev.filter((_, i) => i !== idx));
              setSelectedScraped((prev) => prev.filter((img) => img !== imgUrl));
              setConsoleLogs((prev) => [
                `[GUI] Deleted extracted frame #${idx + 1} from deck.`,
                ...prev,
              ]);
            }}
            title="Remove element from deck"
            className="flex-1 flex items-center justify-center gap-1 bg-neutral-900 hover:bg-red-950 hover:text-red-400 text-neutral-500 py-1 rounded border border-neutral-800 hover:border-red-900/60 transition-colors cursor-pointer text-[10px] font-mono"
          >
            <Trash className="h-3 w-3" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
