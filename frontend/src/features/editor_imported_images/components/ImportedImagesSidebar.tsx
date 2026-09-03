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
  Save,
  PanelLeft,
  PanelLeftClose,
  CheckSquare,
  Square,
  Scissors,
  Sparkles,
  Link2,
  Plus,
} from "lucide-react";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as api from "@/api/index";
import { useProjectStore } from "@/shared/hooks/useProjectStore";
import { ChapterScraperDeckProps } from "./types";
import PanelCard from "./PanelCard";
import ChapterScraperDeckEmptyState from "./ImportedImagesDeckEmptyState";
import ImportedAssetsHeader from "./ImportedAssetsHeader";
import { AssetFilterStatus } from "./ImportedAssetsFilterBar";

import { getSourceName, getProxiedImageUrl } from "@/utils";
import { updateSelection } from "@/shared/utils/selection";
import { ChapterRatingDisplay } from "@/features/workspace_scraper/chapter-scraper/components/ChapterRatingDisplay";
const EpisodeRatingDisplay = ChapterRatingDisplay;
import { ExtractionSkeletonCard } from "@/shared/ui/loading/ExtractionSkeletonCard";
import { ImportImagesOverlay } from "@/shared/ui/loading/ImportImagesOverlay";

export function formatDisplayEpisodeLabel(label: string): string {
  if (!label) return "Episode";
  const trimmed = label.trim();
  const duplicateMatch = trimmed.match(
    /^(Episode\s*\d+|Chapter\s*\d+|Ep\.\s*\d+)\s*[-:]\s*\1(.*)$/i
  );
  if (duplicateMatch) {
    const main = duplicateMatch[1];
    const rest = duplicateMatch[2]?.replace(/^[-:\s]+/, "").trim();
    return rest ? `${main}: ${rest}` : main;
  }
  const trailingTruncateMatch = trimmed.match(
    /^(Episode\s*\d+|Chapter\s*\d+|Ep\.\s*\d+)\s*[-:]\s*E(?:\.\.\.|\s*)$/i
  );
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

  return mapped.sort(
    (a, b) => parseNum(a.grp.episodeLabel) - parseNum(b.grp.episodeLabel)
  );
}

