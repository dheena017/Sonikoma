import React from "react";
import { ScraperDeckProps } from "./types.js";
import * as api from "../../api/index.js";
import { PanelCardThumbnail } from "./PanelCardThumbnail.js";
import { PanelCardControls } from "./PanelCardControls.js";
import { PanelCardActions } from "./PanelCardActions.js";

interface PanelCardProps
  extends Pick<
    ScraperDeckProps,
    | "setEditingImageIdx"
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
  openEditingImageIdx?: (idx: number | null) => void;
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
  addPanelsToStoryboard,
  addNotification,
  onCardClick,
}: PanelCardProps) {
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const isProcessing =
    croppingImgUrl === imgUrl || bubbleCroppingImgUrl === imgUrl || isEditing;

  const handleRotateClockwise = async () => {
    console.log(`[PanelCard] Rotating image #${idx + 1} clockwise`);
    setIsEditing(true);
    setConsoleLogs?.((prev: any) => [
      `[Image Editor] Rotating Panel #${idx + 1} 90° clockwise...`,
      ...prev,
    ]);
    try {
      const data = await api.editImage(fetch, {
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
      const data = await api.editImage(fetch, {
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
      const data = await api.undoCrop(fetch, { url: imgUrl });

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
      onDoubleClick={(e) => {
        e.stopPropagation();
        window.history.pushState({}, "", `/editor/adjust?idx=${idx}`);
        window.dispatchEvent(new Event("popstate"));
      }}
      className={[
        "group relative w-[140px] sm:w-[156px] shrink-0 rounded-2xl border p-2 space-y-2 transition-all duration-200 text-center cursor-pointer select-none",
        isSelected
          ? "border-purple-500/80 bg-purple-950/25 shadow-[0_0_18px_2px_rgba(168,85,247,0.22)] ring-1 ring-purple-500/30 scale-[1.02]"
          : "border-neutral-800/70 bg-neutral-950 hover:border-purple-500/50 hover:shadow-[0_0_12px_1px_rgba(168,85,247,0.10)] hover:scale-[1.01]",
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

      <PanelCardControls
        imgUrl={imgUrl}
        idx={idx}
        scrapedImages={scrapedImages}
        mergingIndices={mergingIndices}
        handleMergeWithNext={handleMergeWithNext}
        addPanelsToStoryboard={addPanelsToStoryboard}
      />

      <PanelCardActions
        idx={idx}
        imgUrl={imgUrl}
        openEditingImageIdx={openEditingImageIdx}
        setEditingImageIdx={setEditingImageIdx}
        setScrapedImages={setScrapedImages}
        setSelectedScraped={setSelectedScraped}
        setConsoleLogs={setConsoleLogs}
        addNotification={addNotification}
      />
    </div>
  );
}

export default React.memo(PanelCard);
