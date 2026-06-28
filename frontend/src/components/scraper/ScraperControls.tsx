import React from "react";
import { ScraperDeckProps } from "./types.js";
import { ScraperSelectionToolbar } from "./ScraperSelectionToolbar.js";
import { ScraperActionButtons } from "./ScraperActionButtons.js";
import { useLiveScraperActions } from "../../hooks/useLiveScraperActions.js";

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
    | "handleAutoCropSelected"
    | "handleCleanBubblesSelected"
  > {
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  fetchWithInterceptor?: any;
  /** Called when a filter action resets selection — so parent can clear lastSelectedIndex anchor */
  onLastSelectedReset?: () => void;
  handleCancelBatch?: () => void;
  audioFeedback?: any;
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
  handleAutoCropSelected,
  handleCleanBubblesSelected,
  onLastSelectedReset,
  handleCancelBatch,
  audioFeedback,
}: ScraperControlsProps) {
  // ── Quick Selection Filters ──────────────────────────────────────────────

  const handleSelectAllToggle = () => {
    console.log("[ScraperControls] Toggling select all");
    if (selectedScraped.length === scrapedImages.length) {
      setSelectedScraped([]);
      onLastSelectedReset?.();
      setConsoleLogs((prev) => ["[GUI] Cleared selections", ...prev]);
    } else {
      setSelectedScraped([...scrapedImages]);
      setConsoleLogs((prev) => ["[GUI] Selected all images", ...prev]);
    }
  };

  const handleInvertSelection = () => {
    console.log("[ScraperControls] Inverting selection");
    setSelectedScraped((prev) =>
      scrapedImages.filter((img) => !prev.includes(img))
    );
    onLastSelectedReset?.();
    setConsoleLogs((prev) => ["[GUI] Inverted selection set", ...prev]);
  };

  const handleSelectOdd = () => {
    console.log("[ScraperControls] Selecting odd frames");
    setSelectedScraped(scrapedImages.filter((_, idx) => idx % 2 === 0));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => ["[GUI] Selected odd-numbered frames", ...prev]);
  };

  const handleSelectEven = () => {
    console.log("[ScraperControls] Selecting even frames");
    setSelectedScraped(scrapedImages.filter((_, idx) => idx % 2 !== 0));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => ["[GUI] Selected even-numbered frames", ...prev]);
  };

  const handleReverseDeckOrder = () => {
    console.log("[ScraperControls] Reversing deck order");
    setScrapedImages((prev) => [...prev].reverse());
    onLastSelectedReset?.();
    setConsoleLogs((prev) => ["[GUI] Reversed image order", ...prev]);
    addNotification("Reversed image order!", "info");
    audioFeedback?.playTick();
  };

  // ── Advanced Count & Range Filters ───────────────────────────────────────

  const handleSelectFirstN = (n: number) => {
    const clamped = Math.min(Math.max(1, n), scrapedImages.length);
    setSelectedScraped(scrapedImages.slice(0, clamped));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => [
      `[GUI] Selected first ${clamped} frames`,
      ...prev,
    ]);
  };

  const handleSelectLastN = (n: number) => {
    const clamped = Math.min(Math.max(1, n), scrapedImages.length);
    setSelectedScraped(scrapedImages.slice(-clamped));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => [
      `[GUI] Selected last ${clamped} frames`,
      ...prev,
    ]);
  };

  /** a and b are 1-indexed inclusive panel numbers */
  const handleSelectRange = (a: number, b: number) => {
    const lo = Math.max(0, Math.min(a, b) - 1); // convert to 0-indexed
    const hi = Math.min(scrapedImages.length, Math.max(a, b)); // exclusive end
    setSelectedScraped(scrapedImages.slice(lo, hi));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => [`[GUI] Selected panels ${a} to ${b}`, ...prev]);
  };

  const handleClearAll = () => {
    setSelectedScraped([]);
    onLastSelectedReset?.();
    setConsoleLogs((prev) => ["[GUI] Cleared all selections", ...prev]);
  };

  const { handleDownloadZip, handleAddToStoryboard } = useLiveScraperActions({
    scrapedImages,
    selectedScraped,
    setSelectedScraped,
    setScrapedImages,
    setConsoleLogs,
    addPanelsToStoryboard,
    fetchWithInterceptor,
    addNotification,
    audioFeedback,
  });

  // ─────────────────────────────────────────────────────────────────────────

  const controlsContent = (
    <>
      <ScraperSelectionToolbar
        scrapedImages={scrapedImages}
        selectedScraped={selectedScraped}
        handleInvertSelection={handleInvertSelection}
        handleSelectOdd={handleSelectOdd}
        handleSelectEven={handleSelectEven}
        handleReverseDeckOrder={handleReverseDeckOrder}
        handleSelectFirstN={handleSelectFirstN}
        handleSelectLastN={handleSelectLastN}
        handleSelectRange={handleSelectRange}
        handleClearAll={handleClearAll}
        setSelectedScraped={setSelectedScraped}
      />
      <ScraperActionButtons
        scrapedImages={scrapedImages}
        selectedScraped={selectedScraped}
        handleSelectAllToggle={handleSelectAllToggle}
        setShowAutoCropModal={setShowAutoCropModal}
        isBatchCropping={isBatchCropping}
        batchProgress={batchProgress}
        handleAutoCropSelected={handleAutoCropSelected}
        handleDownloadZip={handleDownloadZip}
        handleAddToStoryboard={handleAddToStoryboard}
        setShowBubbleModal={setShowBubbleModal}
        isCleaningBubbles={isCleaningBubbles}
        cleanProgress={cleanProgress}
        handleCleanBubblesSelected={handleCleanBubblesSelected}
        handleBatchMergeSelected={() => {}} // Not implemented at header level yet or pass from props
        isBatchMerging={false}
        handleCancelBatch={handleCancelBatch}
      />
    </>
  );

  return controlsContent;
}
