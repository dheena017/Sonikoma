import React from "react";
import { RefreshCw } from "lucide-react";
import { LiveScraperDeckProps } from "./scraper/types";
import ScraperControls from "./scraper/ScraperControls";
import LiveScraperHeader from "./scraper/LiveScraperHeader";
import LiveScraperGrid from "./scraper/LiveScraperGrid";
import { useLiveScraperActions } from "../hooks/useLiveScraperActions";

export default function LiveScraperDeck({
  scrapedImages,
  isScraping,
  selectedScraped,
  setSelectedScraped,
  setScrapedImages,
  mergingIndices,
  setConsoleLogs,
  panels,
  setPanels,
  currentPanelIndex,
  handleMergeWithNext,
  setEditingImageIdx,
  setEditCropTop,
  setEditCropBottom,
  setEditCropLeft,
  setEditCropRight,
  setEditAutoTrim,
  addNotification,
  fetchWithInterceptor,
  setErrorPopup,
  openEditingImageIdx,
  // Bubble Cleaner props from App.tsx
  showBubbleModal,
  setShowBubbleModal,
  isCleaningBubbles,
  cleanProgress,
  bubbleCroppingImgUrl,
  // Auto Crop props from App.tsx
  showAutoCropModal,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  croppingImgUrl,
  addPanelsWithAutoAnalysis,
}: LiveScraperDeckProps) {
  
  const {
    isZipping,
    handleDownloadZip,
    handleDeleteSelected,
    handleAddToCanvas,
  } = useLiveScraperActions({
    scrapedImages,
    selectedScraped,
    setSelectedScraped,
    setScrapedImages,
    setConsoleLogs,
    addPanelsWithAutoAnalysis,
    fetchWithInterceptor,
  });

  if (!isScraping && scrapedImages.length === 0) return null;

  return (
    <div
      id="scraped_strips_deck"
      className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-6 backdrop-blur-md space-y-4 shadow-sm"
    >
      <LiveScraperHeader
        imagesCount={scrapedImages.length}
        selectedCount={selectedScraped.length}
        isZipping={isZipping}
        handleDownloadZip={handleDownloadZip}
        handleDeleteSelected={handleDeleteSelected}
        handleAddToCanvas={handleAddToCanvas}
      />

      {isScraping ? (
        <div className="flex flex-col items-center justify-center py-8 space-y-3">
          <RefreshCw className="h-6 w-6 text-purple-500 animate-spin" />
          <p className="text-xs text-neutral-400 font-mono">
            Analyzing Webtoon viewer page, extraction in progress...
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Scraper Controls Toolbar */}
          <ScraperControls
            scrapedImages={scrapedImages}
            selectedScraped={selectedScraped}
            setSelectedScraped={setSelectedScraped}
            setScrapedImages={setScrapedImages}
            setConsoleLogs={setConsoleLogs}
            addNotification={addNotification}
            setShowBubbleModal={setShowBubbleModal}
            isCleaningBubbles={isCleaningBubbles}
            cleanProgress={cleanProgress}
            addPanelsWithAutoAnalysis={addPanelsWithAutoAnalysis}
            showAutoCropModal={showAutoCropModal}
            setShowAutoCropModal={setShowAutoCropModal}
            isBatchCropping={isBatchCropping}
            batchProgress={batchProgress}
            fetchWithInterceptor={fetchWithInterceptor}
          />

          {/* Grid list of extracted cards */}
          <LiveScraperGrid
            scrapedImages={scrapedImages}
            selectedScraped={selectedScraped}
            isBatchCropping={isBatchCropping}
            croppingImgUrl={croppingImgUrl}
            bubbleCroppingImgUrl={bubbleCroppingImgUrl}
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
        </div>
      )}
    </div>
  );
}
