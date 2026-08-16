import React from "react";
import { ScraperDeckProps } from "./types";
import * as api from "@/api";
import { PanelCardThumbnail } from "./PanelCardThumbnail";
import { PanelCardControls } from "./PanelCardControls";
import { PanelCardActions } from "./PanelCardActions";

// 1. Cleaned up all unused Editor-related props
interface PanelCardProps
  extends Pick<
    ScraperDeckProps,
    | "setScrapedImages"
    | "setSelectedScraped"
    | "setConsoleLogs"
    | "mergingIndices"
    | "handleMergeWithNext"
    | "scrapedImages"
    | "bubbleCroppingImgUrl"
  > {
  imgUrl: string;
  /** The original raw URL (matching scrapedImages entries) used for callbacks & selection state */
  rawImgUrl: string;
  idx: number;
  displayIdx?: number;
  isSelected: boolean;
  isBatchCropping: boolean;
  croppingImgUrl: string | null;
  isInTimeline?: boolean;
  addPanelsToStoryboard: (
    urls: string[],
    currentScrapedList?: string[],
    shouldScroll?: boolean
  ) => void;
  addNotification: (
    message: string,
    type: "error" | "success" | "info" | "warning"
  ) => void;
  /** Called when the card is clicked. Parent handles selection + shift-range logic. */
  onCardClick: (
    idx: number,
    imgUrl: string,
    shiftKey: boolean,
    ctrlOrMeta: boolean
  ) => void;
  onCardDoubleClick?: (idx: number, imgUrl: string) => void;
  className?: string;
  viewLayout?: "scroll" | "grid";
  key?: React.Key;
}

