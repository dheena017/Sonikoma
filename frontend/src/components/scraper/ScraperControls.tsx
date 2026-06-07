import React, { useState } from "react";
import {
  Square,
  CheckSquare,
  Scissors,
  RefreshCw,
  Brain,
  Settings2,
  Download,
  Trash2,
  Plus,
  ArrowUpDown,
  Merge,
  EyeOff,
  Filter,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { ScraperDeckProps } from "./types";

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
  const [isZipping, setIsZipping] = useState<boolean>(false);
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

  const handleDownloadZip = async () => {
    const isSelected = selectedScraped.length > 0;
    const toDownload = isSelected ? selectedScraped : scrapedImages;
    if (toDownload.length === 0) return;

    setIsZipping(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("webtoon_frames");
      if (!folder) {
        addNotification("Failed to create zip folder", "error");
        setIsZipping(false);
        return;
      }

      for (let i = 0; i < toDownload.length; i++) {
        try {
          const url = toDownload[i];
          const res = await fetch(url);
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
      saveAs(blobContent, "webtoon_frames.zip");

      setConsoleLogs((prev) => [
        `[GUI] Successfully generated zip for ${toDownload.length} images`,
        ...prev,
      ]);
      addNotification(
        `Finished zipping ${toDownload.length} image(s).`,
        "success"
      );
    } catch (err) {
      console.error("Zip generation failed:", err);
      addNotification("Failed to generate zip file", "error");
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
    setSelectedScraped([]);
  };

  const handleAddToCanvas = () => {
    if (selectedScraped.length === 0) return;
    addPanelsWithAutoAnalysis(selectedScraped);
    setSelectedScraped([]);
  };

  return (
    <div className="flex flex-col gap-4 bg-neutral-950/50 p-5 rounded-2xl border border-neutral-850/80 shadow-inner">
      {/* Dynamic Asset Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <p className="text-xs text-neutral-400 font-sans leading-relaxed">
          These live graphics are separated dynamically from the viewer URL.
        </p>
        {scrapedImages.length > 0 && (
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold font-mono">
              Selected
            </span>
            <span className="bg-purple-500/10 text-purple-300 border border-purple-500/20 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold shadow-inner">
              {selectedScraped.length} / {scrapedImages.length}
            </span>
          </div>
        )}
      </div>

      {/* Selection Filters Row */}
      {scrapedImages.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 bg-neutral-950/40 border border-neutral-900 rounded-xl animate-fadeIn">
          <span className="text-[9px] font-mono text-neutral-500 font-bold uppercase mr-1.5 flex items-center gap-1">
            <Filter className="h-3 w-3 text-purple-400" />
            <span>Select Filters:</span>
          </span>
          <button
            type="button"
            onClick={handleInvertSelection}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
          >
            Invert
          </button>
          <button
            type="button"
            onClick={handleSelectOdd}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
          >
            Select Odd
          </button>
          <button
            type="button"
            onClick={handleSelectEven}
            className="px-2.5 py-1 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer"
          >
            Select Even
          </button>
          <div className="h-4 w-px bg-neutral-800/80 mx-1.5" />
          <button
            type="button"
            onClick={handleReverseDeckOrder}
            className="px-2.5 py-1 bg-purple-950/30 hover:bg-purple-900/40 border border-purple-900/40 hover:border-purple-800/50 text-purple-300 hover:text-white rounded-lg text-[9px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
            title="Flipped chronological order of entire deck panels sequence"
          >
            <ArrowUpDown className="h-3 w-3 text-purple-400" />
            <span>Reverse Deck Sequence</span>
          </button>
        </div>
      )}

      {/* Main Buttons Actions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-800/40 mt-1 w-full font-sans">
        <div className="flex flex-wrap items-center gap-2">
          {/* Select All Toggle */}
          <button
            onClick={handleSelectAllToggle}
            disabled={scrapedImages.length === 0}
            className="h-9 px-3.5 bg-neutral-900/60 hover:bg-neutral-800 text-neutral-300 hover:text-white rounded-xl text-[11px] uppercase tracking-wider font-bold border border-neutral-800/60 cursor-pointer flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {selectedScraped.length === scrapedImages.length &&
            scrapedImages.length > 0 ? (
              <>
                <Square className="h-3.5 w-3.5 text-neutral-500" />
                <span>Deselect All</span>
              </>
            ) : (
              <>
                <CheckSquare className="h-3.5 w-3.5 text-indigo-400" />
                <span>Select All</span>
              </>
            )}
          </button>

          {/* Auto-Crop Segmented Button Group */}
          <div className="flex items-center h-9 animate-[fadeIn_0.2s_ease-out]">
            <button
              onClick={() => setShowAutoCropModal(true)}
              disabled={isBatchCropping || selectedScraped.length === 0}
              className="h-full px-3.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 rounded-l-xl border-r-0 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95"
              title="Open Auto-Crop Settings"
            >
              {isBatchCropping ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Scissors className="h-3.5 w-3.5" />
              )}
              <span>
                {isBatchCropping && batchProgress
                  ? `Cropping (${batchProgress.current}/${batchProgress.total})`
                  : "Auto-Crop"}
              </span>
            </button>
            <button
              onClick={() => setShowAutoCropModal(true)}
              title="Auto-crop settings"
              className="h-full px-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 rounded-r-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Clean Bubbles Button Group */}
          <div className="flex items-center h-9">
            <button
              onClick={() => setShowBubbleModal(true)}
              disabled={isCleaningBubbles || selectedScraped.length === 0}
              className="h-full px-3.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-l-xl border-r-0 flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm cursor-pointer active:scale-95 text-[11px] uppercase tracking-wider font-bold"
              title="Open Bubble Cleaner Settings"
            >
              {isCleaningBubbles ? (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Brain className="h-3.5 w-3.5" />
              )}
              <span>
                {isCleaningBubbles && cleanProgress
                  ? `Cleaning (${cleanProgress.current}/${cleanProgress.total})`
                  : "Clean Bubbles"}
              </span>
            </button>
            <button
              onClick={() => setShowBubbleModal(true)}
              title="Bubble cleaner settings"
              className="h-full px-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-purple-200 rounded-r-xl transition-all cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <Settings2 className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Stitch / Merge Selected */}
          <button
            onClick={handleBatchMergeSelected}
            disabled={selectedScraped.length < 2 || isBatchMerging}
            className="h-9 px-3.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-300 hover:text-emerald-200 rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
            title="Vertical stitch selected frames into a single image asset"
          >
            {isBatchMerging ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Merge className="h-3.5 w-3.5" />
            )}
            <span>{isBatchMerging ? "Stitching..." : "Stitch Selected"}</span>
          </button>

          {/* ZIP Download */}
          <button
            onClick={handleDownloadZip}
            disabled={scrapedImages.length === 0 || isZipping}
            className="h-9 px-3.5 bg-neutral-900/60 hover:bg-neutral-800 border border-neutral-800/60 text-neutral-300 hover:text-white rounded-xl flex items-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
          >
            {isZipping ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{isZipping ? "Downloading..." : "Download"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {/* Delete Selected */}
          <button
            onClick={handleDeleteSelected}
            className="h-9 px-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 border border-red-500/20 rounded-xl flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold cursor-pointer active:scale-95 shadow-sm"
            disabled={selectedScraped.length === 0}
            title="Delete Selected"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>

          {/* Add to Canvas */}
          <button
            onClick={handleAddToCanvas}
            className="h-9 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white border border-purple-500/30 rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-purple-900/20 hover:shadow-purple-900/35 transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed text-[11px] uppercase tracking-wider font-bold active:scale-95"
            disabled={selectedScraped.length === 0}
          >
            <Plus className="h-4 w-4" />
            <span>Add to Canvas</span>
          </button>
        </div>
      </div>
    </div>
  );
}
