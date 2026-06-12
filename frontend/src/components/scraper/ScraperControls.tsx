import React from "react";
import { ScraperDeckProps } from "./types.js";
import { ScraperSelectionToolbar } from "./ScraperSelectionToolbar.js";

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
  addPanelsToStoryboard: (urls: string[], currentScrapedList?: string[], shouldScroll?: boolean) => void;
  fetchWithInterceptor?: any;
  /** Called when a filter action resets selection — so parent can clear lastSelectedIndex anchor */
  onLastSelectedReset?: () => void;
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
      setConsoleLogs((prev) => ["[GUI] Selected all extracted frames", ...prev]);
    }
  };

  const handleInvertSelection = () => {
    console.log("[ScraperControls] Inverting selection");
    setSelectedScraped((prev) => scrapedImages.filter((img) => !prev.includes(img)));
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
    setConsoleLogs((prev) => ["[GUI] Reversed extracted frame sequence order in deck", ...prev]);
    addNotification("Reversed sequence order of the scraped deck!", "info");
  };

  // ── Advanced Count & Range Filters ───────────────────────────────────────

  const handleSelectFirstN = (n: number) => {
    const clamped = Math.min(Math.max(1, n), scrapedImages.length);
    setSelectedScraped(scrapedImages.slice(0, clamped));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => [`[GUI] Selected first ${clamped} frames`, ...prev]);
  };

  const handleSelectLastN = (n: number) => {
    const clamped = Math.min(Math.max(1, n), scrapedImages.length);
    setSelectedScraped(scrapedImages.slice(-clamped));
    onLastSelectedReset?.();
    setConsoleLogs((prev) => [`[GUI] Selected last ${clamped} frames`, ...prev]);
  };

  /** a and b are 1-indexed inclusive panel numbers */
  const handleSelectRange = (a: number, b: number) => {
    const lo = Math.max(0, Math.min(a, b) - 1);       // convert to 0-indexed
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
