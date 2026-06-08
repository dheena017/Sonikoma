import React from "react";
import PanelCard from "./PanelCard";

interface LiveScraperGridProps {
  scrapedImages: string[];
  selectedScraped: string[];
  isBatchCropping: boolean;
  croppingImgUrl: string | null;
  bubbleCroppingImgUrl: string | null;
  mergingIndices: number[];
  handleMergeWithNext: (idx: number) => void;
  setEditingImageIdx: (idx: number | null) => void;
  openEditingImageIdx?: (idx: number | null) => void;
  setEditCropTop: (v: number) => void;
  setEditCropBottom: (v: number) => void;
  setEditCropLeft: (v: number) => void;
  setEditCropRight: (v: number) => void;
  setEditAutoTrim: (v: boolean) => void;
  setScrapedImages: React.Dispatch<React.SetStateAction<string[]>>;
  setSelectedScraped: React.Dispatch<React.SetStateAction<string[]>>;
  setConsoleLogs: React.Dispatch<React.SetStateAction<string[]>>;
  addPanelsWithAutoAnalysis: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
}

export default function LiveScraperGrid({
  scrapedImages,
  selectedScraped,
  isBatchCropping,
  croppingImgUrl,
  bubbleCroppingImgUrl,
  mergingIndices,
  handleMergeWithNext,
  setEditingImageIdx,
  openEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addPanelsWithAutoAnalysis,
}: LiveScraperGridProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 pt-1.5 scrollbar-thin">
      {scrapedImages.map((imgUrl, idx) => {
        const isSelected = selectedScraped.includes(imgUrl);
        return (
          <PanelCard
            key={`${imgUrl}-${idx}`}
            imgUrl={imgUrl}
            idx={idx}
            isSelected={isSelected}
            isBatchCropping={isBatchCropping}
            croppingImgUrl={croppingImgUrl}
            bubbleCroppingImgUrl={bubbleCroppingImgUrl}
            scrapedImages={scrapedImages}
            mergingIndices={mergingIndices}
            handleMergeWithNext={handleMergeWithNext}
            setEditingImageIdx={setEditingImageIdx}
            openEditingImageIdx={openEditingImageIdx}
            setEditCropTop={setEditCropTop}
            setEditCropBottom={setEditCropBottom}
            setEditCropLeft={setEditCropLeft}
            setEditCropRight={setEditCropRight}
            setEditAutoTrim={setEditAutoTrim}
            setScrapedImages={setScrapedImages}
            setSelectedScraped={setSelectedScraped}
            setConsoleLogs={setConsoleLogs}
            addPanelsWithAutoAnalysis={addPanelsWithAutoAnalysis}
          />
        );
      })}
    </div>
  );
}
