import React, { useState } from "react";
import {
  Image as ImageIcon,
  RefreshCw,
  Trash2,
  Download,
  Plus,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { LiveScraperDeckProps } from "./types";
import PanelCard from "./PanelCard";
import ScraperControls from "./ScraperControls";

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
  const [isZipping, setIsZipping] = useState(false);
  const activeFetch = fetchWithInterceptor || fetch;

  const handleDownloadZip = async () => {
    const toDownload = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (toDownload.length === 0) return;

    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("webtoon_frames");
      if (!folder) {
        setIsZipping(false);
        return;
      }

      for (let i = 0; i < toDownload.length; i++) {
        try {
          const url = toDownload[i];
          const res = await activeFetch(url);
          const blob = await res.blob();
          const filename = `webtoon_frame_${String(i + 1).padStart(3, "0")}.png`;
          folder.file(filename, blob);
        } catch (err) {
          console.error("Download failed for:", toDownload[i], err);
        }
      }

      const blobContent = await zip.generateAsync({ type: "blob" });
      saveAs(blobContent, "webtoon_frames.zip");
      setConsoleLogs((prev) => [
        `[GUI] Successfully generated zip for ${toDownload.length} images`,
        ...prev,
      ]);
    } catch (err) {
      console.error("Zip generation failed:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedScraped.length === 0) return;
    setScrapedImages((prev) => prev.filter((img) => !selectedScraped.includes(img)));
    setConsoleLogs((prev) => [
      `[GUI] Removed ${selectedScraped.length} images`,
      ...prev,
    ]);
    console.log(`[GUI] Deleted ${selectedScraped.length} selected image(s) from the deck.`);
    addNotification(`Deleted ${selectedScraped.length} selected image(s) from the deck.`, "success");
    setSelectedScraped([]);
  };

  const handleAddToCanvas = () => {
    if (selectedScraped.length === 0) return;
    addPanelsWithAutoAnalysis(selectedScraped);
    console.log(`[GUI] Adding ${selectedScraped.length} selected image(s) to storyboard.`);
    setSelectedScraped([]);
  };

  if (!isScraping && scrapedImages.length === 0) return null;

  return (
    <div
      id="scraped_strips_deck"
      className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-4 sm:p-5 lg:p-6 backdrop-blur-md space-y-4 shadow-sm"
    >
      <div className="flex flex-row items-center justify-between gap-3 border-b border-neutral-800/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/15 text-purple-400">
            <ImageIcon className="h-5 w-5" />
          </div>
          <div className="ml-2 flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-sm text-white truncate">Live Asset Extraction</h3>
            {scrapedImages.length > 0 && (
              <span className="text-[10px] px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-inner font-mono uppercase tracking-wider">
                {scrapedImages.length} Frames
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto self-end lg:self-auto ml-auto lg:ml-0">
          <button
            type="button"
            onClick={handleDownloadZip}
            disabled={scrapedImages.length === 0 || isZipping}
            className="text-[10px] font-mono border border-neutral-800/70 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-300 hover:text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isZipping ? "Downloading..." : "Download"}</span>
          </button>
          <button
            type="button"
            onClick={handleDeleteSelected}
            disabled={selectedScraped.length === 0}
            className="text-[10px] font-mono border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>
          <button
            type="button"
            onClick={handleAddToCanvas}
            disabled={selectedScraped.length === 0}
            className="text-[10px] font-mono rounded-lg px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/30 flex items-center gap-1.5 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/35 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add to Canvas</span>
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
                  addNotification={addNotification}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