function PanelCard({
  imgUrl,
  rawImgUrl,
  idx,
  displayIdx,
  isSelected,
  isBatchCropping,
  croppingImgUrl,
  isInTimeline,
  bubbleCroppingImgUrl,
  scrapedImages,
  mergingIndices,
  handleMergeWithNext,
  setScrapedImages,
  setSelectedScraped,
  setConsoleLogs,
  addPanelsToStoryboard,
  addNotification,
  onCardClick,
  onCardDoubleClick,
  className,
  viewLayout = "scroll",
}: PanelCardProps) {
  const [isEditing, setIsEditing] = React.useState<boolean>(false);
  const isProcessing =
    croppingImgUrl === imgUrl || bubbleCroppingImgUrl === imgUrl || isEditing;

  const [dimensions, setDimensions] = React.useState<{
    width: number;
    height: number;
  } | null>(null);

  React.useEffect(() => {
    if (!imgUrl) {
      setDimensions(null);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.src = imgUrl;

    img.onload = () => {
      if (!cancelled) {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      }
    };
    img.onerror = () => {
      if (!cancelled) {
        setDimensions(null);
      }
    };

    return () => {
      cancelled = true;
    };
  }, [imgUrl]);

  const aspectRatioLabel = React.useMemo(() => {
    if (!dimensions) return null;
    const ratio = dimensions.width / dimensions.height;
    if (ratio > 1.25) return "Landscape";
    if (ratio < 0.28) return "Too Tall Strip";
    if (ratio < 0.6) return "Tall Strip";
    return "Portrait";
  }, [dimensions]);

  const aspectRatioBadgeClass = React.useMemo(() => {
    switch (aspectRatioLabel) {
      case "Too Tall Strip":
        return "bg-rose-950/40 border-rose-800/40 text-rose-350 shadow-[0_0_8px_rgba(239,68,68,0.15)] animate-pulse";
      case "Tall Strip":
        return "bg-purple-950/40 border-purple-800/40 text-purple-300";
      case "Landscape":
        return "bg-sky-950/40 border-sky-800/40 text-sky-300";
      default:
        return "bg-neutral-900 border-neutral-850 text-neutral-400";
    }
  }, [aspectRatioLabel]);

  const updateImageUrl = React.useCallback(
    (nextUrl: string) => {
      setScrapedImages?.((prev: any[]) =>
        prev.map((img: any, i: number) => (i === idx ? nextUrl : img))
      );
      setSelectedScraped?.((prev: any[]) =>
        prev.map((img: string) => (img === rawImgUrl ? nextUrl : img))
      );
    },
    [idx, rawImgUrl, setScrapedImages, setSelectedScraped]
  );

  const addConsoleLog = React.useCallback(
    (message: string) => {
      setConsoleLogs?.((prev: any) => [message, ...prev]);
    },
    [setConsoleLogs]
  );

  const processCardClick = React.useCallback(
    (shiftKey: boolean, ctrlOrMeta: boolean) => {
      onCardClick(idx, rawImgUrl, shiftKey, ctrlOrMeta);
    },
    [idx, onCardClick, rawImgUrl]
  );

  const handleRotateClockwise = React.useCallback(async () => {
    console.log(`[PanelCard] Rotating image #${idx + 1} clockwise`);
    setIsEditing(true);
    addConsoleLog(`[Image Editor] Rotating Panel #${idx + 1} 90° clockwise...`);
    try {
      const data = await api.submitImageEdits(fetch, {
        url: rawImgUrl,
        rotate: 90,
        autoTrim: false,
      });

      updateImageUrl(data.url);
      addConsoleLog(`[Image Editor] Successfully rotated Panel #${idx + 1}!`);
    } catch (err: any) {
      console.error(err);
      addConsoleLog(`[Image Editor Error] Rotation failed: ${err.message}`);
    } finally {
      setIsEditing(false);
    }
  }, [idx, rawImgUrl, addConsoleLog, updateImageUrl]);

  const handleFlipHorizontal = React.useCallback(async () => {
    console.log(`[PanelCard] Flipping image #${idx + 1} horizontally`);
    setIsEditing(true);
    addConsoleLog(`[Image Editor] Flipping Panel #${idx + 1} horizontally...`);
    try {
      const data = await api.submitImageEdits(fetch, {
        url: rawImgUrl,
        flipHorizontal: true,
        autoTrim: false,
      });

      updateImageUrl(data.url);
      addConsoleLog(
        `[Image Editor] Successfully flipped Panel #${idx + 1} horizontally!`
      );
    } catch (err: any) {
      console.error(err);
      addConsoleLog(`[Image Editor Error] Flipping failed: ${err.message}`);
    } finally {
      setIsEditing(false);
    }
  }, [idx, rawImgUrl, addConsoleLog, updateImageUrl]);

  const handleUndo = React.useCallback(async () => {
    console.log(`[PanelCard] Undoing last operation for image #${idx + 1}`);
    setIsEditing(true);
    addConsoleLog(
      `[Image Editor] Restoring previous state for Panel #${idx + 1}...`
    );
    try {
      const data = await api.undoImageEdit(fetch, { url: rawImgUrl });

      if (data.success && data.previous_url) {
        updateImageUrl(data.previous_url);
        addConsoleLog(
          `[Image Editor] Successfully restored previous state for Panel #${
            idx + 1
          }!`
        );
      } else {
        throw new Error(data.error || "No previous state found");
      }
    } catch (err: any) {
      console.error(err);
      addConsoleLog(`[Image Editor Error] Undo failed: ${err.message}`);
    } finally {
      setIsEditing(false);
    }
  }, [idx, rawImgUrl, addConsoleLog, updateImageUrl]);

  const clickTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    return () => {
      if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
      }
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    const shiftKey = e.shiftKey;
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
      onCardDoubleClick?.(idx, rawImgUrl);
    } else {
      clickTimeoutRef.current = setTimeout(() => {
        clickTimeoutRef.current = null;
        processCardClick(shiftKey, ctrlOrMeta);
      }, 250);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Enter" && e.key !== " ") {
      return;
    }
    e.preventDefault();
    processCardClick(e.shiftKey, e.ctrlKey || e.metaKey);
  };

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSelectedScraped?.((prev: string[]) => {
      // Use rawImgUrl to stay consistent with scrapedImages entries
      if (prev.includes(rawImgUrl)) {
        return prev.filter((x) => x !== rawImgUrl);
      } else {
        return [...prev, rawImgUrl];
      }
    });
  };

  return (
    <div
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={`Panel ${idx + 1}${isSelected ? ", selected" : ""}`}
      aria-pressed={isSelected}
      className={[
        "group relative rounded-[1.5rem] overflow-hidden border p-4 space-y-4 transition-all duration-300 ease-out text-center cursor-pointer select-none outline-none focus-visible:ring-2 focus-visible:ring-purple-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-neutral-950 bg-neutral-950/90 shadow-[0_20px_50px_-30px_rgba(0,0,0,0.65)]",
        viewLayout === "grid"
          ? "w-full min-w-0"
          : "w-[260px] sm:w-[280px] shrink-0",
        isProcessing
          ? "border-2 border-purple-500 bg-purple-950/20 shadow-[0_0_24px_rgba(168,85,247,0.45)] ring-1 ring-purple-500/40 scale-[1.02]"
          : isSelected
          ? "border-purple-500 bg-purple-950/20 shadow-[0_12px_40px_-12px_rgba(168,85,247,0.35)] ring-1 ring-purple-500/20 scale-[1.02]"
          : "border-neutral-800/60 bg-neutral-950 hover:border-purple-500/50 hover:shadow-[0_18px_40px_-20px_rgba(168,85,247,0.18)] hover:scale-[1.03] hover:-translate-y-1.5",
        className || "",
      ].join(" ")}
    >
      <PanelCardThumbnail
        imgUrl={imgUrl}
        idx={idx}
        displayIdx={displayIdx}
        isSelected={isSelected}
        isProcessing={isProcessing}
        isBatchCropping={isBatchCropping}
        bubbleCroppingImgUrl={bubbleCroppingImgUrl}
        isInTimeline={isInTimeline}
        handleRotateClockwise={handleRotateClockwise}
        handleFlipHorizontal={handleFlipHorizontal}
        handleUndo={handleUndo}
        onCheckboxClick={handleCheckboxClick}
      />

      {/* Dynamic Resolution & Aspect Ratio Badges */}
      {dimensions && (
        <div className="flex items-center justify-between gap-2 px-1 text-[9px] font-mono select-none animate-in fade-in duration-300">
          <span className="text-neutral-500 font-bold bg-neutral-900 border border-neutral-800 px-1.5 py-0.5 rounded">
            {dimensions.width} × {dimensions.height} px
          </span>
          {aspectRatioLabel && (
            <span
              className={[
                "px-1.5 py-0.5 rounded font-bold border transition-all duration-300",
                aspectRatioBadgeClass,
              ].join(" ")}
            >
              {aspectRatioLabel}
            </span>
          )}
        </div>
      )}

      <PanelCardControls
        imgUrl={imgUrl}
        idx={idx}
        scrapedImages={scrapedImages}
        mergingIndices={mergingIndices}
        handleMergeWithNext={handleMergeWithNext}
        addPanelsToStoryboard={addPanelsToStoryboard}
      />

      {/* 3. PanelCardActions now only renders the Delete button (based on our previous step) */}
      <PanelCardActions
        idx={idx}
        imgUrl={imgUrl}
        rawImgUrl={rawImgUrl}
        setScrapedImages={setScrapedImages}
        setSelectedScraped={setSelectedScraped}
        setConsoleLogs={setConsoleLogs}
        addNotification={addNotification}
      />
    </div>
  );
}

export default React.memo(PanelCard);
