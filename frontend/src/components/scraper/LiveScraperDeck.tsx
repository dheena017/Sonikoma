import React, { useState, useCallback } from "react";
import {
  Image as ImageIcon,
  RefreshCw,
  Download,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { LiveScraperDeckProps } from "./types";
import PanelCard from "./PanelCard.js";
import ScraperControls from "./ScraperControls.js";
import { FloatingSelectionBar } from "./FloatingSelectionBar.js";

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
}: LiveScraperDeckProps) {
  const [isZipping, setIsZipping] = useState(false);
  const lastSelectedIndexRef = React.useRef<number | null>(null);
  const [isBatchMerging, setIsBatchMerging] = useState(false);
  const activeFetch = fetchWithInterceptor || fetch;

  // Optimize selected items lookup
  const selectedSet = React.useMemo(() => new Set(selectedScraped), [selectedScraped]);

  /** Core card click handler — supports shift-range selection */
  const handleCardClick = useCallback(
    (idx: number, imgUrl: string, shiftKey: boolean) => {
      const lastIdx = lastSelectedIndexRef.current;
      if (shiftKey && lastIdx !== null) {
        // Build inclusive range and merge into the selection set
        const lo = Math.min(lastIdx, idx);
        const hi = Math.max(lastIdx, idx);
        const rangeUrls = scrapedImages.slice(lo, hi + 1);
        setSelectedScraped((prev) => Array.from(new Set([...prev, ...rangeUrls])));
        // Do NOT update lastSelectedIndex on shift-click — anchor stays put
      } else {
        setSelectedScraped((prev) => {
          if (prev.includes(imgUrl)) {
            return prev.filter((u) => u !== imgUrl);
          } else {
            return [...prev, imgUrl];
          }
        });
        lastSelectedIndexRef.current = idx;
      }
    },
    [scrapedImages, setSelectedScraped]
  );

  const handleDownloadZip = useCallback(async () => {
    const toDownload = selectedScraped.length > 0 ? selectedScraped : scrapedImages;
    if (toDownload.length === 0) return;
    console.log("[LiveScraperDeck] Starting ZIP download for", toDownload.length, "images");

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
  }, [selectedScraped, scrapedImages, activeFetch, setConsoleLogs]);

  const handleDeleteSelected = useCallback(() => {
    if (selectedScraped.length === 0) return;
    console.log("[LiveScraperDeck] Deleting", selectedScraped.length, "selected images");
    setScrapedImages((prev) => prev.filter((img) => !selectedScraped.includes(img)));
    setConsoleLogs((prev) => [
      `[GUI] Removed ${selectedScraped.length} images`,
      ...prev,
    ]);
    addNotification(`Deleted ${selectedScraped.length} selected image(s) from the deck.`, "success");
    setSelectedScraped([]);
    lastSelectedIndexRef.current = null;
  }, [selectedScraped, setScrapedImages, setConsoleLogs, addNotification, setSelectedScraped]);

  const handleAddToStoryboard = useCallback(() => {
    if (selectedScraped.length === 0) return;
    addPanelsToStoryboard(selectedScraped);
    console.log(`[GUI] Adding ${selectedScraped.length} selected image(s) to storyboard.`);
    setSelectedScraped([]);
    lastSelectedIndexRef.current = null;
  }, [selectedScraped, addPanelsToStoryboard, setSelectedScraped]);

  const handleClearAll = useCallback(() => {
    setSelectedScraped([]);
    lastSelectedIndexRef.current = null;
  }, [setSelectedScraped]);

  const handleSelectAllToggle = useCallback(() => {
    if (selectedScraped.length === scrapedImages.length && scrapedImages.length > 0) {
      setSelectedScraped([]);
      lastSelectedIndexRef.current = null;
      setConsoleLogs((prev) => ["[GUI] Cleared selections", ...prev]);
    } else {
      setSelectedScraped([...scrapedImages]);
      setConsoleLogs((prev) => ["[GUI] Selected all extracted frames", ...prev]);
    }
  }, [selectedScraped, scrapedImages, setSelectedScraped, setConsoleLogs]);

  const handleBatchMergeSelected = useCallback(async () => {
    if (selectedScraped.length < 2) {
      addNotification("Select at least 2 panels to stitch together", "info");
      return;
    }
    console.log("[LiveScraperDeck] Starting batch vertical merge for", selectedScraped.length, "images");
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
        const firstSelectedIdx = scrapedImages.findIndex((img) => selectedScraped.includes(img));
        setScrapedImages((prev) => {
          const filtered = prev.filter((img) => !selectedScraped.includes(img));
          filtered.splice(firstSelectedIdx === -1 ? 0 : firstSelectedIdx, 0, data.url);
          return filtered;
        });
        setSelectedScraped([]);
        lastSelectedIndexRef.current = null;
        setConsoleLogs((prev) => [
          `[Stitch Generator] ✓ Stitching completed! Stored URL: ${data.url}`,
          ...prev,
        ]);
        addNotification("Stitched selected panels into one frame successfully!", "success");
      }
    } catch (err: any) {
      console.error("Batch stitch failed:", err);
      addNotification(`Merge failed: ${err.message}`, "error");
    } finally {
      setIsBatchMerging(false);
    }
  }, [selectedScraped, addNotification, activeFetch, scrapedImages, setScrapedImages, setSelectedScraped, setConsoleLogs]);

  // ── Virtualization Logic ──────────────────────────────────────────────────
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 20 });
  const CARD_WIDTH = 156 + 16; // w-[156px] + gap-4
  const MOBILE_CARD_WIDTH = 140 + 16; // w-[140px] + gap-4

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollLeft = container.scrollLeft;
      const containerWidth = container.clientWidth;
      const isMobile = window.innerWidth < 640;
      const width = isMobile ? MOBILE_CARD_WIDTH : CARD_WIDTH;

      const start = Math.floor(scrollLeft / width);
      const end = Math.ceil((scrollLeft + containerWidth) / width) + 2; // +2 for buffer

      setVisibleRange(prev => {
        // Only update if the range has actually shifted significantly
        if (Math.abs(prev.start - start) > 1 || Math.abs(prev.end - end) > 1 || end > prev.end) {
           return { start: Math.max(0, start - 4), end: Math.min(scrapedImages.length, end + 4) };
        }
        return prev;
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Initial check
    handleScroll();

    // Also re-check on window resize
    window.addEventListener("resize", handleScroll);

    return () => {
      container.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [scrapedImages.length]);

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
              <span>{isZipping ? "Downloading..." : "Download ZIP"}</span>
            </button>
          </div>
        </div>

        {isScraping && scrapedImages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <RefreshCw className="h-6 w-6 text-purple-500 animate-spin" />
            <p className="text-xs text-neutral-400 font-mono">
              Launching browser to scrape webtoon panels... this may take up to 60 seconds.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Live scraping progress banner */}
            {isScraping && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-purple-950/30 border border-purple-800/40">
                <RefreshCw className="h-3.5 w-3.5 text-purple-400 animate-spin flex-shrink-0" />
                <p className="text-[11px] text-purple-300 font-mono">
                  Extracting panels... {scrapedImages.length > 0 ? `${scrapedImages.length} loaded so far` : "launching browser renderer"}
                </p>
              </div>
            )}

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
              addPanelsToStoryboard={addPanelsToStoryboard}
              showAutoCropModal={showAutoCropModal}
              setShowAutoCropModal={setShowAutoCropModal}
              isBatchCropping={isBatchCropping}
              batchProgress={batchProgress}
              handleAutoCropSelected={handleAutoCropSelected}
              handleCleanBubblesSelected={handleCleanBubblesSelected}
              fetchWithInterceptor={fetchWithInterceptor}
          onLastSelectedReset={() => { lastSelectedIndexRef.current = null; }}
            />

            {/* Shift-select hint banner */}
            {scrapedImages.length > 1 && (
              <p className="text-[9px] text-neutral-600 font-mono px-1">
                💡 Tip: Hold <kbd className="px-1 py-0.5 rounded bg-neutral-800 text-neutral-400 font-mono text-[8px]">Shift</kbd> and click a card to select a range of panels.
              </p>
            )}

            {/* Grid list of extracted cards (Virtualised) */}
            <div
              ref={containerRef}
              className="flex gap-4 overflow-x-auto pb-8 pt-1.5 scrollbar-thin relative"
              style={{ minHeight: '260px' }}
            >
              {/* Spacer to maintain scroll width */}
              <div
                style={{
                  width: `${scrapedImages.length * (window.innerWidth < 640 ? MOBILE_CARD_WIDTH : CARD_WIDTH)}px`,
                  height: '1px',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  pointerEvents: 'none'
                }}
              />

              {scrapedImages.map((imgUrl, idx) => {
                // Only render if within visible range
                if (idx < visibleRange.start || idx > visibleRange.end) return null;

                const isSelected = selectedSet.has(imgUrl);
                const currentWidth = window.innerWidth < 640 ? MOBILE_CARD_WIDTH : CARD_WIDTH;

                return (
                  <div
                    key={`${imgUrl}-${idx}`}
                    style={{
                      position: 'absolute',
                      left: `${idx * currentWidth}px`,
                    }}
                  >
                    <PanelCard
                      imgUrl={imgUrl}
                      idx={idx}
                      isSelected={isSelected}
                      isBatchCropping={isBatchCropping}
                      croppingImgUrl={croppingImgUrl}
                      bubbleCroppingImgUrl={bubbleCroppingImgUrl}
                      scrapedImagesCount={scrapedImages.length}
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
                  </div>
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
        />
      )}
    </>
  );
}
