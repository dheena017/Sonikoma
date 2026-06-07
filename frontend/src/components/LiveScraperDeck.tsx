import React from "react";
import { Image as ImageIcon, RefreshCw, Trash2 } from "lucide-react";
import { LiveScraperDeckProps } from "./scraper/types";
import PanelCard from "./scraper/PanelCard";
import ScraperControls from "./scraper/ScraperControls";

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
  const activeFetch = fetchWithInterceptor || fetch;

  if (!isScraping && scrapedImages.length === 0) return null;

  return (
    <div
      id="scraped_strips_deck"
      className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-6 backdrop-blur-md space-y-4 shadow-sm"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800/60 pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-purple-400">
            <ImageIcon className="h-4 w-4" />
            <span className="text-[10px] font-semibold tracking-wider uppercase font-mono">
              Separated Panels
            </span>
          </div>
          <h3 className="font-bold text-sm text-white">Live Asset Extraction</h3>
        </div>
        <div className="flex items-center gap-3">
          {scrapedImages.length > 0 && (
            <span className="text-[9px] px-2.5 py-1 font-mono tracking-wider bg-purple-950/50 text-purple-300 rounded-full border border-purple-800/50 shadow-inner">
              {scrapedImages.length} Frames
            </span>
          )}
          <button
            onClick={() => {
              setScrapedImages([]);
              setSelectedScraped([]);
              setConsoleLogs((prev) => [
                "[GUI] Cleared all assets from the deck",
                ...prev,
              ]);
            }}
            className="flex items-center gap-1 text-[9px] font-mono text-neutral-500 hover:text-red-400 bg-neutral-900/50 hover:bg-red-950/20 px-2 py-1 rounded-full border border-neutral-800 transition-colors"
          >
            <Trash2 className="h-3 w-3" />
            Clear All
          </button>
        </div>
      </div>

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
        </div>
      )}
    </div>
  );
}
