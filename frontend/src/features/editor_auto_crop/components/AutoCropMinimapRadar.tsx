import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronUp,
  ChevronDown,
  Layers,
  ZoomIn,
  ZoomOut,
  PanelRightClose,
  ChevronsUp,
  ChevronsDown,
  Compass,
  ArrowUp,
  ArrowDown,
  Eye,
} from "lucide-react";
import { getProxiedImageUrl } from "@/shared/utils/imageProxy";

export interface MinimapPanelBox {
  id?: string | number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  confidence?: number;
  label?: string;
  [key: string]: any;
}

export interface AutoCropMinimapRadarProps {
  imageUrl: string;
  boxes: MinimapPanelBox[];
  totalWidth: number;
  totalHeight: number;
  selectedPanelIndex: number | null;
  onSelectPanel: (index: number) => void;
  scrollProgress?: { scrollRatio: number; topPct: number; heightPct?: number };
  scrollViewportRef?: React.RefObject<HTMLDivElement | null>;
  onNudgePanel?: (index: number, deltaY: number) => void;
  activeTheme?: {
    name?: string;
    hex?: string;
    borderActive?: string;
    borderInactive?: string;
    badgeBg?: string;
    ring?: string;
    text?: string;
  };
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  onClose?: () => void;
  className?: string;
}

