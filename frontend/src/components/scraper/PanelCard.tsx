import React from "react";
import { ScraperDeckProps } from "./types.js";
import { PanelCardThumbnail } from "./PanelCardThumbnail.js";
import { PanelCardControls } from "./PanelCardControls.js";
import { PanelCardActions } from "./PanelCardActions.js";

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
        addPanelsWithAutoAnalysis={addPanelsWithAutoAnalysis}
      />

      <PanelCardActions
        idx={idx}
        imgUrl={imgUrl}
        openEditingImageIdx={openEditingImageIdx}
        setEditingImageIdx={setEditingImageIdx}
        setScrapedImages={setScrapedImages}
        setSelectedScraped={setSelectedScraped}
        setConsoleLogs={setConsoleLogs}
      />
    </div>
  );
}
