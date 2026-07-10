import React from "react";
import { ScraperDeckProps } from "./types";
import * as api from "@/api";
import { PanelCardThumbnail } from "./PanelCardThumbnail";
import { PanelCardControls } from "./PanelCardControls";
import { PanelCardActions } from "./PanelCardActions";

// 1. Cleaned up all unused Editor-related props
interface PanelCardProps
  extends Pick<
    ScraperDeckProps,
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
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  addNotification: (
    message: string,
    type: "error" | "success" | "info" | "warning"
  ) => void;
  /** Called when the card is clicked. Parent handles selection + shift-range logic. */
  onCardClick: (idx: number, imgUrl: string, shiftKey: boolean) => void;
  key?: React.Key;
}

function PanelCard({
  imgUrl,
  idx,
  isSelected,
  isBatchCropping,
  croppingImgUrl,
  bubbleCroppingImgUrl,
  scrapedImages,
  mergingIndices,
  handleMergeWithNext,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addPanelsToStoryboard,
  addNotification,
  onCardClick,
}: PanelCardProps) {
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const isProcessing =
    croppingImgUrl === imgUrl || bubbleCroppingImgUrl === imgUrl || isEditing;

  const [dimensions, setDimensions] = React.useState<{ width: number; height: number } | null>(null);

  React.useEffect(() => {
    if (!imgUrl) return;
    const img = new Image();
    img.src = imgUrl;
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [imgUrl]);

  const getAspectRatioLabel = () => {
    if (!dimensions) return null;
    const { width, height } = dimensions;
    const ratio = width / height;
    if (ratio > 1.25) return "Landscape";
    if (ratio < 0.28) return "Too Tall Strip";
    if (ratio < 0.6) return "Tall Strip";
    return "Portrait";
  };

  const handleRotateClockwise = async () => {
    console.log(`[PanelCard] Rotating image #${idx + 1} clockwise`);
    setIsEditing(true);
    setConsoleLogs?.((prev: any) => [
      `[Image Editor] Rotating Panel #${idx + 1} 90° clockwise...`,
      ...prev,
    ]);
    try {
      const data = await api.submitImageEdits(fetch, {
        url: imgUrl,
        rotate: 90,
        autoTrim: false,
      });

      setScrapedImages?.((prev: any[]) =>
        prev.map((img: any, i: number) => (i === idx ? data.url : img))
      );
      setSelectedScraped?.((prev: any[]) =>
        prev.map((img: string) => (img === imgUrl ? data.url : img))
      );
      setConsoleLogs?.((prev: any) => [
        `[Image Editor] Successfully rotated Panel #${idx + 1}!`,
        ...prev,
      ]);
    } catch (err: any) {
      console.error(err);
      setConsoleLogs?.((prev: any) => [
        `[Image Editor Error] Rotation failed: ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleFlipHorizontal = async () => {
    console.log(`[PanelCard] Flipping image #${idx + 1} horizontally`);
    setIsEditing(true);
    setConsoleLogs?.((prev: any) => [
      `[Image Editor] Flipping Panel #${idx + 1} horizontally...`,
      ...prev,
    ]);
    try {
      const data = await api.submitImageEdits(fetch, {
        url: imgUrl,
        flipHorizontal: true,
        autoTrim: false,
      });

      setScrapedImages?.((prev: any[]) =>
        prev.map((img: any, i: number) => (i === idx ? data.url : img))
      );
      setSelectedScraped?.((prev: any[]) =>
        prev.map((img: string) => (img === imgUrl ? data.url : img))
      );
      setConsoleLogs?.((prev: any) => [
        `[Image Editor] Successfully flipped Panel #${idx + 1} horizontally!`,
        ...prev,
      ]);
    } catch (err: any) {
      console.error(err);
      setConsoleLogs?.((prev: any) => [
        `[Image Editor Error] Flipping failed: ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  const handleUndo = async () => {
    console.log(`[PanelCard] Undoing last operation for image #${idx + 1}`);
    setIsEditing(true);
    setConsoleLogs?.((prev: any) => [
      `[Image Editor] Restoring previous state for Panel #${idx + 1}...`,
      ...prev,
    ]);
    try {
      const data = await api.undoImageEdit(fetch, { url: imgUrl });

      if (data.success && data.previous_url) {
        setScrapedImages?.((prev: any[]) =>
          prev.map((img: any, i: number) =>
            i === idx ? data.previous_url : img
          )
        );
        setSelectedScraped?.((prev: any[]) =>
          prev.map((img: string) => (img === imgUrl ? data.previous_url : img))
        );
        setConsoleLogs?.((prev: any) => [
          `[Image Editor] Successfully restored previous state for Panel #${
            idx + 1
          }!`,
          ...prev,
        ]);
      } else {
        throw new Error(data.error || "No previous state found");
      }
    } catch (err: any) {
      console.error(err);
      setConsoleLogs?.((prev: any) => [
        `[Image Editor Error] Undo failed: ${err.message}`,
        ...prev,
      ]);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div
      onClick={(e) => onCardClick(idx, imgUrl, e.shiftKey)}
      // 2. REMOVED the onDoubleClick handler entirely so users can't accidentally trigger the crash
      className={[
        "group relative w-[260px] sm:w-[280px] shrink-0 rounded-2xl border p-4 space-y-4 transition-all duration-300 ease-out text-center cursor-pointer select-none",
        isSelected
          ? "border-purple-500 bg-purple-950/15 shadow-[0_10px_30px_-5px_rgba(168,85,247,0.3)] ring-1 ring-purple-500/20 scale-[1.02]"
          : "border-neutral-800/60 bg-neutral-950 hover:border-purple-500/50 hover:shadow-[0_15px_35px_-8px_rgba(168,85,247,0.15)] hover:scale-[1.03] hover:-translate-y-1.5",
      ].join(" ")}
    >
      <PanelCardThumbnail
        imgUrl={imgUrl}
        idx={idx}
        isSelected={isSelected}
        isProcessing={isProcessing}
        isBatchCropping={isBatchCropping}
        bubbleCroppingImgUrl={bubbleCroppingImgUrl}
        handleRotateClockwise={handleRotateClockwise}
        handleFlipHorizontal={handleFlipHorizontal}
        handleUndo={handleUndo}
      />

      {/* Dynamic Resolution & Aspect Ratio Badges */}
      {dimensions && (
        <div className="flex items-center justify-between gap-2 px-1 text-[9px] font-mono select-none animate-in fade-in duration-300">
          <span className="text-neutral-500 font-bold bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
            {dimensions.width} × {dimensions.height} px
          </span>
          {getAspectRatioLabel() && (
            <span className={[
              "px-1.5 py-0.5 rounded font-bold border transition-all duration-300",
              getAspectRatioLabel() === "Too Tall Strip"
                ? "bg-rose-950/40 border-rose-800/40 text-rose-350 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse"
                : getAspectRatioLabel() === "Tall Strip"
                ? "bg-purple-950/40 border-purple-800/40 text-purple-300"
                : getAspectRatioLabel() === "Landscape"
                ? "bg-sky-950/40 border-sky-800/40 text-sky-300"
                : "bg-neutral-900 border-neutral-850 text-neutral-400"
            ].join(" ")}>
              {getAspectRatioLabel()}
            </span>
          )}
        </div>
      )}

      <PanelCardControls
        imgUrl={imgUrl}
        idx={idx}
        scrapedImages={scrapedImages}
        mergingIndices={mergingIndices}
        handleMergeWithNext={handleMergeWithNext}
        addPanelsToStoryboard={addPanelsToStoryboard}
      />

      {/* 3. PanelCardActions now only renders the Delete button (based on our previous step) */}
      <PanelCardActions
        idx={idx}
        imgUrl={imgUrl}
        setScrapedImages={setScrapedImages}
        setSelectedScraped={setSelectedScraped}
        setConsoleLogs={setConsoleLogs}
        addNotification={addNotification}
      />
    </div>
  );
}

export default React.memo(PanelCard);