export const AutoCropMinimapRadar: React.FC<AutoCropMinimapRadarProps> = ({
  imageUrl,
  boxes,
  totalWidth,
  totalHeight,
  selectedPanelIndex,
  onSelectPanel,
  scrollProgress = { scrollRatio: 0, topPct: 0, heightPct: 15 },
  scrollViewportRef,
  onNudgePanel,
  activeTheme = {
    hex: "#10b981",
    borderActive: "border-emerald-400",
    borderInactive: "border-emerald-500/40",
    badgeBg: "bg-emerald-500/30",
    ring: "ring-emerald-400",
    text: "text-emerald-400",
  },
  isExpanded: externalExpanded,
  onToggleExpanded,
  onClose,
  className = "",
}) => {
  const [internalExpanded, setInternalExpanded] = useState<boolean>(false);
  const isExpanded = externalExpanded !== undefined ? externalExpanded : internalExpanded;
  const toggleExpanded = onToggleExpanded || (() => setInternalExpanded((prev) => !prev));
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [hoverPanelIndex, setHoverPanelIndex] = useState<number | null>(null);
  const [zoomMultiplier, setZoomMultiplier] = useState<number>(0.45);
  const [trackContainerHeight, setTrackContainerHeight] = useState<number>(600);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const overviewRailRef = useRef<HTMLDivElement | null>(null);

  // ResizeObserver to dynamically match available full-height container height
  useEffect(() => {
    if (!trackRef.current) return;
    const updateSize = () => {
      if (trackRef.current) {
        const h = trackRef.current.clientHeight;
        if (h > 60) {
          setTrackContainerHeight(h);
        }
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(trackRef.current);
    return () => observer.disconnect();
  }, []);

  // Panel dock width
  const baseWidth = isExpanded ? 290 : 205;
  const currentCardWidth = baseWidth;
  const trackWidth = currentCardWidth - 28;
  const trackHeight = trackContainerHeight;

  // Compute currently in-view active panel from scroll progress or selection
  const inViewPanelIndex = useMemo(() => {
    if (selectedPanelIndex !== null && selectedPanelIndex >= 0 && boxes[selectedPanelIndex]) {
      return selectedPanelIndex;
    }
    const currentY = (scrollProgress.scrollRatio || 0) * (totalHeight || 1);
    let closest = 0;
    let minDiff = Infinity;
    boxes.forEach((b, i) => {
      const bY = b.y ?? 0;
      const diff = Math.abs(bY - currentY);
      if (diff < minDiff) {
        minDiff = diff;
        closest = i;
      }
    });
    return closest;
  }, [selectedPanelIndex, scrollProgress.scrollRatio, totalHeight, boxes]);

  // Scaled natural aspect-ratio minimap height (never distorted/squished)
  const naturalMinimapHeight = useMemo(() => {
    if (totalWidth <= 0 || totalHeight <= 0) return trackHeight;
    const naturalHeight = trackWidth * (totalHeight / totalWidth);
    return Math.max(trackHeight, naturalHeight * zoomMultiplier);
  }, [totalWidth, totalHeight, trackWidth, trackHeight, zoomMultiplier]);

  // Keep minimap scroll centered ONLY when panel selection or main scroll changes, NOT on zoom
  const lastSyncedScrollRatio = useRef<number | null>(null);
  const lastSyncedPanel = useRef<number | null>(null);
  const prevNaturalHeightRef = useRef<number>(naturalMinimapHeight);

  // Maintain proportional scroll position on zoom without jumping/animating
  useEffect(() => {
    if (!trackRef.current) return;
    if (prevNaturalHeightRef.current > 0 && prevNaturalHeightRef.current !== naturalMinimapHeight) {
      const scrollRatio = trackRef.current.scrollTop / prevNaturalHeightRef.current;
      trackRef.current.scrollTop = scrollRatio * naturalMinimapHeight;
    }
    prevNaturalHeightRef.current = naturalMinimapHeight;
  }, [naturalMinimapHeight]);

  // Sync minimap scroll smoothly when active panel or canvas scroll changes
  useEffect(() => {
    if (isDragging || !trackRef.current) return;
    const currentScrollRatio = scrollProgress.scrollRatio ?? 0;
    const isPanelChanged = selectedPanelIndex !== lastSyncedPanel.current;
    const isScrollChanged = Math.abs((lastSyncedScrollRatio.current ?? -1) - currentScrollRatio) > 0.001;

    if (isPanelChanged || isScrollChanged) {
      lastSyncedPanel.current = selectedPanelIndex;
      lastSyncedScrollRatio.current = currentScrollRatio;

      let targetScroll = 0;
      if (isPanelChanged && selectedPanelIndex !== null && boxes[selectedPanelIndex] && totalHeight > 0) {
        const b = boxes[selectedPanelIndex];
        const panelCenterRatio = ((b.y ?? 0) + (b.height ?? (totalHeight / boxes.length)) / 2) / totalHeight;
        targetScroll = panelCenterRatio * naturalMinimapHeight - trackRef.current.clientHeight / 2;
      } else {
        targetScroll = currentScrollRatio * naturalMinimapHeight - trackRef.current.clientHeight / 2;
      }

      const maxScroll = Math.max(0, trackRef.current.scrollHeight - trackRef.current.clientHeight);
      if (maxScroll > 0) {
        trackRef.current.scrollTo({
          top: Math.max(0, Math.min(maxScroll, targetScroll)),
          behavior: isPanelChanged ? "smooth" : "auto",
        });
      }
    }
  }, [selectedPanelIndex, scrollProgress.scrollRatio, naturalMinimapHeight, totalHeight, boxes, isDragging]);

  const rafScrubRef = useRef<number | null>(null);

  const handlePointerScrub = useCallback(
    (clientY: number) => {
      if (!trackRef.current || !scrollViewportRef?.current || totalHeight <= 0) return;
      if (rafScrubRef.current) cancelAnimationFrame(rafScrubRef.current);

      rafScrubRef.current = requestAnimationFrame(() => {
        if (!trackRef.current || !scrollViewportRef?.current) return;
        const rect = trackRef.current.getBoundingClientRect();
        const clickY = Math.max(0, Math.min(rect.height, clientY - rect.top));

        const scrollYInMinimap = clickY + trackRef.current.scrollTop;
        const targetRatio = Math.max(0, Math.min(1, scrollYInMinimap / (naturalMinimapHeight || 1)));

        const scrollH = scrollViewportRef.current.scrollHeight;
        const clientH = scrollViewportRef.current.clientHeight;
        const maxScroll = Math.max(0, scrollH - clientH);
        scrollViewportRef.current.scrollTo({ top: targetRatio * maxScroll, behavior: "auto" });
      });
    },
    [naturalMinimapHeight, scrollViewportRef, totalHeight]
  );

  // Global overview rail scrubbing (Jump anywhere from 0% to 100% of the entire strip)
  const handleOverviewRailScrub = useCallback(
    (clientY: number) => {
      if (!overviewRailRef.current || !scrollViewportRef?.current || totalHeight <= 0) return;
      if (rafScrubRef.current) cancelAnimationFrame(rafScrubRef.current);

      rafScrubRef.current = requestAnimationFrame(() => {
        if (!overviewRailRef.current || !scrollViewportRef?.current) return;
        const rect = overviewRailRef.current.getBoundingClientRect();
        const clickY = Math.max(0, Math.min(rect.height, clientY - rect.top));
        const targetRatio = Math.max(0, Math.min(1, clickY / rect.height));

        const scrollH = scrollViewportRef.current.scrollHeight;
        const clientH = scrollViewportRef.current.clientHeight;
        const maxScroll = Math.max(0, scrollH - clientH);
        scrollViewportRef.current.scrollTo({ top: targetRatio * maxScroll, behavior: "auto" });
      });
    },
    [scrollViewportRef]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      handlePointerScrub(clientY);
    };

    const handlePointerUp = () => {
      setIsDragging(false);
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
    };
  }, [isDragging, handlePointerScrub]);

  const activeBox = boxes[inViewPanelIndex];
  const activeBoxWidth = Math.round(activeBox?.width ?? totalWidth);
  const activeBoxHeight = Math.round(activeBox?.height ?? (totalHeight / boxes.length));
  const activeRatio = activeBoxWidth > 0 ? (activeBoxHeight / activeBoxWidth).toFixed(2) : "1.0";
  const activeRatioTag =
    +activeRatio > 1.8 ? "Tall Strip" : +activeRatio > 1.3 ? "Portrait" : +activeRatio < 0.8 ? "Wide" : "Square";

  if (!boxes.length || totalHeight <= 0) return null;

  return (
    <div
      style={{
        width: `${currentCardWidth}px`,
        maxWidth: "92vw",
      }}
      className={`h-full bg-neutral-950/98 border-l border-neutral-800/90 shadow-2xl backdrop-blur-2xl flex flex-col items-center select-none transition-[width] duration-200 z-30 shrink-0 animate-in fade-in slide-in-from-right-3 duration-200 ${className}`}
    >
      {/* ── HEADER TELEMETRY & STUDIO CONTROLS ── */}
      <div className="flex items-center justify-between w-full px-2.5 py-2 shrink-0 border-b border-neutral-800/90 bg-neutral-900/60 backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-mono font-bold text-white tracking-wider flex items-center gap-1">
            <Compass className="h-3 w-3 text-emerald-400" />
            RADAR
          </span>
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-800/90 text-emerald-400 border border-neutral-700/70">
            {boxes.length}p
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          {/* Density presets / Zoom controls */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomMultiplier((prev) => Math.max(0.2, +(prev - 0.1).toFixed(2)));
            }}
            disabled={zoomMultiplier <= 0.2}
            className="text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 p-1 rounded-md hover:bg-neutral-800/80 transition-colors !cursor-pointer active:scale-90"
            title={`Zoom Out (Show More Panels) (${Math.round(zoomMultiplier * 100)}%)`}
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoomMultiplier((prev) => Math.min(1.5, +(prev + 0.1).toFixed(2)));
            }}
            disabled={zoomMultiplier >= 1.5}
            className="text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400 p-1 rounded-md hover:bg-neutral-800/80 transition-colors !cursor-pointer active:scale-90"
            title={`Zoom In (${Math.round(zoomMultiplier * 100)}%)`}
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-neutral-400 hover:text-rose-400 p-1 rounded-md hover:bg-neutral-800/80 transition-colors !cursor-pointer"
              title="Close Right Panel (M)"
            >
              <PanelRightClose className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── ACTIVE PANEL TELEMETRY HUD PILL ── */}
      <div className="px-2 pt-2 pb-1 shrink-0 w-full">
        <div className="w-full px-2.5 py-1.5 flex items-center justify-between text-[10px] font-mono bg-neutral-900/90 rounded-lg border border-neutral-800 text-neutral-300 shadow-sm">
          <div className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-emerald-400 font-bold">Panel #{inViewPanelIndex + 1}</span>
            <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">{activeRatioTag}</span>
          </div>
          <span className="text-neutral-400 font-medium text-[9px] bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
            {activeBoxWidth}×{activeBoxHeight}px
          </span>
        </div>
      </div>

      {/* ── RADAR TRACK & GLOBAL OVERVIEW RAIL ── */}
      <div className="flex-1 min-h-0 w-full px-2 py-1 flex flex-row gap-1 relative">
        {/* ── MAIN RADAR TRACK VIEWPORT ── */}
        <div
          ref={trackRef}
          className="relative flex-1 h-full bg-neutral-950 rounded-xl overflow-y-auto overflow-x-hidden border border-neutral-800/90 cursor-pointer shadow-inner group/radar scrollbar-thin scrollbar-thumb-neutral-700/80 hover:scrollbar-thumb-emerald-500/80 scrollbar-track-neutral-950/60 select-none"
          onPointerDown={(e) => {
            setIsDragging(true);
            handlePointerScrub(e.clientY);
          }}
          onMouseMove={(e) => {
            if (isDragging || !trackRef.current) return;
            const rect = trackRef.current.getBoundingClientRect();
            const clickY = e.clientY - rect.top;

            const scrollYInMinimap = clickY + (trackRef.current.scrollTop || 0);
            const targetRatio = Math.max(0, Math.min(1, scrollYInMinimap / (naturalMinimapHeight || 1)));

            const targetPixelY = targetRatio * totalHeight;
            let closestIdx = 0;
            let minDiff = Infinity;
            boxes.forEach((b, i) => {
              const bY = b.y ?? 0;
              const diff = Math.abs(bY - targetPixelY);
              if (diff < minDiff) {
                minDiff = diff;
                closestIdx = i;
              }
            });
            setHoverPanelIndex(closestIdx);
          }}
          onMouseLeave={() => {
            if (!isDragging) setHoverPanelIndex(null);
          }}
        >
          {/* ── LIVE NATURAL ASPECT RATIO COMIC STRIP RADAR ── */}
          <div
            style={{
              width: "100%",
              height: `${Math.round(naturalMinimapHeight)}px`,
            }}
            className="relative w-full"
          >
            {/* Live Comic Strip Artwork (Crisp, zero obscuring tint) */}
            <img
              src={getProxiedImageUrl(imageUrl)}
              alt="Dynamic Radar Preview"
              style={{
                width: "100%",
                height: `${Math.round(naturalMinimapHeight)}px`,
                objectFit: "fill",
              }}
              className="w-full block select-none pointer-events-none opacity-95 group-hover/radar:opacity-100 transition-opacity"
            />

            {/* Panel Slices with Precise 2D Coordinates & Full 4-Sided Borders */}
            {boxes.map((b, i) => {
              const topPct = ((b.y ?? 0) / totalHeight) * 100;
              const leftPct = ((b.x ?? 0) / totalWidth) * 100;
              const widthPct = Math.max(3, Math.min(100 - leftPct, ((b.width ?? totalWidth) / totalWidth) * 100));
              const heightPct = Math.max(0.4, ((b.height ?? (totalHeight / boxes.length)) / totalHeight) * 100);
              const isSel = selectedPanelIndex === i;
              const isHov = hoverPanelIndex === i;

              return (
                <div
                  key={b.id ?? i}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectPanel(i);
                    if (scrollViewportRef?.current && totalHeight > 0) {
                      const boxTop = b.y ?? 0;
                      const boxH = b.height ?? 200;
                      const scrollH = scrollViewportRef.current.scrollHeight;
                      const clientH = scrollViewportRef.current.clientHeight;
                      const targetScroll = ((boxTop + boxH / 2) / totalHeight) * scrollH - clientH / 2;
                      scrollViewportRef.current.scrollTo({ top: Math.max(0, targetScroll), behavior: "smooth" });
                    }
                  }}
                  onMouseEnter={() => setHoverPanelIndex(i)}
                  onMouseLeave={() => setHoverPanelIndex(null)}
                  style={{
                    top: `${topPct}%`,
                    left: `${leftPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                  }}
                  className={`absolute transition-all pointer-events-auto cursor-pointer rounded-[2px] ${
                    isSel
                      ? "border-2 border-emerald-400 bg-emerald-400/35 z-25 shadow-[0_0_0_1px_rgba(0,0,0,0.9),0_0_10px_rgba(52,211,153,0.9)] ring-1 ring-white/70"
                      : isHov
                      ? "border-2 border-cyan-400 bg-cyan-400/20 z-15 shadow-[0_0_0_1px_rgba(0,0,0,0.8),0_0_6px_rgba(6,182,212,0.6)]"
                      : "border border-emerald-400/60 bg-emerald-500/[0.04] shadow-[0_0_0_1px_rgba(0,0,0,0.7)] hover:border-emerald-300 z-10"
                  }`}
                >
                  {(isSel || isHov || isExpanded) && (
                    <span
                      className={`absolute left-0.5 top-0.5 px-1 py-0.2 rounded-[2px] text-[7px] font-mono font-bold leading-tight shadow-md z-30 pointer-events-none ${
                        isSel
                          ? "bg-emerald-400 text-black font-extrabold shadow-emerald-500/50 scale-105 origin-top-left"
                          : isHov
                          ? "bg-cyan-400 text-black shadow-cyan-500/40"
                          : "bg-neutral-950/90 text-emerald-400 border border-emerald-500/40 font-semibold"
                      }`}
                    >
                      #{i + 1}
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── FLOATING HOVER CARD ── */}
          {hoverPanelIndex !== null && boxes[hoverPanelIndex] && (
            <div
              style={{
                top: `${Math.max(6, Math.min(94, ((boxes[hoverPanelIndex]?.y ?? 0) / totalHeight) * 100))}%`,
              }}
              className="absolute right-full mr-2 z-50 p-2.5 rounded-xl bg-neutral-950/98 border border-neutral-700 text-white text-[10px] font-mono shadow-2xl pointer-events-none -translate-y-1/2 min-w-[155px] backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100 space-y-1.5"
            >
              <div className="flex items-center justify-between gap-1.5 border-b border-neutral-800 pb-1 font-bold">
                <span className="text-emerald-400 flex items-center gap-1 text-[10px]">
                  <Layers className="h-3.5 w-3.5" />
                  Panel #{hoverPanelIndex + 1}
                </span>
                <span className="text-[8px] px-1 py-0.2 rounded bg-neutral-900 text-neutral-400 border border-neutral-800">
                  {Math.round(((boxes[hoverPanelIndex]?.y ?? 0) / totalHeight) * 100)}%
                </span>
              </div>
              <div className="space-y-0.5 text-[9px] text-neutral-300">
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Size:</span>
                  <span className="text-white font-bold">
                    {Math.round(boxes[hoverPanelIndex]?.width ?? totalWidth)}×
                    {Math.round(boxes[hoverPanelIndex]?.height ?? 0)}px
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-neutral-500">Offset Y:</span>
                  <span className="text-neutral-300 font-mono">{Math.round(boxes[hoverPanelIndex]?.y ?? 0)}px</span>
                </div>
                <div className="text-[8px] text-emerald-400 pt-1 border-t border-neutral-800/80 font-medium">
                  Click / Drag to jump
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── FULL-STRIP OVERVIEW SCRUB RAIL (Global 0-100% position scrubber) ── */}
        <div
          ref={overviewRailRef}
          onPointerDown={(e) => handleOverviewRailScrub(e.clientY)}
          className="w-2.5 shrink-0 h-full rounded-md bg-neutral-900/80 border border-neutral-800/60 relative cursor-pointer group/rail overflow-hidden hover:bg-neutral-900 transition-colors"
        >
          {/* Mini tick marks for panel boundaries */}
          {boxes.map((b, i) => (
            <div
              key={`tick-${b.id ?? i}`}
              style={{
                top: `${((b.y ?? 0) / (totalHeight || 1)) * 100}%`,
              }}
              className={`absolute left-0 right-0 h-[1px] pointer-events-none ${
                selectedPanelIndex === i ? "bg-emerald-400 z-10" : "bg-white/15"
              }`}
            />
          ))}

          {/* Active viewport indicator thumb on rail */}
          <div
            style={{
              top: `${Math.max(0, Math.min(94, (scrollProgress.topPct || 0)))}%`,
              height: `${Math.max(6, Math.min(40, (scrollProgress.heightPct || 10)))}%`,
            }}
            className="absolute inset-x-0.5 rounded-sm bg-emerald-400/80 border border-emerald-300 shadow-[0_0_6px_rgba(52,211,153,0.8)] pointer-events-none group-hover/rail:bg-emerald-300 transition-all"
          />
        </div>
      </div>

      {/* ── FOOTER STEPPER & NAVIGATION CONTROLS ── */}
      <div className="flex items-center justify-between w-full px-2 py-1.5 shrink-0 border-t border-neutral-800/90 bg-neutral-900/60 text-[8px] font-mono">
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              if (scrollViewportRef?.current) {
                scrollViewportRef.current.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors !cursor-pointer"
            title="Jump to Top (Home)"
          >
            <ChevronsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (inViewPanelIndex > 0) {
                onSelectPanel(inViewPanelIndex - 1);
              }
            }}
            disabled={inViewPanelIndex <= 0}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors !cursor-pointer"
            title="Previous Panel (Up)"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
        </div>

        <span className="text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded bg-neutral-950 border border-neutral-800">
          #{inViewPanelIndex + 1} / {boxes.length}
        </span>

        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => {
              if (inViewPanelIndex < boxes.length - 1) {
                onSelectPanel(inViewPanelIndex + 1);
              }
            }}
            disabled={inViewPanelIndex >= boxes.length - 1}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 disabled:opacity-30 disabled:hover:text-neutral-400 transition-colors !cursor-pointer"
            title="Next Panel (Down)"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => {
              if (scrollViewportRef?.current) {
                scrollViewportRef.current.scrollTo({
                  top: scrollViewportRef.current.scrollHeight,
                  behavior: "smooth",
                });
              }
            }}
            className="p-1 rounded text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors !cursor-pointer"
            title="Jump to Bottom (End)"
          >
            <ChevronsDown className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutoCropMinimapRadar;
