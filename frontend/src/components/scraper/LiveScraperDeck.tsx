import React, { useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Image as ImageIcon,
  RefreshCw,
  Download,
  X,
  Trash2,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { LiveScraperDeckProps } from "./types";
import PanelCard from "./PanelCard.js";
import ScraperControls from "./ScraperControls.js";
import { FloatingSelectionBar } from "./FloatingSelectionBar.js";
import { parseWebtoonUrl, getSourceName } from "../../utils.js";

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
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  addPanelsToStoryboard,
  isDashboardOnly = true,
  seriesTitle = "",
  chapterNumber = "",
  chapterTitle = "",
  targetUrl = "",
  selectedSource = "",
}: LiveScraperDeckProps) {
  const [isZipping, setIsZipping] = useState(false);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [isBatchMerging, setIsBatchMerging] = useState(false);
  const activeFetch = fetchWithInterceptor || fetch;

  /** Core card click handler — supports shift-range selection */
  const handleCardClick = useCallback(
    (idx: number, imgUrl: string, shiftKey: boolean) => {
      if (shiftKey && lastSelectedIndex !== null) {
        // Build inclusive range and merge into the selection set
        const lo = Math.min(lastSelectedIndex, idx);
        const hi = Math.max(lastSelectedIndex, idx);
        const rangeUrls = scrapedImages.slice(lo, hi + 1);
        setSelectedScraped((prev) =>
          Array.from(new Set([...prev, ...rangeUrls]))
        );
        // Do NOT update lastSelectedIndex on shift-click — anchor stays put
      } else {
        setSelectedScraped((prev) =>
          prev.includes(imgUrl)
            ? prev.filter((u) => u !== imgUrl)
            : [...prev, imgUrl]
        );
        setLastSelectedIndex(idx);
      }
    },
    [lastSelectedIndex, scrapedImages, setSelectedScraped]
  );

  const makeSafeFilename = (name: string) => {
    const cleaned = name.replace(/[^\w\s-]/g, "");
    const replaced = cleaned.replace(/[-\s]+/g, "_");
    return replaced.replace(/^_+|_+$/g, ""); // trim underscores
  };

  const getZipFilename = () => {
    if (!targetUrl || !targetUrl.trim()) {
      return "webtoon_frames.zip";
    }

    try {
      const parsed = parseWebtoonUrl(targetUrl);
      const source = getSourceName(targetUrl);
      const parts: string[] = [];

      if (source && source.toLowerCase() !== "custom source") {
        parts.push(makeSafeFilename(source));
      }

      if (parsed.title && parsed.title.trim()) {
        parts.push(makeSafeFilename(parsed.title.trim()));
      }

      if (parsed.chapterNumber && parsed.chapterNumber.trim()) {
        parts.push(`Chapter_${makeSafeFilename(parsed.chapterNumber.trim())}`);
      }

      if (parsed.chapterTitle && parsed.chapterTitle.trim()) {
        parts.push(makeSafeFilename(parsed.chapterTitle.trim()));
      }

      if (parts.length > 0) {
        return `${parts.join("_")}.zip`;
      }
    } catch (err) {
      console.error(
        "[LiveScraperDeck] Failed to parse targetUrl for ZIP filename:",
        err
      );
    }

    return "webtoon_frames.zip";
  };

  const handleDownloadZip = async () => {
    const toDownload =
      selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (toDownload.length === 0) return;
    console.log(
      "[LiveScraperDeck] Starting ZIP download for",
      toDownload.length,
      "images"
    );

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
          const filename = `webtoon_frame_${String(i + 1).padStart(
            3,
            "0"
          )}.png`;
          folder.file(filename, blob);
        } catch (err) {
          console.error("Download failed for:", toDownload[i], err);
        }
      }

      const blobContent = await zip.generateAsync({ type: "blob" });
      const targetFilename = getZipFilename();
      saveAs(blobContent, targetFilename);
      setConsoleLogs((prev) => [
        `[GUI] Successfully generated zip named ${targetFilename} for ${toDownload.length} images`,
        ...prev,
      ]);
    } catch (err) {
      console.error("Zip generation failed:", err);
    } finally {
      setIsZipping(false);
    }
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const executeDeleteSelected = () => {
    setScrapedImages((prev) =>
      prev.filter((img) => !selectedScraped.includes(img))
    );
    setConsoleLogs((prev) => [
      `[GUI] Removed ${selectedScraped.length} images`,
      ...prev,
    ]);
    addNotification(
      `Deleted ${selectedScraped.length} selected image(s) from the deck.`,
      "success"
    );
    setSelectedScraped([]);
    setLastSelectedIndex(null);
  };

  const handleDeleteSelected = () => {
    if (selectedScraped.length === 0) return;
    setShowDeleteConfirm(true);
  };

  const handleAddToStoryboard = () => {
    if (selectedScraped.length === 0) return;
    addPanelsToStoryboard(selectedScraped);
    console.log(
      `[GUI] Adding ${selectedScraped.length} selected image(s) to storyboard.`
    );
    setSelectedScraped([]);
    setLastSelectedIndex(null);
  };

  const handleClearAll = () => {
    setSelectedScraped([]);
    setLastSelectedIndex(null);
  };

  const handleSelectAllToggle = () => {
    if (
      selectedScraped.length === scrapedImages.length &&
      scrapedImages.length > 0
    ) {
      setSelectedScraped([]);
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => ["[GUI] Cleared selections", ...prev]);
    } else {
      setSelectedScraped([...scrapedImages]);
      setConsoleLogs((prev) => [
        "[GUI] Selected all extracted frames",
        ...prev,
      ]);
    }
  };

  const handleBatchMergeSelected = async () => {
    if (selectedScraped.length < 2) {
      addNotification("Select at least 2 panels to stitch together", "info");
      return;
    }
    console.log(
      "[LiveScraperDeck] Starting batch vertical merge for",
      selectedScraped.length,
      "images"
    );
    setIsBatchMerging(true);
    setConsoleLogs((prev) => [
      `[Stitch Generator] Merging ${selectedScraped.length} selected images vertically...`,
      ...prev,
    ]);

    try {
      const response = await activeFetch("/api/stitch-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          urls: selectedScraped,
          layout: "vertical",
          spacing: 0,
          spacingColor: "white",
          scaleToFit: true,
          alignMode: "center",
          padding: 0,
        }),
      });

      if (!response.ok) throw new Error("Stitch failed: " + response.status);
      const data = await response.json();
      if (data.url) {
        const firstSelectedIdx = scrapedImages.findIndex((img) =>
          selectedScraped.includes(img)
        );
        setScrapedImages((prev) => {
          const filtered = prev.filter((img) => !selectedScraped.includes(img));
          filtered.splice(
            firstSelectedIdx === -1 ? 0 : firstSelectedIdx,
            0,
            data.url
          );
          return filtered;
        });
        setSelectedScraped([]);
        setLastSelectedIndex(null);
        setConsoleLogs((prev) => [
          `[Stitch Generator] ✓ Stitching completed! Stored URL: ${data.url}`,
          ...prev,
        ]);
        addNotification(
          "Stitched selected panels into one frame successfully!",
          "success"
        );
      }
    } catch (err: any) {
      console.error("Batch stitch failed:", err);
      addNotification(`Merge failed: ${err.message}`, "error");
    } finally {
      setIsBatchMerging(false);
    }
  };

  if (!isScraping && scrapedImages.length === 0) return null;

  return (
    <>
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
              <h3 className="font-bold text-sm text-white truncate">
                Live Asset Extraction
              </h3>
              {scrapedImages.length > 0 && (
                <span className="text-[10px] px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-inner font-mono uppercase tracking-wider">
                  {scrapedImages.length} Frames
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-nowrap items-center gap-2 overflow-x-auto self-end lg:self-auto ml-auto lg:ml-0">
            {scrapedImages.length > 0 && (
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
                addPanelsToStoryboard={addPanelsToStoryboard}
                showAutoCropModal={showAutoCropModal}
                setShowAutoCropModal={setShowAutoCropModal}
                isBatchCropping={isBatchCropping}
                batchProgress={batchProgress}
                handleAutoCropSelected={handleAutoCropSelected}
                handleCleanBubblesSelected={handleCleanBubblesSelected}
                fetchWithInterceptor={fetchWithInterceptor}
                onLastSelectedReset={() => setLastSelectedIndex(null)}
              />
            )}
            <button
              type="button"
              onClick={handleDownloadZip}
              disabled={scrapedImages.length === 0 || isZipping}
              className="text-[10px] font-mono border border-neutral-800/70 bg-neutral-950/60 hover:bg-neutral-900 text-neutral-300 hover:text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isZipping ? "Downloading..." : "Download ZIP"}</span>
            </button>
          </div>
        </div>

        {isScraping && scrapedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <RefreshCw className="h-6 w-6 text-purple-500 animate-spin" />
            <p className="text-xs text-neutral-400 font-mono">
              Launching browser to scrape webtoon panels... this may take up to
              60 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live scraping progress banner */}
            {isScraping && (
              <div className="flex flex-col gap-2.5 p-4 rounded-2xl bg-purple-950/20 border border-purple-800/30 shadow-md">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-3.5 w-3.5 text-purple-400 animate-spin flex-shrink-0" />
                  <p className="text-xs text-purple-300 font-mono font-bold tracking-tight">
                    Extracting panels...{" "}
                    {scrapedImages.length > 0
                      ? `${scrapedImages.length} loaded so far`
                      : "launching browser renderer"}
                  </p>
                </div>
                <div className="relative h-1.5 w-full bg-black/60 rounded-full overflow-hidden border border-purple-950/40 shadow-inner">
                  <div className="absolute top-0 bottom-0 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-400 rounded-full w-1/3 animate-infinite-scroll" />
                </div>
              </div>
            )}

            {/* Shift-select hint banner */}
            {scrapedImages.length > 1 && (
              <p className="text-[9px] text-neutral-600 font-mono px-1">
                💡 Tip: Hold{" "}
                <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono text-[8px]">
                  Shift
                </kbd>{" "}
                and click a card to select a range of panels.
              </p>
            )}

            {/* Grid list of extracted cards */}
            <div className="flex gap-4 overflow-x-auto pb-8 pt-1.5 scrollbar-thin">
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
                    addPanelsToStoryboard={addPanelsToStoryboard}
                    addNotification={addNotification}
                    onCardClick={handleCardClick}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Floating Selection Action Bar */}
      {isDashboardOnly && (
        <FloatingSelectionBar
          selectedCount={selectedScraped.length}
          totalCount={scrapedImages.length}
          isBatchCropping={isBatchCropping}
          batchProgress={batchProgress}
          isCleaningBubbles={isCleaningBubbles}
          cleanProgress={cleanProgress}
          isBatchMerging={isBatchMerging}
          handleAutoCropSelected={handleAutoCropSelected}
          handleCleanBubblesSelected={handleCleanBubblesSelected}
          handleBatchMergeSelected={handleBatchMergeSelected}
          handleAddToStoryboard={handleAddToStoryboard}
          handleDeleteSelected={handleDeleteSelected}
          handleClearAll={handleClearAll}
          handleSelectAllToggle={handleSelectAllToggle}
          setShowAutoCropModal={setShowAutoCropModal}
          setShowBubbleModal={setShowBubbleModal}
        />
      )}

      {/* Delete Scraped Frames Confirmation Modal */}
      {showDeleteConfirm &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
              onClick={() => setShowDeleteConfirm(false)}
            />
            <div className="relative w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 flex flex-col">
              {/* Glow Accent */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-rose-500 to-amber-500 blur-[1px]" />

              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-850 shrink-0 bg-neutral-900/50">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-red-500/10 rounded-xl text-red-400">
                    <Trash2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white tracking-tight">
                      Delete Extracted Frames?
                    </h2>
                    <p className="text-[10px] text-neutral-450 font-mono">
                      Warning: This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-neutral-400 hover:text-white bg-neutral-950/40 hover:bg-neutral-950 p-2 rounded-full transition-all cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4">
                <p className="text-xs text-neutral-350 leading-relaxed font-sans">
                  Are you sure you want to delete the{" "}
                  <strong>{selectedScraped.length}</strong> selected image
                  frame(s) from the deck?
                </p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-neutral-950/40 border-t border-neutral-850 flex items-center justify-end gap-3 shrink-0">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border border-neutral-750/30"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    executeDeleteSelected();
                  }}
                  className="px-6 py-2.5 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-550 hover:to-rose-550 border border-red-550/30 text-white font-bold rounded-xl text-xs tracking-wide transition-all shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] active:scale-95 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Confirm & Delete</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
