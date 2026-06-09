import React, { useState } from "react";
import { ScraperDeckProps } from "./types.js";
import { ScraperSelectionToolbar } from "./ScraperSelectionToolbar.js";
import { ScraperActionButtons } from "./ScraperActionButtons.js";

interface ScraperControlsProps
  extends Pick<
    ScraperDeckProps,
    | "scrapedImages"
    | "selectedScraped"
    | "setSelectedScraped"
    | "setScrapedImages"
    | "setConsoleLogs"
    | "addNotification"
    | "setShowBubbleModal"
    | "isCleaningBubbles"
    | "cleanProgress"
    | "showAutoCropModal"
    | "setShowAutoCropModal"
    | "isBatchCropping"
    | "batchProgress"
    | "fetchWithInterceptor"
  > {
  addPanelsWithAutoAnalysis: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
}

export default function ScraperControls({
  scrapedImages,
  selectedScraped,
  setSelectedScraped,
  setScrapedImages,
  setConsoleLogs,
  addNotification,
  setShowBubbleModal,
  isCleaningBubbles,
  cleanProgress,
  showAutoCropModal,
  setShowAutoCropModal,
  isBatchCropping,
  batchProgress,
  addPanelsWithAutoAnalysis,
  fetchWithInterceptor,
}: ScraperControlsProps) {
  const [isBatchMerging, setIsBatchMerging] = useState<boolean>(false);
 

  const handleSelectAllToggle = () => {
    if (selectedScraped.length === scrapedImages.length) {
      setSelectedScraped([]);
      setConsoleLogs((prev) => ["[GUI] Cleared selections", ...prev]);
    } else {
      setSelectedScraped([...scrapedImages]);
      setConsoleLogs((prev) => [
        "[GUI] Selected all extracted frames",
        ...prev,
      ]);
    }
  };

  const handleInvertSelection = () => {
    setSelectedScraped((prev) => scrapedImages.filter((img) => !prev.includes(img)));
    setConsoleLogs((prev) => ["[GUI] Inverted selection set", ...prev]);
  };

  const handleSelectOdd = () => {
    setSelectedScraped(scrapedImages.filter((_, idx) => idx % 2 === 0));
    setConsoleLogs((prev) => ["[GUI] Selected odd-numbered frames", ...prev]);
  };

  const handleSelectEven = () => {
    setSelectedScraped(scrapedImages.filter((_, idx) => idx % 2 !== 0));
    setConsoleLogs((prev) => ["[GUI] Selected even-numbered frames", ...prev]);
  };

  const handleReverseDeckOrder = () => {
    setScrapedImages((prev) => [...prev].reverse());
    setConsoleLogs((prev) => ["[GUI] Reversed extracted frame sequence order in deck", ...prev]);
    addNotification("Reversed sequence order of the scraped deck!", "info");
  };

  const handleBatchMergeSelected = async () => {
    if (selectedScraped.length < 2) {
      addNotification("Select at least 2 panels to stitch together", "info");
      return;
    }
    setIsBatchMerging(true);
    setConsoleLogs((prev) => [
      `[Stitch Generator] Merging ${selectedScraped.length} selected images vertically...`,
      ...prev,
    ]);

    try {
      const activeFetch = fetchWithInterceptor || fetch;
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
        // Find the index of the first selected image to insert the merged panel at that spot
        const firstSelectedIdx = scrapedImages.findIndex((img) => selectedScraped.includes(img));

        setScrapedImages((prev) => {
          const filtered = prev.filter((img) => !selectedScraped.includes(img));
          filtered.splice(firstSelectedIdx === -1 ? 0 : firstSelectedIdx, 0, data.url);
          return filtered;
        });

        setSelectedScraped([]);
        setConsoleLogs((prev) => [
          `[Stitch Generator] ✓ Stitching completed successfully! Stored URL: ${data.url}`,
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
  };

  const controlsContent = (
    <>
      <ScraperSelectionToolbar
        scrapedImages={scrapedImages}
        selectedScraped={selectedScraped}
        handleInvertSelection={handleInvertSelection}
        handleSelectOdd={handleSelectOdd}
        handleSelectEven={handleSelectEven}
        handleReverseDeckOrder={handleReverseDeckOrder}
      />

      <ScraperActionButtons
        scrapedImages={scrapedImages}
        selectedScraped={selectedScraped}
        handleSelectAllToggle={handleSelectAllToggle}
        setShowAutoCropModal={setShowAutoCropModal}
        isBatchCropping={isBatchCropping}
        batchProgress={batchProgress}
        setShowBubbleModal={setShowBubbleModal}
        isCleaningBubbles={isCleaningBubbles}
        cleanProgress={cleanProgress}
        handleBatchMergeSelected={handleBatchMergeSelected}
        isBatchMerging={isBatchMerging}
      />
    </>
  );

  return (
    <div className="flex flex-col gap-4 bg-neutral-950/50 p-4 sm:p-5 rounded-2xl border border-transparent shadow-inner">
      <div className="lg:hidden">
        <details className="rounded-2xl border border-neutral-800/70 bg-neutral-950/70 p-3">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-2 text-xs font-bold text-neutral-200 font-mono uppercase tracking-wider select-none">
            <span>Bulk tools</span>
            <span className="text-[10px] text-neutral-500 normal-case tracking-normal">Tap to expand</span>
          </summary>
          <div className="mt-4 space-y-4">{controlsContent}</div>
        </details>
      </div>

      <div className="hidden lg:block">{controlsContent}</div>
    </div>
  );
}