export const HorizontalScrollContainer: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = "" }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const animFrameRef = useRef<number | null>(null);

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

    const onScroll = () => {
      if (animFrameRef.current !== null) return;
      animFrameRef.current = requestAnimationFrame(() => {
        checkScroll();
        animFrameRef.current = null;
      });
    };

    el.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const handleNativeWheel = (e: WheelEvent) => {
      const delta =
        Math.abs(e.deltaX) >= Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      if (delta !== 0) {
        const maxScroll = el.scrollWidth - el.clientWidth;
        if (maxScroll <= 0) return;

        const isScrollingRight = delta > 0;
        const isScrollingLeft = delta < 0;

        const canRight = el.scrollLeft < maxScroll - 1;
        const canLeft = el.scrollLeft > 1;

        if ((isScrollingRight && canRight) || (isScrollingLeft && canLeft)) {
          e.preventDefault();
          // Fast responsive scroll
          el.scrollLeft += delta * 1.5;
        }
      }
    };

    el.addEventListener("wheel", handleNativeWheel, { passive: false });

    const observer = new ResizeObserver(() => checkScroll());
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", checkScroll);
      el.removeEventListener("wheel", handleNativeWheel);
      observer.disconnect();
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [checkScroll]);

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
    <div className="w-full min-w-0 flex items-center gap-2 relative">
      {/* Left Arrow */}
      {canScrollLeft && (
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Scroll Left"
          title="Scroll Left"
          className="shrink-0 w-8 h-8 rounded-full bg-neutral-900/90 hover:bg-purple-600 border border-neutral-700/80 hover:border-purple-400 text-purple-300 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      )}

      {/* Scroll Track — ultra-smooth, hardware accelerated horizontal scrolling */}
      <div
        ref={scrollRef}
        className={`flex-1 min-w-0 flex gap-4 overflow-x-auto pb-3 pt-3.5 custom-purple-scrollbar select-none overscroll-x-contain [transform:translateZ(0)] ${className}`}
      >
        {children}
      </div>

      {/* Right Arrow */}
      {canScrollRight && (
        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Scroll Right"
          title="Scroll Right"
          className="shrink-0 w-8 h-8 rounded-full bg-neutral-900/90 hover:bg-purple-600 border border-neutral-700/80 hover:border-purple-400 text-purple-300 hover:text-white shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

const ChapterScraperDeck = React.memo(
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
  }: ChapterScraperDeckProps) => {
    const [isZipping, setIsZipping] = useState(false);
    const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
      null
    );
    const [isBatchMerging, setIsBatchMerging] = useState(false);
    const [viewLayout, setViewLayout] = useState<"scroll" | "grid">("scroll");
    const [selectedEpisodeIdx, setSelectedEpisodeIdx] = useState<
      number | "all"
    >("all");
    const [episodeSearchQuery, setEpisodeSearchQuery] = useState("");
    const [episodeSortAscending, setEpisodeSortAscending] = useState(true);
    const [hoveredEpisodeIdx, setHoveredEpisodeIdx] = useState<number | null>(
      null
    );
    const [assetSearchQuery, setAssetSearchQuery] = useState("");
    const [assetFilterStatus, setAssetFilterStatus] =
      useState<AssetFilterStatus>("all");
    const [assetSortOrder, setAssetSortOrder] = useState<"asc" | "desc">("asc");

    const imageDimensionsRef = useRef<Map<string, { width: number; height: number }>>(
      new Map()
    );

    useEffect(() => {
      scrapedImages.forEach((imgUrl) => {
        if (!imageDimensionsRef.current.has(imgUrl)) {
          const proxied = getProxiedImageUrl(imgUrl, targetUrl);
          const img = new Image();
          img.src = proxied;
          img.onload = () => {
            if (img.naturalWidth && img.naturalHeight) {
              imageDimensionsRef.current.set(imgUrl, {
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }
          };
        }
      });
    }, [scrapedImages, targetUrl]);

    const isEpisodeCollapsed = useProjectStore((s) => s.isEpisodeCollapsed);
    const setIsEpisodeCollapsed = useProjectStore(
      (s) => s.setIsEpisodeCollapsed
    );
    const activePanelsList = useProjectStore(
      (s) => s.activeProjectData?.panels || []
    );
    const activeFetch = fetchWithInterceptor || fetch;

    const inStoryboardCount = React.useMemo(() => {
      return scrapedImages.filter((imgUrl) => {
        const proxiedUrl = getProxiedImageUrl(imgUrl, targetUrl);
        return activePanelsList.some(
          (p) =>
            p.image_url === imgUrl ||
            p.image_url === proxiedUrl ||
            p.original_url === imgUrl
        );
      }).length;
    }, [scrapedImages, activePanelsList, targetUrl]);

    const filterAndSortImages = useCallback(
      (imagesList: string[], startGlobalIdx: number = 0) => {
        let indexed = imagesList.map((imgUrl, localIdx) => ({
          imgUrl,
          localIdx,
          globalIdx: startGlobalIdx + localIdx,
        }));

        if (assetSearchQuery.trim()) {
          const rawQ = assetSearchQuery.trim();
          const cleanQ = rawQ.replace(/^#/, "").trim().toLowerCase();
          const isNumeric = /^\d+$/.test(cleanQ);

          indexed = indexed.filter(({ imgUrl, localIdx, globalIdx }) => {
            const frameNum = globalIdx + 1;
            const localNum = localIdx + 1;

            if (isNumeric) {
              const targetNum = parseInt(cleanQ, 10);
              return (
                frameNum === targetNum ||
                localNum === targetNum ||
                frameNum.toString().startsWith(cleanQ) ||
                localNum.toString().startsWith(cleanQ)
              );
            }

            const searchTerms = [
              `#${frameNum}`,
              `frame ${frameNum}`,
              `page ${frameNum}`,
              `#${localNum}`,
            ];
            const matchesTextTerm = searchTerms.some((t) =>
              t.includes(cleanQ)
            );
            const filename = imgUrl.split("/").pop()?.toLowerCase() || "";
            const matchesFilename = filename.includes(cleanQ);

            return matchesTextTerm || matchesFilename;
          });
        }

        if (assetFilterStatus === "selected") {
          indexed = indexed.filter(({ imgUrl }) =>
            selectedScraped.includes(imgUrl)
          );
        } else if (assetFilterStatus === "in_storyboard") {
          indexed = indexed.filter(({ imgUrl }) => {
            const proxiedUrl = getProxiedImageUrl(imgUrl, targetUrl);
            return activePanelsList.some(
              (p) =>
                p.image_url === imgUrl ||
                p.image_url === proxiedUrl ||
                p.original_url === imgUrl
            );
          });
        } else if (assetFilterStatus === "not_in_storyboard") {
          indexed = indexed.filter(({ imgUrl }) => {
            const proxiedUrl = getProxiedImageUrl(imgUrl, targetUrl);
            return !activePanelsList.some(
              (p) =>
                p.image_url === imgUrl ||
                p.image_url === proxiedUrl ||
                p.original_url === imgUrl
            );
          });
        } else if (assetFilterStatus === "portrait") {
          indexed = indexed.filter(({ imgUrl }) => {
            const dim = imageDimensionsRef.current.get(imgUrl);
            if (!dim) return true;
            const ratio = dim.width / dim.height;
            return ratio <= 1.25 && ratio >= 0.6;
          });
        } else if (assetFilterStatus === "landscape") {
          indexed = indexed.filter(({ imgUrl }) => {
            const dim = imageDimensionsRef.current.get(imgUrl);
            if (!dim) return true;
            return dim.width / dim.height > 1.25;
          });
        } else if (assetFilterStatus === "tall_strip") {
          indexed = indexed.filter(({ imgUrl }) => {
            const dim = imageDimensionsRef.current.get(imgUrl);
            if (!dim) return true;
            const ratio = dim.width / dim.height;
            return ratio < 0.6 && ratio >= 0.28;
          });
        } else if (assetFilterStatus === "too_tall_strip") {
          indexed = indexed.filter(({ imgUrl }) => {
            const dim = imageDimensionsRef.current.get(imgUrl);
            if (!dim) return true;
            const ratio = dim.width / dim.height;
            return ratio < 0.28;
          });
        }

        if (assetSortOrder === "desc") {
          indexed = [...indexed].reverse();
        }

        return indexed;
      },
      [
        assetSearchQuery,
        assetFilterStatus,
        assetSortOrder,
        selectedScraped,
        activePanelsList,
        targetUrl,
      ]
    );

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
          setSelectedScraped(
            (prev) =>
              updateSelection(prev, {
                type: "range",
                items: rangeUrls,
              }) as string[]
          );
        } else if (ctrlOrMeta) {
          setSelectedScraped(
            (prev) =>
              updateSelection(prev, {
                type: "toggle",
                item: imgUrl,
              }) as string[]
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
        setSelectedScraped(
          (prev) =>
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
      const proj = useProjectStore.getState().activeProjectData?.project;
      const source = targetUrl ? getSourceName(targetUrl) : "";
      const title = proj?.title || "";
      const ep = proj?.episode || "";
      const parts: string[] = [];

      if (source && source.toLowerCase() !== "custom source") {
        parts.push(makeSafeFilename(source));
      }
      if (title && title.trim()) {
        parts.push(makeSafeFilename(title.trim()));
      }
      if (ep && ep.trim()) {
        parts.push(makeSafeFilename(ep.trim()));
      }
      if (parts.length > 0) {
        return `${parts.join("_")}.zip`;
      }
      return "webtoon_frames.zip";
    };

    const handleDownloadZip = async () => {
      const toDownload =
        selectedScraped.length > 0 ? selectedScraped : scrapedImages;
      if (toDownload.length === 0) return;
      console.log(
        "[ChapterScraperDeck] Starting ZIP download for",
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
        document.body.style.overflow = "";
        if (container) container.style.overflow = "";
      }
      return () => {
        document.body.style.overflow = "";
        if (container) container.style.overflow = "";
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
      const grp =
        typeof selectedEpisodeIdx === "number"
          ? episodeGroups[selectedEpisodeIdx]
          : undefined;
      if (!grp) return scrapedImages;
      return scrapedImages.slice(grp.startIndex, grp.startIndex + grp.count);
    }, [scrapedImages, episodeGroups, selectedEpisodeIdx]);

    const handleClearAll = () => {
      setSelectedScraped((prev) =>
        prev.filter((img) => !currentActiveImages.includes(img))
      );
      setLastSelectedIndex(null);
    };

    const handleSelectAllToggle = () => {
      const activeSelectedCount = currentActiveImages.filter((img) =>
        selectedScraped.includes(img)
      ).length;
      if (
        activeSelectedCount === currentActiveImages.length &&
        currentActiveImages.length > 0
      ) {
        setSelectedScraped((prev) =>
          prev.filter((img) => !currentActiveImages.includes(img))
        );
        setLastSelectedIndex(null);
        setConsoleLogs((prev) => ["[GUI] Cleared episode selections", ...prev]);
      } else {
        setSelectedScraped((prev) =>
          Array.from(new Set([...prev, ...currentActiveImages]))
        );
        setConsoleLogs((prev) => [
          "[GUI] Selected all episode images",
          ...prev,
        ]);
      }
    };

    // Selection / filter helpers (scoped to currentActiveImages)
    const handleInvertSelection = () => {
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter(
          (img) => !currentActiveImages.includes(img)
        );
        const activeInverted = currentActiveImages.filter(
          (img) => !prev.includes(img)
        );
        return [...otherSelected, ...activeInverted];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => ["[GUI] Inverted selection set", ...prev]);
    };

    const handleSelectOdd = () => {
      const oddImages = currentActiveImages.filter((_, idx) => idx % 2 === 0);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter(
          (img) => !currentActiveImages.includes(img)
        );
        return [...otherSelected, ...oddImages];
      });
      setLastSelectedIndex(null);
      setConsoleLogs((prev) => ["[GUI] Selected odd-numbered frames", ...prev]);
    };

    const handleSelectEven = () => {
      const evenImages = currentActiveImages.filter((_, idx) => idx % 2 !== 0);
      setSelectedScraped((prev) => {
        const otherSelected = prev.filter(
          (img) => !currentActiveImages.includes(img)
        );
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
        const otherSelected = prev.filter(
          (img) => !currentActiveImages.includes(img)
        );
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
        const otherSelected = prev.filter(
          (img) => !currentActiveImages.includes(img)
        );
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
        const otherSelected = prev.filter(
          (img) => !currentActiveImages.includes(img)
        );
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
        "[ChapterScraperDeck] Starting batch vertical merge for",
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
          className="bg-[#0c0d16]/40 backdrop-blur-2xl rounded-3xl border border-white/10 p-3 sm:p-4 lg:p-4 space-y-2.5 shadow-[0_10px_40px_rgba(0,0,0,0.6)] min-w-0 w-full min-h-[190px] flex-1 flex flex-col overflow-hidden"
        >
          <ImportedAssetsHeader
            scrapedImagesLength={scrapedImages.length}
            selectedScrapedLength={selectedScraped.length}
            viewLayout={viewLayout}
            setViewLayout={setViewLayout}
            handleSelectAllToggle={handleSelectAllToggle}
            handleClearAll={handleClearAll}
            handleSelectOdd={handleSelectOdd}
            handleSelectEven={handleSelectEven}
            handleInvertSelection={handleInvertSelection}
            handleAddToStoryboard={handleAddToStoryboard}
            handleAutoCropSelected={handleAutoCropSelected}
            handleCleanBubblesSelected={handleCleanBubblesSelected}
            handleBatchMergeSelected={handleBatchMergeSelected}
            handleDeleteSelected={handleDeleteSelected}
            handleCancelBatch={handleCancelBatch}
            handleSaveAssets={handleSaveAssets}
            isBatchCropping={isBatchCropping}
            batchProgress={batchProgress}
            isCleaningBubbles={isCleaningBubbles}
            cleanProgress={cleanProgress}
            isBatchMerging={isBatchMerging}
            isEpisodeCollapsed={isEpisodeCollapsed}
            setIsEpisodeCollapsed={setIsEpisodeCollapsed}
            hasMultipleEpisodes={(() => {
              const headerEpisodeGroups =
                ((window as any).__scrapeEpisodeGroups as Array<{
                  episodeLabel: string;
                  startIndex: number;
                  count: number;
                }>) || [];
              return headerEpisodeGroups.length > 1;
            })()}
            searchQuery={assetSearchQuery}
            setSearchQuery={setAssetSearchQuery}
            filterStatus={assetFilterStatus}
            setFilterStatus={setAssetFilterStatus}
            sortOrder={assetSortOrder}
            setSortOrder={setAssetSortOrder}
            filteredCount={filterAndSortImages(scrapedImages).length}
            inStoryboardCount={inStoryboardCount}
          />

          {showEmptyState ? (
            <ChapterScraperDeckEmptyState />
          ) : showImportLoading ? (
            <ImportImagesOverlay />
          ) : (
            <div className="space-y-4">
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
                    const label = formatDisplayEpisodeLabel(
                      grp.episodeLabel
                    ).toLowerCase();
                    return label.includes(episodeSearchQuery.toLowerCase());
                  });

                  const visibleGroups =
                    selectedEpisodeIdx === "all"
                      ? sortedGroups.map(({ grp, originalIdx }) => ({
                          grp,
                          gIdx: originalIdx,
                        }))
                      : episodeGroups[selectedEpisodeIdx]
                      ? [
                          {
                            grp: episodeGroups[selectedEpisodeIdx],
                            gIdx: selectedEpisodeIdx as number,
                          },
                        ]
                      : sortedGroups.map(({ grp, originalIdx }) => ({
                          grp,
                          gIdx: originalIdx,
                        }));

                  return (
                    <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                      {/* IN-PANEL LEFT SIDEBAR: EPISODE NAVIGATOR */}
                      <aside
                        className={`relative bg-[#0c0d16]/70 border border-white/10 backdrop-blur-xl rounded-2xl shrink-0 shadow-2xl lg:sticky lg:top-24 self-start transition-all duration-300 overflow-hidden ${
                          isEpisodeCollapsed
                            ? "w-10 p-2"
                            : "w-full lg:w-56 p-4 space-y-3"
                        }`}
                      >
                        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500 opacity-80" />

                        {/* Collapsed state — just a vertical icon strip */}
                        {isEpisodeCollapsed ? (
                          <button
                            type="button"
                            onClick={() => setIsEpisodeCollapsed(false)}
                            title="Open Episode Navigator"
                            className="w-full flex flex-col items-center gap-2 pt-2 cursor-pointer group"
                          >
                            <PanelLeft className="w-4 h-4 text-purple-400 group-hover:text-purple-300 transition-colors" />
                            <span
                              className="text-[8px] font-black font-mono uppercase text-neutral-500 group-hover:text-purple-400 transition-colors tracking-widest"
                              style={{
                                writingMode: "vertical-rl",
                                textOrientation: "mixed",
                                transform: "rotate(180deg)",
                              }}
                            >
                              Episodes
                            </span>
                          </button>
                        ) : (
                          <>
                            {/* Expanded header */}
                            <div className="relative flex items-center justify-between gap-2 border-b border-neutral-850/80 pb-3 pt-1.5">
                              <div className="min-w-0 flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full bg-purple-400 animate-pulse shadow-[0_0_8px_rgba(168,85,247,0.45)] shrink-0" />
                                <div className="min-w-0">
                                  <h4 className="text-xs font-black text-white uppercase tracking-wider font-mono truncate">
                                    Episodes
                                  </h4>
                                  <p className="text-[10px] text-neutral-400 font-mono">
                                    {episodeGroups.length} loaded
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEpisodeSortAscending((prev) => !prev)
                                  }
                                  title="Toggle Sort Order"
                                  className="px-2 py-0.5 text-[9px] font-mono font-bold bg-neutral-900 hover:bg-neutral-850 text-purple-300 border border-neutral-800 rounded-lg transition-all cursor-pointer"
                                >
                                  {episodeSortAscending ? "1→N" : "N→1"}
                                </button>
                                {/* Close toggle */}
                                <button
                                  type="button"
                                  onClick={() => setIsEpisodeCollapsed(true)}
                                  title="Hide Episode Navigator"
                                  className="w-6 h-6 flex items-center justify-center rounded-lg bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-500 hover:text-white transition-all cursor-pointer"
                                >
                                  <PanelLeftClose className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Search & Filter Bar */}
                            <div className="relative">
                              <input
                                type="text"
                                value={episodeSearchQuery}
                                onChange={(e) =>
                                  setEpisodeSearchQuery(e.target.value)
                                }
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

                            {/* Episodes Scroll List */}
                            <div className="space-y-1.5 max-h-[55vh] overflow-y-auto overflow-x-hidden p-1 pt-2 pb-2 custom-purple-scrollbar">
                              {/* All Episodes Button */}
                              {(() => {
                                const totalScrapedFrames =
                                  episodeGroups.length > 0
                                    ? episodeGroups.reduce(
                                        (acc, g) => acc + g.count,
                                        0
                                      )
                                    : scrapedImages.length;

                                return (
                                  <button
                                    type="button"
                                    title={`Show all episodes — ${totalScrapedFrames} frames total`}
                                    onClick={() => setSelectedEpisodeIdx("all")}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-mono font-bold transition-all text-left cursor-pointer border ${
                                      selectedEpisodeIdx === "all"
                                        ? "bg-purple-600/25 border-purple-500/60 text-white shadow-[0_0_14px_rgba(168,85,247,0.25)]"
                                        : "bg-neutral-900/60 border-neutral-850 text-neutral-400 hover:text-white hover:bg-neutral-850"
                                    }`}
                                  >
                                    <span className="truncate">
                                      All Episodes
                                    </span>
                                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-950 text-purple-300 border border-purple-900/40 shrink-0">
                                      {totalScrapedFrames}f
                                    </span>
                                  </button>
                                );
                              })()}

                              {/* Filtered Episode Cards */}
                              {filteredGroups.map(({ grp, originalIdx }) => {
                                const isSelected =
                                  selectedEpisodeIdx === originalIdx;
                                const grpImages = scrapedImages.slice(
                                  grp.startIndex,
                                  grp.startIndex + grp.count
                                );

                                const activePanels =
                                  useProjectStore.getState().activeProjectData
                                    ?.panels || [];
                                const timelineCountForGrp = activePanels.filter(
                                  (p) => {
                                    if (p.episode_label)
                                      return (
                                        p.episode_label === grp.episodeLabel
                                      );
                                    return grpImages.includes(p.image_url);
                                  }
                                ).length;

                                const seconds = grp.count * 4.0;
                                const mins = Math.floor(seconds / 60);
                                const secs = Math.round(seconds % 60);
                                const durationStr =
                                  mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;

                                return (
                                  <div
                                    key={`ep-wrapper-${originalIdx}`}
                                    className="relative group/ep"
                                  >
                                    <button
                                      type="button"
                                      title={`${formatDisplayEpisodeLabel(
                                        grp.episodeLabel
                                      )} — ${
                                        grp.count
                                      } frames · ${durationStr}`}
                                      onClick={() =>
                                        setSelectedEpisodeIdx(originalIdx)
                                      }
                                      onMouseEnter={() =>
                                        setHoveredEpisodeIdx(originalIdx)
                                      }
                                      onMouseLeave={() =>
                                        setHoveredEpisodeIdx(null)
                                      }
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
                                              isSelected
                                                ? "bg-purple-400 animate-pulse"
                                                : "bg-emerald-500/80"
                                            }`}
                                          />
                                          <span className="truncate">
                                            {formatDisplayEpisodeLabel(
                                              grp.episodeLabel
                                            )}
                                          </span>
                                        </div>
                                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-950 text-purple-300 border border-purple-900/40 shrink-0">
                                          {grp.count}f
                                        </span>
                                      </div>

                                      {/* Episode Duration & Status */}
                                      <div className="flex items-center justify-between text-[9px] text-neutral-400 font-normal pl-4 pt-0.5">
                                        <span>⏱️ {durationStr}</span>
                                        <span className="text-emerald-400 font-bold uppercase tracking-wider text-[8px]">
                                          ✓ Ready
                                        </span>
                                      </div>
                                    </button>

                                    {/* AI Summary & Hero Frame Tooltip on Hover */}
                                    {hoveredEpisodeIdx === originalIdx && (
                                      <div className="absolute left-full top-0 ml-3 z-50 w-56 p-3 bg-neutral-955/95 border border-purple-900/60 rounded-xl shadow-2xl backdrop-blur-md hidden lg:block animate-in fade-in duration-150 pointer-events-none">
                                        <div className="space-y-1.5">
                                          <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
                                            <span className="text-[10px] font-black text-purple-300 uppercase tracking-wider">
                                              {formatDisplayEpisodeLabel(
                                                grp.episodeLabel
                                              )}
                                            </span>
                                            <span className="text-[8px] bg-purple-950 text-purple-400 px-1.5 py-0.5 rounded border border-purple-800">
                                              AI Tooltip
                                            </span>
                                          </div>
                                          <p className="text-[10px] text-neutral-400 leading-tight font-mono">
                                            Sequence contains {grp.count} frames
                                            (~{durationStr}). Full HD panels
                                            scanned.
                                          </p>
                                          {grpImages[0] && (
                                            <div className="w-full h-20 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-900 mt-1">
                                              <img
                                                src={getProxiedImageUrl(
                                                  grpImages[0],
                                                  targetUrl
                                                )}
                                                alt="Hero Preview"
                                                className="w-full h-full object-cover"
                                              />
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
                                  if (
                                    selectedScraped.length ===
                                    scrapedImages.length
                                  ) {
                                    setSelectedScraped([]);
                                  } else {
                                    setSelectedScraped([...scrapedImages]);
                                  }
                                }}
                                className="w-full px-3.5 py-2.5 rounded-2xl bg-neutral-900/80 hover:bg-purple-500/10 text-xs font-sans font-bold text-neutral-200 border border-neutral-800 hover:border-purple-500/30 text-center transition-all glass-interactive active:scale-95 cursor-pointer truncate shadow-sm"
                              >
                                ✅ Select All Panels
                              </button>
                            </div>
                          </>
                        )}
                      </aside>

                      {/* IN-PANEL RIGHT MAIN AREA: EPISODE IMAGES */}
                      <div className="flex-1 w-full space-y-6 min-w-0">
                        {visibleGroups.map(({ grp, gIdx }) => {
                          const grpImages = scrapedImages.slice(
                            grp.startIndex,
                            grp.startIndex + grp.count
                          );
                          return (
                            <div
                              key={`ep-section-${gIdx}`}
                              id={`ep-section-${gIdx}`}
                              className="bg-[#0c0d16]/70 border border-white/10 backdrop-blur-xl rounded-2xl p-4 sm:p-5 space-y-3 shadow-xl scroll-mt-24"
                            >
                              {/* Episode Horizontal / Grid Cards */}
                              {(() => {
                                const processedGrp = filterAndSortImages(
                                  grpImages,
                                  grp.startIndex
                                );

                                if (processedGrp.length === 0) {
                                  return (
                                    <div className="p-4 text-center text-xs font-mono text-neutral-500 bg-neutral-950/40 rounded-xl border border-neutral-900">
                                      No frames match the active filter in this episode.
                                    </div>
                                  );
                                }

                                return viewLayout === "scroll" ? (
                                  <HorizontalScrollContainer>
                                    {processedGrp.map(
                                      ({ imgUrl, localIdx, globalIdx }) => {
                                        const isSelected =
                                          selectedScraped.includes(imgUrl);
                                        const proxiedUrl = getProxiedImageUrl(
                                          imgUrl,
                                          targetUrl
                                        );
                                        const isInTimeline =
                                          activePanelsList.some(
                                            (p) =>
                                              p.image_url === imgUrl ||
                                              p.image_url === proxiedUrl ||
                                              p.original_url === imgUrl
                                          );

                                        return (
                                          <PanelCard
                                            key={`${imgUrl}-${globalIdx}`}
                                            imgUrl={proxiedUrl}
                                            rawImgUrl={imgUrl}
                                            idx={globalIdx}
                                            displayIdx={localIdx}
                                            isSelected={isSelected}
                                            isInTimeline={isInTimeline}
                                            isBatchCropping={isBatchCropping}
                                            croppingImgUrl={croppingImgUrl}
                                            bubbleCroppingImgUrl={
                                              bubbleCroppingImgUrl
                                            }
                                            scrapedImages={scrapedImages}
                                            mergingIndices={mergingIndices}
                                            handleMergeWithNext={
                                              handleMergeWithNext
                                            }
                                            setScrapedImages={setScrapedImages}
                                            setSelectedScraped={
                                              setSelectedScraped
                                            }
                                            setConsoleLogs={setConsoleLogs}
                                            addPanelsToStoryboard={
                                              addPanelsToStoryboard
                                            }
                                            addNotification={addNotification}
                                            onCardClick={handleCardClick}
                                            onCardDoubleClick={
                                              handleCardDoubleClick
                                            }
                                            viewLayout="scroll"
                                          />
                                        );
                                      }
                                    )}
                                  </HorizontalScrollContainer>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pt-3.5 px-1 w-full">
                                    {processedGrp.map(
                                      ({ imgUrl, localIdx, globalIdx }) => {
                                        const isSelected =
                                          selectedScraped.includes(imgUrl);
                                        const proxiedUrl = getProxiedImageUrl(
                                          imgUrl,
                                          targetUrl
                                        );
                                        const isInTimeline =
                                          activePanelsList.some(
                                            (p) =>
                                              p.image_url === imgUrl ||
                                              p.image_url === proxiedUrl ||
                                              p.original_url === imgUrl
                                          );

                                        return (
                                          <PanelCard
                                            key={`${imgUrl}-${globalIdx}`}
                                            imgUrl={proxiedUrl}
                                            rawImgUrl={imgUrl}
                                            idx={globalIdx}
                                            displayIdx={localIdx}
                                            isSelected={isSelected}
                                            isInTimeline={isInTimeline}
                                            isBatchCropping={isBatchCropping}
                                            croppingImgUrl={croppingImgUrl}
                                            bubbleCroppingImgUrl={
                                              bubbleCroppingImgUrl
                                            }
                                            scrapedImages={scrapedImages}
                                            mergingIndices={mergingIndices}
                                            handleMergeWithNext={
                                              handleMergeWithNext
                                            }
                                            setScrapedImages={setScrapedImages}
                                            setSelectedScraped={
                                              setSelectedScraped
                                            }
                                            setConsoleLogs={setConsoleLogs}
                                            addPanelsToStoryboard={
                                              addPanelsToStoryboard
                                            }
                                            addNotification={addNotification}
                                            onCardClick={handleCardClick}
                                            onCardDoubleClick={
                                              handleCardDoubleClick
                                            }
                                            viewLayout="grid"
                                          />
                                        );
                                      }
                                    )}
                                  </div>
                                );
                              })()}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                const processedFlat = filterAndSortImages(scrapedImages, 0);

                if (processedFlat.length === 0 && scrapedImages.length > 0) {
                  return (
                    <div className="p-8 text-center text-xs font-mono text-neutral-400 bg-neutral-950/40 rounded-2xl border border-neutral-850 space-y-2">
                      <p className="text-neutral-300 font-bold">No assets match your search/filter criteria.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setAssetSearchQuery("");
                          setAssetFilterStatus("all");
                          setAssetSortOrder("asc");
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 transition-all text-[11px] font-mono cursor-pointer"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  );
                }

                return viewLayout === "scroll" ? (
                  <HorizontalScrollContainer>
                    {processedFlat.map(({ imgUrl, globalIdx }) => {
                      const isSelected = selectedScraped.includes(imgUrl);
                      const proxiedUrl = imgUrl?.startsWith("/api/")
                        ? imgUrl
                        : `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
                      const isInTimeline = activePanelsList.some(
                        (p) =>
                          p.image_url === imgUrl ||
                          p.image_url === proxiedUrl ||
                          p.original_url === imgUrl
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
                          viewLayout="scroll"
                        />
                      );
                    })}

                    {isScraping && scrapedImages.length > 0 && (
                      <div className="shrink-0 flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 w-[140px] text-center gap-2 text-neutral-500">
                        <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
                        <span className="text-[10px] font-mono uppercase tracking-wider font-medium">
                          Extracting...
                        </span>
                      </div>
                    )}
                  </HorizontalScrollContainer>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3 sm:gap-4 pt-3.5 px-1 w-full">
                    {processedFlat.map(({ imgUrl, globalIdx }) => {
                      const isSelected = selectedScraped.includes(imgUrl);
                      const proxiedUrl = imgUrl?.startsWith("/api/")
                        ? imgUrl
                        : `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`;
                      const isInTimeline = activePanelsList.some(
                        (p) =>
                          p.image_url === imgUrl ||
                          p.image_url === proxiedUrl ||
                          p.original_url === imgUrl
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
                          viewLayout="grid"
                        />
                      );
                    })}

                    {isScraping && scrapedImages.length > 0 && (
                      <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/40 min-h-[200px] text-center gap-2 text-neutral-500">
                        <Loader2 className="w-5 h-5 text-purple-400 animate-spin" />
                        <span className="text-[10px] font-mono uppercase tracking-wider font-medium">
                          Extracting panel...
                        </span>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
        </div>

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

export { ChapterScraperDeck, ChapterScraperDeck as ImportedImagesDeck };
export default ChapterScraperDeck;
