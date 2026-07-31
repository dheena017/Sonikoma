import React, { useState, useCallback, useEffect, useRef } from "react";
import { normalizeLog } from "@/types/logs";
import { createPortal } from "react-dom";
import {
  Image as ImageIcon,
  RefreshCw,
  Download,
  X,
  Trash2,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  Rows,
  Loader2,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as api from "@/api/index";
import { useProjectStore } from "@/store/useProjectStore";
import { LiveScraperDeckProps } from "@/features/scraper/components/types";
import PanelCard from "@/features/scraper/components/PanelCard";
// ScraperControls moved into the floating selection bar; remove header rendering to free space
import {
  FloatingSelectionBar,
  ScraperSelectionToolbar,
} from "@/features/image/components/editor/select";
import LiveScraperDeckEmptyState from "@/features/scraper/components/LiveScraperDeckEmptyState";

import { parseWebtoonUrl, getSourceName, getProxiedImageUrl } from "@/utils";
import { updateSelection } from "@/utils/selection";
import { EpisodeRatingDisplay } from "@/features/scraper/components/EpisodeRatingDisplay";
import { ExtractionSkeletonCard, ImportImagesLoadingOverlay } from "@/shared/ui/loading";


export function formatDisplayEpisodeLabel(label: string): string {
  if (!label) return "Episode";
  const trimmed = label.trim();
  const duplicateMatch = trimmed.match(/^(Episode\s*\d+|Chapter\s*\d+|Ep\.\s*\d+)\s*[-:]\s*\1(.*)$/i);
  if (duplicateMatch) {
    const main = duplicateMatch[1];
    const rest = duplicateMatch[2]?.replace(/^[-:\s]+/, "").trim();
    return rest ? `${main}: ${rest}` : main;
  }
  const trailingTruncateMatch = trimmed.match(/^(Episode\s*\d+|Chapter\s*\d+|Ep\.\s*\d+)\s*[-:]\s*E(?:\.\.\.|\s*)$/i);
  if (trailingTruncateMatch) {
    return trailingTruncateMatch[1];
  }
  return trimmed;
}

export function getSortedEpisodeGroups<T extends { episodeLabel: string }>(
  groups: T[]
): Array<{ grp: T; originalIdx: number }> {
  if (!groups || groups.length === 0) return [];
  const mapped = groups.map((grp, originalIdx) => ({ grp, originalIdx }));

  const parseNum = (label: string) => {
    const match = label.match(/(?:Episode|Chapter|Ep\.?|Ch\.?)\s*(\d+)/i);
    if (match) return parseInt(match[1], 10);
    const num = label.match(/\d+/);
    return num ? parseInt(num[0], 10) : 0;
  };

  return mapped.sort((a, b) => parseNum(a.grp.episodeLabel) - parseNum(b.grp.episodeLabel));
}

export const HorizontalScrollContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 5);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 5);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const handleNativeWheel = (e: WheelEvent) => {
      if (e.deltaY !== 0 && Math.abs(e.deltaY) >= Math.abs(e.deltaX)) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;

        const isScrollingRight = e.deltaY > 0;
        const isScrollingLeft = e.deltaY < 0;

        const canScrollRight = el.scrollLeft < maxScroll - 1;
        const canScrollLeft = el.scrollLeft > 1;

        if ((isScrollingRight && canScrollRight) || (isScrollingLeft && canScrollLeft)) {
          e.preventDefault(); // Stop whole page from vertical scrolling!
          el.scrollLeft += e.deltaY * 1.2;
        }
      }
    };

    el.addEventListener("wheel", handleNativeWheel, { passive: false });

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      el.removeEventListener("wheel", handleNativeWheel);
    };
  }, [checkScroll, children]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const scrollAmount = el.clientWidth * 0.75;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  return (
    <div className="relative group/scroll-container w-full min-w-0">
      {/* Scroll Left Navigation Arrow Button */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll Left"
          title="Scroll Left (Left to Right)"
          className="absolute left-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-neutral-955/95 hover:bg-purple-600 border border-neutral-700/80 hover:border-purple-400 text-purple-300 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
      )}

      {/* Scroll Right Navigation Arrow Button */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll Right"
          title="Scroll Right (Left to Right)"
          className="absolute right-2 top-1/2 -translate-y-1/2 z-30 w-10 h-10 rounded-full bg-neutral-955/95 hover:bg-purple-600 border border-neutral-700/80 hover:border-purple-400 text-purple-300 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 opacity-90 hover:opacity-100 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      )}

      {/* Horizontal Scroll Container Track */}
      <div
        ref={scrollRef}
        className={`w-full max-w-full flex gap-4 overflow-x-auto pb-4 pt-1.5 scrollbar-thin scroll-smooth px-1 select-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

const LiveScraperDeck = React.memo(
  ({
    scrapedImages,
    isScraping,
    selectedScraped,
    setSelectedScraped,
    setScrapedImages,
    mergingIndices,
    setConsoleLogs,
    handleMergeWithNext,
    setEditingImageIdx,
    setEditCropTop,
    setEditCropBottom,
    setEditCropLeft,
    setEditCropRight,
    setEditAutoTrim,
    addNotification,
    fetchWithInterceptor,
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
    targetUrl = "",
    handleSaveAssets,
    handleCancelBatch,
    rating,
    likes,
    views,
    consoleLogs,
    selectedModel,
    resetWorkspace,
  }: LiveScraperDeckProps) => {
    const [isZipping, setIsZipping] = useState(false);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
      null
    );
    const [isBatchMerging, setIsBatchMerging] = useState(false);
    const [viewLayout, setViewLayout] = useState<"scroll" | "grid">("scroll");
    const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState<number | "all">("all");
    const [episodeSearchQuery, setEpisodeSearchQuery] = useState("");
    const [episodeSortAscending, setEpisodeSortAscending] = useState(true);
    const [hoveredEpisodeIdx, setHoveredEpisodeIdx] = useState<number | null>(null);
    const activeFetch = fetchWithInterceptor || fetch;

    useEffect(() => {
      (window as any).__scrapedImagesList = scrapedImages;
    }, [scrapedImages]);

    /** Core card click handler — supports shift-range selection and Ctrl/Cmd toggling */
    const handleCardClick = useCallback(
      (idx: number, imgUrl: string, shiftKey: boolean, ctrlOrMeta: boolean) => {
        if (shiftKey && lastSelectedIndex !== null) {
          const lo = Math.min(lastSelectedIndex, idx);
          const hi = Math.max(lastSelectedIndex, idx);
          const rangeUrls = scrapedImages.slice(lo, hi + 1);
          setSelectedScraped((prev) =>
            updateSelection(prev, { type: "range", items: rangeUrls }) as string[]
          );
        } else if (ctrlOrMeta) {
          setSelectedScraped((prev) =>
            updateSelection(prev, { type: "toggle", item: imgUrl }) as string[]
          );
          setLastSelectedIndex(idx);
        } else {
          // Single click (no modifiers) does NOT change/toggle selection now.
          // It strictly sets/updates lastSelectedIndex.
          setLastSelectedIndex(idx);
        }
      },
      [lastSelectedIndex, scrapedImages, setSelectedScraped]
    );

    const handleCardDoubleClick = useCallback(
      (idx: number, imgUrl: string) => {
        setSelectedScraped((prev) =>
          updateSelection(prev, { type: "double", item: imgUrl }) as string[]
        );
        setLastSelectedIndex(idx);
      },
      [setSelectedScraped]
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
          parts.push(
            `Chapter_${makeSafeFilename(parsed.chapterNumber.trim())}`
          );
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
          normalizeLog(
            `[GUI] Successfully generated zip named ${targetFilename} for ${toDownload.length} images`
          ),
          ...prev,
        ]);
      } catch (err) {
        console.error("Zip generation failed:", err);
      } finally {
        setIsZipping(false);
      }
    };

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    React.useEffect(() => {
      const container = document.getElementById("main-scroll-container");
      if (showDeleteConfirm) {
        document.body.style.overflow = "hidden";
        if (container) container.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "unset";
        if (container) container.style.overflow = "unset";
      }
      return () => {
        document.body.style.overflow = "unset";
        if (container) container.style.overflow = "unset";
      };
    }, [showDeleteConfirm]);

    const executeDeleteSelected = () => {
      setScrapedImages((prev) =>
        prev.filter((img) => !selectedScraped.includes(img))
      );
      setConsoleLogs((prev) => [
        normalizeLog(`[GUI] Removed ${selectedScraped.length} images`),
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

    const episodeGroups =
      ((window as any).__scrapeEpisodeGroups as Array<{
        episodeLabel: string;
        startIndex: number;
        count: number;
      }>) || [];

    // Get currently active deck images (scoped to selected episode or all)
    const currentActiveImages = React.useMemo(() => {
      if (selectedEpisodeIdx === "all" || selectedEpisodeIdx === null) {
        return scrapedImages;
      }
      const grp = typeof selectedEpisodeIdx === "number" ? episodeGroups[selectedEpisodeIdx] : undefined;
      if (!grp) return scrapedImages;
      return scrapedImages.slice(grp.startIndex, grp.startIndex + grp.count);
    }, [scrapedImages, episodeGroups, selectedEpisodeIdx]);

    const handleClearAll = () => {
      setSelectedScraped((prev) => prev.filter((img) => !currentActiveImages.includes(img)));
      setLastSelectedIndex(null);
    };

    const handleSelectAllToggle = () => {
      const activeSelectedCount = currentActiveImages.filter((img) => selectedScraped.includes(img)).length;
      if (activeSelectedCount === currentActiveImages.length && currentActiveImages.length > 0) {
        setSelectedScraped((prev) => prev.filter((img) => !currentActiveImages.includes(img)));
        setLastSelectedIndex(null);
        setConsoleLogs((prev) => ["[GUI] Cleared episode selections", ...prev]);
      } else {
        setSelectedScraped((prev) => Array.from(new Set([...prev, ...currentActiveImages])));
        setConsoleLogs((prev) => ["[GUI] Selected all episode images", ...prev]);
      }
    };

    // Selection / filter helpers (scoped to currentActiveImages)
    const handleInvertSelection = () => {
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter((img) => !currentActiveImages.includes(img));
        const activeInverted = currentActiveImages.filter((img) => !prev.includes(img));
        return [...otherSelected, ...activeInverted];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => ["[GUI] Inverted selection set", ...prev]);
    };

    const handleSelectOdd = () => {
      const oddImages = currentActiveImages.filter((_, idx) => idx % 2 === 0);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter((img) => !currentActiveImages.includes(img));
        return [...otherSelected, ...oddImages];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => ["[GUI] Selected odd-numbered frames", ...prev]);
    };

    const handleSelectEven = () => {
      const evenImages = currentActiveImages.filter((_, idx) => idx % 2 !== 0);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter((img) => !currentActiveImages.includes(img));
        return [...otherSelected, ...evenImages];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => [
        "[GUI] Selected even-numbered frames",
        ...prev,
      ]);
    };

    const handleReverseDeckOrder = () => {
      setScrapedImages((prev) => [...prev].reverse());
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => ["[GUI] Reversed image order", ...prev]);
      addNotification("Reversed image order!", "info");
    };

    const handleSelectFirstN = (n: number) => {
      const clamped = Math.min(Math.max(1, n), currentActiveImages.length);
      const firstNImages = currentActiveImages.slice(0, clamped);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter((img) => !currentActiveImages.includes(img));
        return [...otherSelected, ...firstNImages];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => [
        `[GUI] Selected first ${clamped} frames`,
        ...prev,
      ]);
    };

    const handleSelectLastN = (n: number) => {
      const clamped = Math.min(Math.max(1, n), currentActiveImages.length);
      const lastNImages = currentActiveImages.slice(-clamped);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter((img) => !currentActiveImages.includes(img));
        return [...otherSelected, ...lastNImages];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => [
        `[GUI] Selected last ${clamped} frames`,
        ...prev,
      ]);
    };

    const handleSelectRange = (a: number, b: number) => {
      const lo = Math.max(0, Math.min(a, b) - 1);
      const hi = Math.min(currentActiveImages.length, Math.max(a, b));
      const rangeImages = currentActiveImages.slice(lo, hi);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter((img) => !currentActiveImages.includes(img));
        return [...otherSelected, ...rangeImages];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => [`[GUI] Selected panels ${a} to ${b}`, ...prev]);
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
        normalizeLog(
          `[Stitch Generator] Merging ${selectedScraped.length} selected images vertically...`
        ),
        ...prev,
      ]);

      try {
        const data = await api.mergeImages(activeFetch, {
          urls: selectedScraped,
          layout: "vertical",
          spacing: 0,
          spacingColor: "white",
          scaleToFit: true,
          alignMode: "center",
          padding: 0,
        });

        if (data.url) {
          const firstSelectedIdx = scrapedImages.findIndex((img) =>
            selectedScraped.includes(img)
          );
          setScrapedImages((prev) => {
            const filtered = prev.filter(
              (img) => !selectedScraped.includes(img)
            );
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
            normalizeLog(
              `[Stitch Generator] ✓ Stitching completed! Stored URL: ${data.url}`
            ),
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

    const showEmptyState = !isScraping && scrapedImages.length === 0;
    const showImportLoading = isScraping && scrapedImages.length === 0;

    return (
      <>
        <div
          id="scraped_strips_deck"
          className="bg-neutral-900/40 rounded-2xl border border-neutral-800/80 p-4 sm:p-5 lg:p-6 backdrop-blur-md space-y-4 shadow-sm min-w-0 w-full overflow-hidden"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-neutral-800/60 pb-3">
            <div className="flex items-center gap-3">
              <div className="icon-pill icon-pill--purple">
                <ImageIcon className="h-5 w-5" />
              </div>
              <div className="flex flex-wrap items-center gap-2 min-w-0">
                <h3 className="font-bold text-sm text-neutral-100 truncate">
                  Imported Images
                </h3>
                {scrapedImages.length > 0 && (
                  <span className="text-[10px] px-3 py-1 rounded-full bg-purple-950/60 text-purple-300 border border-purple-800/50 shadow-inner font-mono uppercase tracking-wider">
                    {scrapedImages.length} Frames
                  </span>
                )}
                {isScraping && (
                  <span className="relative inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-950/90 via-purple-900/70 to-indigo-950/90 text-purple-200 border border-purple-500/40 shadow-[0_0_16px_rgba(168,85,247,0.35)] backdrop-blur-md font-mono text-[10px] uppercase tracking-wider overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-transparent via-purple-400/20 to-transparent animate-shimmer-sweep" />
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
                    </span>
                    <RefreshCw className="h-3 w-3 animate-spin text-purple-300 relative z-10" />
                    <span className="font-bold relative z-10 text-purple-100">Extracting HD Panels...</span>
                  </span>
                )}
              </div>
              <EpisodeRatingDisplay rating={rating} likes={likes} views={views} compact={true} />
            </div>

            <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 self-start sm:self-end lg:self-auto w-full lg:w-auto mt-2 lg:mt-0">
              {/* Left-to-Right Horizontal Scroll vs Grid View Toggle */}
              <div className="flex items-center bg-neutral-950 p-1 rounded-xl border border-neutral-800 shadow-inner">
                <button
                  type="button"
                  onClick={() => setViewLayout("scroll")}
                  title="Horizontal Scroll View (Left to Right)"
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewLayout === "scroll"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                >
                  <Rows className="w-3.5 h-3.5" />
                  <span>Scroll</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewLayout("grid")}
                  title="Grid View"
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewLayout === "grid"
                      ? "bg-purple-600 text-white shadow-[0_0_12px_rgba(168,85,247,0.4)]"
                      : "text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900"
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Grid</span>
                </button>
              </div>

              {/* Inline selection toolbar in header (also available in floating bar) */}
              <div className="hidden sm:block">
                <ScraperSelectionToolbar
                  align="down"
                  scrapedImages={currentActiveImages}
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
              </div>

              {handleSaveAssets && scrapedImages.length > 0 && (
                <button
                  type="button"
                  onClick={handleSaveAssets}
                  className="text-[10px] font-bold border border-purple-500/50 bg-purple-600 hover:bg-purple-500 text-white rounded-lg px-3 py-1.5 flex items-center gap-1.5 transition-colors shadow-md active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Save Images
                </button>
              )}
            </div>
          </div>

          {showEmptyState ? (
            <LiveScraperDeckEmptyState />
          ) : showImportLoading ? (
            <ImportImagesLoadingOverlay />
          ) : (
            <div className="space-y-4">

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
              {(() => {
                const episodeGroups =
                  ((window as any).__scrapeEpisodeGroups as Array<{
                    episodeLabel: string;
                    startIndex: number;
                    count: number;
                  }>) || [];

                if (episodeGroups.length > 0) {
                  const rawSortedGroups = getSortedEpisodeGroups(episodeGroups);
                  const sortedGroups = episodeSortAscending
                    ? rawSortedGroups
                    : [...rawSortedGroups].reverse();

                  const filteredGroups = sortedGroups.filter(({ grp }) => {
                    if (!episodeSearchQuery.trim()) return true;
                    const label = formatDisplayEpisodeLabel(grp.episodeLabel).toLowerCase();
                    return label.includes(episodeSearchQuery.toLowerCase());
                  });

                  const visibleGroups =
                    selectedEpisodeIdx === "all"
                      ? sortedGroups.map(({ grp, originalIdx }) => ({ grp, gIdx: originalIdx }))
                      : episodeGroups[selectedEpisodeIdx]
                      ? [{ grp: episodeGroups[selectedEpisodeIdx], gIdx: selectedEpisodeIdx as number }]
                      : sortedGroups.map(({ grp, originalIdx }) => ({ grp, gIdx: originalIdx }));

                  return (
                    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                      {/* IN-PANEL LEFT SIDEBAR: EPISODE NAVIGATOR WITH ALL 6 ENHANCEMENTS */}
                      <aside className="w-full lg:w-56 bg-neutral-950/90 border border-neutral-850 rounded-2xl p-4 shrink-0 space-y-3 shadow-2xl lg:sticky lg:top-24 self-start">
                        {/* Header with Sort Direction Toggle */}
                        <div className="flex items-center justify-between border-b border-neutral-850/80 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse" />
                            <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono">
                              Episodes ({episodeGroups.length})
                            </h4>
                          </div>
                          <button
                            type="button"
                            onClick={() => setEpisodeSortAscending((prev) => !prev)}
                            title="Toggle Sort Order (Ascending / Descending)"
                            className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-900 hover:bg-neutral-850 text-purple-300 border border-neutral-800 rounded-lg transition-all cursor-pointer"
                          >
                            {episodeSortAscending ? "1 → N" : "N → 1"}
                          </button>
                        </div>

                        {/* Search & Filter Bar */}
                        <div className="relative">
                          <input
                            type="text"
                            value={episodeSearchQuery}
                            onChange={(e) => setEpisodeSearchQuery(e.target.value)}
                            placeholder="Search episodes..."
                            className="w-full bg-neutral-900/80 border border-neutral-850 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500/60 font-mono transition-all"
                          />
                          {episodeSearchQuery && (
                            <button
                              type="button"
                              onClick={() => setEpisodeSearchQuery("")}
                              className="absolute right-2.5 top-1.5 text-neutral-400 hover:text-white text-xs font-bold"
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Episodes Scroll List - Hidden Scrollbars */}
                        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto overflow-x-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                          {/* All Episodes Button */}
                          {(() => {
                            const totalScrapedFrames = episodeGroups.length > 0
                              ? episodeGroups.reduce((acc, g) => acc + g.count, 0)
                              : scrapedImages.length;

                            return (
                              <button
                                type="button"
                                onClick={() => setSelectedEpisodeIdx("all")}
                                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                                  selectedEpisodeIdx === "all"
                                    ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                                    : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-850"
                                }`}
                              >
                                <span className="truncate">All Episodes</span>
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-950 text-purple-300 border border-purple-900/40 shrink-0">
                                  {totalScrapedFrames}f
                                </span>
                              </button>
                            );
                          })()}

                          {/* Filtered Episode Cards */}
                          {filteredGroups.map(({ grp, originalIdx }) => {
                            const isSelected = selectedEpisodeIdx === originalIdx;
                            const grpImages = scrapedImages.slice(grp.startIndex, grp.startIndex + grp.count);

                            const activePanels = useProjectStore.getState().activeProjectData?.panels || [];
                            const timelineCountForGrp = activePanels.filter((p) => {
                              if (p.episode_label) return p.episode_label === grp.episodeLabel;
                              return grpImages.includes(p.image_url);
                            }).length;

                            const seconds = grp.count * 4.0;
                            const mins = Math.floor(seconds / 60);
                            const secs = Math.round(seconds % 60);
                            const durationStr = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

                            return (
                              <div key={`ep-wrapper-${originalIdx}`} className="relative group/ep">
                                <button
                                  type="button"
                                  onClick={() => setSelectedEpisodeIdx(originalIdx)}
                                  onMouseEnter={() => setHoveredEpisodeIdx(originalIdx)}
                                  onMouseLeave={() => setHoveredEpisodeIdx(null)}
                                  className={`w-full flex flex-col gap-1 px-3 py-2.5 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                                    isSelected
                                      ? "bg-purple-600/25 border-purple-400 text-purple-200 shadow-[0_0_16px_rgba(168,85,247,0.25)]"
                                      : "bg-neutral-900/40 border-neutral-850 text-neutral-350 hover:text-white hover:bg-neutral-850/80"
                                  }`}
                                >
                                  <div className="flex items-center justify-between gap-1.5 w-full">
                                    <div className="flex items-center gap-2 truncate">
                                      <span
                                        className={`h-2 w-2 rounded-full shrink-0 ${
                                          isSelected ? "bg-purple-400 animate-pulse" : "bg-emerald-500/80"
                                        }`}
                                      />
                                      <span className="truncate">{formatDisplayEpisodeLabel(grp.episodeLabel)}</span>
                                    </div>
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-950 text-purple-300 border border-purple-900/40 shrink-0">
                                      {grp.count}f
                                    </span>
                                  </div>

                                  {/* Episode Duration & Status */}
                                  <div className="flex items-center justify-between text-[9px] text-neutral-400 font-normal pl-4 pt-0.5">
                                    <span>⏱️ {durationStr}</span>
                                    <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">✓ Ready</span>
                                  </div>
                                </button>

                                {/* AI Summary & Hero Frame Tooltip on Hover */}
                                {hoveredEpisodeIdx === originalIdx && (
                                  <div className="absolute left-full top-0 ml-3 z-50 w-56 p-3 bg-neutral-955/95 border border-purple-900/60 rounded-xl shadow-2xl backdrop-blur-md hidden lg:block animate-in fade-in duration-150 pointer-events-none">
                                    <div className="space-y-1.5">
                                      <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                                        <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">
                                          {formatDisplayEpisodeLabel(grp.episodeLabel)}
                                        </span>
                                        <span className="text-[8px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800">
                                          AI Tooltip
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-neutral-400 leading-tight font-mono">
                                        Sequence contains {grp.count} frames (~{durationStr}). Full HD panels scanned.
                                      </p>
                                      {grpImages[0] && (
                                        <div className="w-full h-20 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 mt-1">
                                          <img src={getProxiedImageUrl(grpImages[0], targetUrl)} alt="Hero Preview" className="w-full h-full object-cover" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Quick Tool Actions at Bottom of Sidebar */}
                        <div className="pt-2 border-t border-neutral-850">
                          <button
                            type="button"
                            onClick={() => {
                              if (selectedEpisodeIdx !== "all" && episodeGroups[selectedEpisodeIdx]) {
                                const grp = episodeGroups[selectedEpisodeIdx];
                                const grpImages = scrapedImages.slice(grp.startIndex, grp.startIndex + grp.count);
                                setSelectedScraped((prev) => Array.from(new Set([...prev, ...grpImages])));
                              } else {
                                setSelectedScraped([...scrapedImages]);
                              }
                            }}
                            className="w-full px-3 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-850 text-xs font-mono font-bold text-neutral-300 border border-neutral-800 text-center transition-all cursor-pointer truncate"
                          >
                            ✅ Select All Panels
                          </button>
                        </div>
                      </aside>

                      {/* IN-PANEL RIGHT MAIN AREA: EPISODE IMAGES */}
                      <div className="flex-1 w-full space-y-6 min-w-0">
                        {visibleGroups.map(({ grp, gIdx }) => {
                          const grpImages = scrapedImages.slice(
                            grp.startIndex,
                            grp.startIndex + grp.count
                          );
                          const grpSelectedCount = grpImages.filter((img) =>
                            selectedScraped.includes(img)
                          ).length;

                          return (
                            <div
                              key={`ep-section-${gIdx}`}
                              id={`ep-section-${gIdx}`}
                              className="bg-neutral-955 border border-neutral-850 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl scroll-mt-24"
                            >
                              {/* Episode Section Header */}
                              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-850/80 pb-3">
                                <div className="flex items-center gap-3">
                                  <div className="px-3.5 py-1.5 rounded-xl bg-purple-950/90 border border-purple-800/60 text-purple-200 font-mono text-xs font-bold shadow-md flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400 animate-pulse" />
                                    {formatDisplayEpisodeLabel(grp.episodeLabel)}
                                  </div>
                                  <span className="text-[10px] font-mono font-bold bg-neutral-900 text-neutral-400 px-2.5 py-1 rounded-lg border border-neutral-800">
                                    {grp.count} FRAMES
                                  </span>
                                  {grpSelectedCount > 0 && (
                                    <span className="text-[10px] font-mono font-bold bg-purple-900/60 text-purple-300 px-2.5 py-1 rounded-lg border border-purple-700/50">
                                      {grpSelectedCount} SELECTED
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const allSelected = grpImages.every((u) =>
                                        selectedScraped.includes(u)
                                      );
                                      if (allSelected) {
                                        setSelectedScraped((prev) =>
                                          prev.filter((u) => !grpImages.includes(u))
                                        );
                                      } else {
                                        setSelectedScraped((prev) =>
                                          Array.from(new Set([...prev, ...grpImages]))
                                        );
                                      }
                                    }}
                                    className="text-[10px] font-mono font-bold px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 rounded-xl border border-neutral-800 transition-all cursor-pointer"
                                  >
                                    {grpImages.every((u) => selectedScraped.includes(u))
                                      ? "Deselect Episode"
                                      : "Select Episode Panels"}
                                  </button>
                                </div>
                              </div>

                               {/* Episode Horizontal / Grid Cards */}
                               {viewLayout === "scroll" ? (
                                 <HorizontalScrollContainer>
                                   {grpImages.map((imgUrl, localIdx) => {
                                     const globalIdx = grp.startIndex + localIdx;
                                     const isSelected = selectedScraped.includes(imgUrl);
                                     const proxiedUrl = getProxiedImageUrl(imgUrl, targetUrl);
                                     const activePanels = useProjectStore.getState().activeProjectData?.panels || [];
                                     const isInTimeline = activePanels.some(
                                       (p) => p.image_url === imgUrl || p.image_url === proxiedUrl || p.original_url === imgUrl
                                     );

                                     return (
                                       <PanelCard
                                         key={`${imgUrl}-${globalIdx}`}
                                         imgUrl={proxiedUrl}
                                         rawImgUrl={imgUrl}
                                         idx={globalIdx}
                                         isSelected={isSelected}
                                         isInTimeline={isInTimeline}
                                         isBatchCropping={isBatchCropping}
                                         croppingImgUrl={croppingImgUrl}
                                         bubbleCroppingImgUrl={bubbleCroppingImgUrl}
                                         scrapedImages={scrapedImages}
                                         mergingIndices={mergingIndices}
                                         handleMergeWithNext={handleMergeWithNext}
                                         setScrapedImages={setScrapedImages}
                                         setSelectedScraped={setSelectedScraped}
                                         setConsoleLogs={setConsoleLogs}
                                         addPanelsToStoryboard={addPanelsToStoryboard}
                                         addNotification={addNotification}
                                         onCardClick={handleCardClick}
                                         onCardDoubleClick={handleCardDoubleClick}
                                       />
                                     );
                                   })}
                                 </HorizontalScrollContainer>
                               ) : (
                                 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-1.5 px-1 w-full">
                                   {grpImages.map((imgUrl, localIdx) => {
                                     const globalIdx = grp.startIndex + localIdx;
                                     const isSelected = selectedScraped.includes(imgUrl);
                                     const proxiedUrl = getProxiedImageUrl(imgUrl, targetUrl);
                                     const activePanels = useProjectStore.getState().activeProjectData?.panels || [];
                                     const isInTimeline = activePanels.some(
                                       (p) => p.image_url === imgUrl || p.image_url === proxiedUrl || p.original_url === imgUrl
                                     );

                                     return (
                                       <PanelCard
                                         key={`${imgUrl}-${globalIdx}`}
                                         imgUrl={proxiedUrl}
                                         rawImgUrl={imgUrl}
                                         idx={globalIdx}
                                         isSelected={isSelected}
                                         isInTimeline={isInTimeline}
                                         isBatchCropping={isBatchCropping}
                                         croppingImgUrl={croppingImgUrl}
                                         bubbleCroppingImgUrl={bubbleCroppingImgUrl}
                                         scrapedImages={scrapedImages}
                                         mergingIndices={mergingIndices}
                                         handleMergeWithNext={handleMergeWithNext}
                                         setScrapedImages={setScrapedImages}
                                         setSelectedScraped={setSelectedScraped}
                                         setConsoleLogs={setConsoleLogs}
                                         addPanelsToStoryboard={addPanelsToStoryboard}
                                         addNotification={addNotification}
                                         onCardClick={handleCardClick}
                                         onCardDoubleClick={handleCardDoubleClick}
                                       />
                                     );
                                   })}
                                 </div>
                               )}
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   );
                 }

                 return viewLayout === "scroll" ? (
                   <HorizontalScrollContainer>
                     {scrapedImages.map((imgUrl, idx) => {
                       const isSelected = selectedScraped.includes(imgUrl);
                       const proxiedUrl = imgUrl?.startsWith("/api/")
                         ? imgUrl
                         : `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
                       const activePanels = useProjectStore.getState().activeProjectData?.panels || [];
                       const isInTimeline = activePanels.some(
                         (p) => p.image_url === imgUrl || p.image_url === proxiedUrl || p.original_url === imgUrl
                       );

                       return (
                         <PanelCard
                           key={`${imgUrl}-${idx}`}
                           imgUrl={proxiedUrl}
                           rawImgUrl={imgUrl}
                           idx={idx}
                           isSelected={isSelected}
                           isInTimeline={isInTimeline}
                           isBatchCropping={isBatchCropping}
                           croppingImgUrl={croppingImgUrl}
                           bubbleCroppingImgUrl={bubbleCroppingImgUrl}
                           scrapedImages={scrapedImages}
                           mergingIndices={mergingIndices}
                           handleMergeWithNext={handleMergeWithNext}
                           setScrapedImages={setScrapedImages}
                           setSelectedScraped={setSelectedScraped}
                           setConsoleLogs={setConsoleLogs}
                           addPanelsToStoryboard={addPanelsToStoryboard}
                           addNotification={addNotification}
                           onCardClick={handleCardClick}
                           onCardDoubleClick={handleCardDoubleClick}
                         />
                       );
                     })}

                      {isScraping && [1, 2, 3, 4, 5, 6].map((num) => (
                        <ExtractionSkeletonCard key={`loading-skeleton-${num}`} index={num} isScroll={true} />
                      ))}
                    </HorizontalScrollContainer>
                 ) : (
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 pt-1.5 px-1 w-full">
                     {scrapedImages.map((imgUrl, idx) => {
                       const isSelected = selectedScraped.includes(imgUrl);
                       const proxiedUrl = imgUrl?.startsWith("/api/")
                         ? imgUrl
                         : `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
                       const activePanels = useProjectStore.getState().activeProjectData?.panels || [];
                       const isInTimeline = activePanels.some(
                         (p) => p.image_url === imgUrl || p.image_url === proxiedUrl || p.original_url === imgUrl
                       );

                       return (
                         <PanelCard
                           key={`${imgUrl}-${idx}`}
                           imgUrl={proxiedUrl}
                           rawImgUrl={imgUrl}
                           idx={idx}
                           isSelected={isSelected}
                           isInTimeline={isInTimeline}
                           isBatchCropping={isBatchCropping}
                           croppingImgUrl={croppingImgUrl}
                           bubbleCroppingImgUrl={bubbleCroppingImgUrl}
                           scrapedImages={scrapedImages}
                           mergingIndices={mergingIndices}
                           handleMergeWithNext={handleMergeWithNext}
                           setScrapedImages={setScrapedImages}
                           setSelectedScraped={setSelectedScraped}
                           setConsoleLogs={setConsoleLogs}
                           addPanelsToStoryboard={addPanelsToStoryboard}
                           addNotification={addNotification}
                           onCardClick={handleCardClick}
                           onCardDoubleClick={handleCardDoubleClick}
                         />
                        );
                      })}

                      {isScraping && (
                        <ExtractionSkeletonCard
                          key={`loading-skeleton-${scrapedImages.length + 1}`}
                          index={scrapedImages.length + 1}
                          isScroll={false}
                        />
                      )}
                    </div>
                 );
              })()}
            </div>
          )}
        </div>

        {/* Floating Selection Action Bar */}
        {true && (
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
            handleDownloadZip={handleDownloadZip}
            isZipping={isZipping}
            // selection/filter props
            scrapedImages={scrapedImages}
            selectedScraped={selectedScraped}
            setSelectedScraped={setSelectedScraped}
            handleInvertSelection={handleInvertSelection}
            handleSelectOdd={handleSelectOdd}
            handleSelectEven={handleSelectEven}
            handleReverseDeckOrder={handleReverseDeckOrder}
            handleSelectFirstN={handleSelectFirstN}
            handleSelectLastN={handleSelectLastN}
            handleSelectRange={handleSelectRange}
            showAutoCropModal={showAutoCropModal}
            showBubbleModal={showBubbleModal}
            setShowAutoCropModal={setShowAutoCropModal}
            setShowBubbleModal={setShowBubbleModal}
            handleCancelBatch={handleCancelBatch}
            setScrapedImages={setScrapedImages}
            fetchWithInterceptor={fetchWithInterceptor}
            addNotification={addNotification}
          />
        )}

        {/* Delete Imported Frames Confirmation Modal */}
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
                        Delete Selected Images?
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
);

export default LiveScraperDeck;
