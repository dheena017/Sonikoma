import React, { useState, useRef, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import * as api from "@/api";
import { getProxiedImageUrl } from "@/utils";
import {
  ThemeColor,
  BorderStyle,
  ToolMode,
  DragAction,
  THEME_CONFIG,
  InteractiveCutOverlayProps,
} from "./InteractiveCutOverlay.types";
import { InteractiveCutToolbar } from "./InteractiveCutToolbar";
import { InteractiveCutSettingsMenu } from "./InteractiveCutSettingsMenu";
import { InteractiveCutBoxItem } from "./InteractiveCutBoxItem";
import { InteractiveCutShortcutsModal } from "./InteractiveCutShortcutsModal";
import { AutoCropMinimapRadar } from "./AutoCropMinimapRadar";

export { THEME_CONFIG };
export type { ThemeColor, BorderStyle, ToolMode, DragAction, InteractiveCutOverlayProps };

export function InteractiveCutOverlay({
  imageUrl,
  boxes,
  selectedPanelIndex,
  onSelectPanel,
  onUpdateBox,
  onAddBox,
  onSplitPanel,
  onDeletePanel,
  onNudgePanel,
  onApplyCrop,
  isReCropping,
  dimensions,
  showCutLines = true,
  onToggleCutLines,
  onOpenBigScreen,
}: InteractiveCutOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollViewportRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [naturalWidth, setNaturalWidth] = useState<number | null>(null);
  const [naturalHeight, setNaturalHeight] = useState<number | null>(null);
  const [dragAction, setDragAction] = useState<DragAction | null>(null);
  const [hoverPixelY, setHoverPixelY] = useState<number | null>(null);
  const [hoverPixelX, setHoverPixelX] = useState<number | null>(null);
  const [scrollProgress, setScrollProgress] = useState<{
    topPct: number;
    heightPct: number;
    scrollRatio: number;
  }>({ topPct: 0, heightPct: 20, scrollRatio: 0 });
  const [isMinimapExpanded, setIsMinimapExpanded] = useState<boolean>(false);

  const dragRef = useRef<DragAction | null>(null);
  const lastDragEndTimeRef = useRef<number>(0);
  const lastDirectInteractionRef = useRef<number>(0);

  // Synchronize natural dimensions if cached
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth) {
      setNaturalWidth(imgRef.current.naturalWidth);
      setNaturalHeight(imgRef.current.naturalHeight);
    }
  }, [imageUrl]);

  // Tool mode & view settings
  const [toolMode, setToolMode] = useState<ToolMode>("box");
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [showShortcutsModal, setShowShortcutsModal] = useState<boolean>(false);
  const [showMinimap, setShowMinimap] = useState<boolean>(true);
  const [zoomScale, setZoomScale] = useState<number>(1.0);

  const handleViewportScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const imgEl = imgRef.current;
    if (imgEl && imgEl.clientHeight > 0) {
      const imgTop = imgEl.offsetTop;
      const imgHeight = imgEl.clientHeight;
      const visibleTopInImg = Math.max(0, scrollTop - imgTop);
      const scrollRatio = Math.max(0, Math.min(1, visibleTopInImg / imgHeight));
      const visibleHeightInImg = Math.min(imgHeight, clientHeight);
      const heightPct = Math.max(5, Math.min(100, (visibleHeightInImg / imgHeight) * 100));
      const topPct = scrollRatio * 100;
      setScrollProgress({ topPct, heightPct, scrollRatio });
    } else if (scrollHeight > clientHeight) {
      const maxScroll = Math.max(1, scrollHeight - clientHeight);
      const scrollRatio = Math.max(0, Math.min(1, scrollTop / maxScroll));
      const heightPct = Math.max(
        5,
        Math.min(100, (clientHeight / scrollHeight) * 100)
      );
      const topPct = scrollRatio * (100 - heightPct);
      setScrollProgress({ topPct, heightPct, scrollRatio });
    }
  };

  const handleSelectNextPanel = () => {
    if (boxes.length === 0) return;
    const nextIdx =
      selectedPanelIndex === null || selectedPanelIndex < 0
        ? 0
        : (selectedPanelIndex + 1) % boxes.length;
    onSelectPanel(nextIdx);
  };

  const handleSelectPrevPanel = () => {
    if (boxes.length === 0) return;
    const prevIdx =
      selectedPanelIndex === null || selectedPanelIndex <= 0
        ? boxes.length - 1
        : selectedPanelIndex - 1;
    onSelectPanel(prevIdx);
  };

  // Pro Display & Theme Customization
  const [themeColor, setThemeColor] = useState<ThemeColor>("emerald");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("solid");
  const [boxFillOpacity, setBoxFillOpacity] = useState<number>(15);
  const [showPanelBoxes, setShowPanelBoxes] = useState<boolean>(true);
  const [showEdgeHandles, setShowEdgeHandles] = useState<boolean>(true);
  const [showCornerHandles, setShowCornerHandles] = useState<boolean>(true);
  const [showMoveBadges, setShowMoveBadges] = useState<boolean>(true);
  const [showDimensionTags, setShowDimensionTags] = useState<boolean>(true);
  const [showPanelBadges, setShowPanelBadges] = useState<boolean>(true);
  const [showQuickToolbar, setShowQuickToolbar] = useState<boolean>(true);
  const [showMagnifierLoupe, setShowMagnifierLoupe] = useState<boolean>(true);
  const [loupeZoomPower, setLoupeZoomPower] = useState<number>(2.2);
  const [showRuleOfThirds, setShowRuleOfThirds] = useState<boolean>(false);
  const [dimInactivePanels, setDimInactivePanels] = useState<boolean>(false);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(false);

  const activeTheme = THEME_CONFIG[themeColor] || THEME_CONFIG.emerald;

  const totalWidth = dimensions?.width || naturalWidth || 800;
  const totalHeight = dimensions?.height || naturalHeight || 1200;

  // Keyboard Shortcuts (J/K, M, D, F, S, Del, +, -, 0, ?, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      if (e.key === "j" || e.key === "J" || e.key === "ArrowDown") {
        if (selectedPanelIndex !== null && e.altKey && onNudgePanel) {
          e.preventDefault();
          onNudgePanel(selectedPanelIndex, e.shiftKey ? 20 : 5);
        } else if (!e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleSelectNextPanel();
        }
      } else if (e.key === "k" || e.key === "K" || e.key === "ArrowUp") {
        if (selectedPanelIndex !== null && e.altKey && onNudgePanel) {
          e.preventDefault();
          onNudgePanel(selectedPanelIndex, e.shiftKey ? -20 : -5);
        } else if (!e.altKey && !e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          handleSelectPrevPanel();
        }
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setShowMinimap((prev) => !prev);
      } else if (
        (e.key === "Delete" || e.key === "Backspace") &&
        selectedPanelIndex !== null &&
        selectedPanelIndex >= 0 &&
        boxes.length > 1
      ) {
        e.preventDefault();
        onDeletePanel?.(selectedPanelIndex);
      } else if (
        (e.key === "s" || e.key === "S") &&
        selectedPanelIndex !== null &&
        selectedPanelIndex >= 0
      ) {
        e.preventDefault();
        onSplitPanel?.(selectedPanelIndex);
      } else if (
        (e.key === "d" || e.key === "D") &&
        selectedPanelIndex !== null &&
        selectedPanelIndex >= 0
      ) {
        e.preventDefault();
        handleDuplicatePanel(selectedPanelIndex);
      } else if (
        (e.key === "f" || e.key === "F") &&
        selectedPanelIndex !== null &&
        selectedPanelIndex >= 0
      ) {
        e.preventDefault();
        handleSnapToFullWidth(selectedPanelIndex);
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        setZoomScale((prev) => Math.min(2.5, +(prev + 0.25).toFixed(2)));
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        setZoomScale((prev) => Math.max(0.5, +(prev - 0.25).toFixed(2)));
      } else if (e.key === "0") {
        e.preventDefault();
        setZoomScale(1.0);
      } else if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShowShortcutsModal((prev) => !prev);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setShowSettingsMenu(false);
        setShowShortcutsModal(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedPanelIndex,
    boxes,
    onSelectPanel,
    onNudgePanel,
    onDeletePanel,
    onSplitPanel,
    totalWidth,
    totalHeight,
  ]);

  // Smooth scroll into view ONLY when selected programmatically, NOT on direct pointer click/drag
  useEffect(() => {
    if (
      selectedPanelIndex === null ||
      selectedPanelIndex < 0 ||
      dragAction !== null ||
      dragRef.current !== null ||
      Date.now() - lastDirectInteractionRef.current < 1000 ||
      !containerRef.current
    ) {
      return;
    }
    const targetBox = containerRef.current.querySelector(
      `[data-panel-idx="${selectedPanelIndex}"]`
    );
    if (targetBox) {
      targetBox.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "nearest",
      });
    }
  }, [selectedPanelIndex, dragAction]);

  // Drag start for moving entire bounding box
  const handleBoxMoveStart = (
    boxIdx: number,
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    if ("cancelable" in e && e.cancelable) {
      e.preventDefault();
    }
    lastDirectInteractionRef.current = Date.now();
    onSelectPanel(boxIdx);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pointerX = (relX / rect.width) * totalWidth;
    const pointerY = (relY / rect.height) * totalHeight;

    const box = boxes[boxIdx];
    const origX = box.x ?? 0;
    const origY = box.y ?? 0;
    const origW = box.width ?? totalWidth;
    const origH =
      box.height ?? Math.round(totalHeight / Math.max(1, boxes.length));

    const action: DragAction = {
      type: "move-box",
      boxIdx,
      startPointerX: pointerX,
      startPointerY: pointerY,
      origX,
      origY,
      origW,
      origH,
      currentX: origX,
      currentY: origY,
    };
    dragRef.current = action;
    setDragAction(action);
  };

  // Drag start for 4-sided edge and corner resizing
  const handleBoxResizeStart = (
    boxIdx: number,
    handle: "n" | "s" | "e" | "w" | "nw" | "ne" | "sw" | "se",
    e: React.MouseEvent | React.TouchEvent
  ) => {
    e.stopPropagation();
    if ("cancelable" in e && e.cancelable) {
      e.preventDefault();
    }
    lastDirectInteractionRef.current = Date.now();
    onSelectPanel(boxIdx);

    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pointerX = (relX / rect.width) * totalWidth;
    const pointerY = (relY / rect.height) * totalHeight;

    const box = boxes[boxIdx];
    const origX = box.x ?? 0;
    const origY = box.y ?? 0;
    const origW = box.width ?? totalWidth;
    const origH =
      box.height ?? Math.round(totalHeight / Math.max(1, boxes.length));

    const action: DragAction = {
      type: "resize-box",
      boxIdx,
      handle,
      startPointerX: pointerX,
      startPointerY: pointerY,
      origX,
      origY,
      origW,
      origH,
      currentX: origX,
      currentY: origY,
      currentW: origW,
      currentH: origH,
    };
    dragRef.current = action;
    setDragAction(action);
  };

  // Start drawing a new 2D box on empty canvas
  const handleCanvasPointerDown = (
    e: React.MouseEvent | React.TouchEvent
  ) => {
    if (toolMode !== "box" || !containerRef.current) return;
    lastDirectInteractionRef.current = Date.now();
    const rect = containerRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
    const pointerX = (relX / rect.width) * totalWidth;
    const pointerY = (relY / rect.height) * totalHeight;

    const action: DragAction = {
      type: "draw-box",
      startPointerX: pointerX,
      startPointerY: pointerY,
      currentPointerX: pointerX,
      currentPointerY: pointerY,
    };
    dragRef.current = action;
    setDragAction(action);
  };

  // Window pointer move and pointer up handlers
  useEffect(() => {
    if (!dragAction) return;

    let animFrameId: number | null = null;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!containerRef.current || !dragRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }

      animFrameId = requestAnimationFrame(() => {
        if (!containerRef.current || !dragRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();

        const relX = Math.max(0, Math.min(rect.width, clientX - rect.left));
        const relY = Math.max(0, Math.min(rect.height, clientY - rect.top));
        const pixelX = (relX / rect.width) * totalWidth;
        const pixelY = (relY / rect.height) * totalHeight;

        const current = dragRef.current;
        if (!current) return;

        if (current.type === "draw-box") {
          const updated: DragAction = {
            ...current,
            currentPointerX: pixelX,
            currentPointerY: pixelY,
          };
          dragRef.current = updated;
          setDragAction(updated);
        } else if (current.type === "move-box") {
          const deltaX = pixelX - current.startPointerX;
          const deltaY = pixelY - current.startPointerY;
          let nextX = current.origX + deltaX;
          let nextY = current.origY + deltaY;

          if (snapToGrid) {
            nextX = Math.round(nextX / 10) * 10;
            nextY = Math.round(nextY / 10) * 10;
          }

          const clampedX = Math.max(
            0,
            Math.min(totalWidth - current.origW, Math.round(nextX))
          );
          const clampedY = Math.max(
            0,
            Math.min(totalHeight - current.origH, Math.round(nextY))
          );

          const updated: DragAction = {
            ...current,
            currentX: clampedX,
            currentY: clampedY,
          };
          dragRef.current = updated;
          setDragAction(updated);
        } else if (current.type === "resize-box") {
          const deltaX = pixelX - current.startPointerX;
          const deltaY = pixelY - current.startPointerY;
          let nextX = current.origX;
          let nextY = current.origY;
          let nextW = current.origW;
          let nextH = current.origH;
          const minDim = 25;

          // North (top edge)
          if (current.handle.includes("n")) {
            const maxY = current.origY + current.origH - minDim;
            let targetY = current.origY + deltaY;
            if (snapToGrid) targetY = Math.round(targetY / 10) * 10;
            const clampedY = Math.max(0, Math.min(maxY, targetY));
            nextY = Math.round(clampedY);
            nextH = Math.round(current.origY + current.origH - nextY);
          }
          // South (bottom edge)
          if (current.handle.includes("s")) {
            const maxH = totalHeight - current.origY;
            let targetH = current.origH + deltaY;
            if (snapToGrid) targetH = Math.round(targetH / 10) * 10;
            const clampedH = Math.max(minDim, Math.min(maxH, targetH));
            nextH = Math.round(clampedH);
          }
          // West (left edge)
          if (current.handle.includes("w")) {
            const maxX = current.origX + current.origW - minDim;
            let targetX = current.origX + deltaX;
            if (snapToGrid) targetX = Math.round(targetX / 10) * 10;
            const clampedX = Math.max(0, Math.min(maxX, targetX));
            nextX = Math.round(clampedX);
            nextW = Math.round(current.origX + current.origW - nextX);
          }
          // East (right edge)
          if (current.handle.includes("e")) {
            const maxW = totalWidth - current.origX;
            let targetW = current.origW + deltaX;
            if (snapToGrid) targetW = Math.round(targetW / 10) * 10;
            const clampedW = Math.max(minDim, Math.min(maxW, targetW));
            nextW = Math.round(clampedW);
          }

          const updated: DragAction = {
            ...current,
            currentX: nextX,
            currentY: nextY,
            currentW: nextW,
            currentH: nextH,
          };
          dragRef.current = updated;
          setDragAction(updated);
        }
      });
    };

    const handlePointerUp = () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
      const finalAction = dragRef.current;
      dragRef.current = null;
      setDragAction(null);
      lastDragEndTimeRef.current = Date.now();
      lastDirectInteractionRef.current = Date.now();

      if (!finalAction) return;

      if (finalAction.type === "draw-box") {
        const x1 = Math.min(
          finalAction.startPointerX,
          finalAction.currentPointerX
        );
        const y1 = Math.min(
          finalAction.startPointerY,
          finalAction.currentPointerY
        );
        const w = Math.abs(
          finalAction.currentPointerX - finalAction.startPointerX
        );
        const h = Math.abs(
          finalAction.currentPointerY - finalAction.startPointerY
        );

        if (w >= 20 && h >= 20) {
          onAddBox?.({
            x: Math.round(x1),
            y: Math.round(y1),
            width: Math.round(w),
            height: Math.round(h),
          });
        } else {
          const defaultH = 240;
          onAddBox?.({
            x: 0,
            y: Math.max(
              0,
              Math.min(totalHeight - defaultH, Math.round(y1 - defaultH / 2))
            ),
            width: totalWidth,
            height: defaultH,
          });
        }
      } else if (finalAction.type === "move-box") {
        const targetBox = boxes[finalAction.boxIdx];
        if (targetBox && onUpdateBox) {
          onUpdateBox(finalAction.boxIdx, {
            ...targetBox,
            x: finalAction.currentX,
            y: finalAction.currentY,
            width: finalAction.origW,
            height: finalAction.origH,
          });
        }
      } else if (finalAction.type === "resize-box") {
        const targetBox = boxes[finalAction.boxIdx];
        if (targetBox && onUpdateBox) {
          onUpdateBox(finalAction.boxIdx, {
            ...targetBox,
            x: finalAction.currentX,
            y: finalAction.currentY,
            width: finalAction.currentW,
            height: finalAction.currentH,
          });
        }
      }
    };

    window.addEventListener("mousemove", handlePointerMove);
    window.addEventListener("mouseup", handlePointerUp);
    window.addEventListener("touchmove", handlePointerMove, { passive: false });
    window.addEventListener("touchend", handlePointerUp);
    window.addEventListener("touchcancel", handlePointerUp);

    return () => {
      if (animFrameId !== null) {
        cancelAnimationFrame(animFrameId);
      }
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
      window.removeEventListener("touchmove", handlePointerMove);
      window.removeEventListener("touchend", handlePointerUp);
      window.removeEventListener("touchcancel", handlePointerUp);
    };
  }, [dragAction, totalWidth, totalHeight, snapToGrid, boxes, onAddBox, onUpdateBox]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const relY = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const pixelX = (relX / rect.width) * totalWidth;
    const pixelY = (relY / rect.height) * totalHeight;

    setHoverPixelX(Math.round(pixelX));
    setHoverPixelY(Math.round(pixelY));
  };

  const handleMouseLeave = () => {
    setHoverPixelY(null);
    setHoverPixelX(null);
  };

  // Quick Append Box Helper
  const handleQuickAddBoxAtEnd = () => {
    const lastBox = boxes[boxes.length - 1];
    const newY = lastBox
      ? (lastBox.y ?? 0) + (lastBox.height ?? 0) + 10
      : 0;
    const defaultH = 260;
    onAddBox?.({
      x: 0,
      y: Math.min(Math.max(0, newY), Math.max(0, totalHeight - defaultH)),
      width: totalWidth,
      height: defaultH,
    });
  };

  // Duplicate Selected Box
  const handleDuplicatePanel = (idx: number) => {
    const targetBox = boxes[idx];
    if (!targetBox || !onAddBox) return;
    const newY = Math.min(
      totalHeight - (targetBox.height ?? 200),
      (targetBox.y ?? 0) + (targetBox.height ?? 200) + 12
    );
    onAddBox({
      x: targetBox.x ?? 0,
      y: newY,
      width: targetBox.width ?? totalWidth,
      height: targetBox.height ?? 240,
    });
  };

  // Snap Box to Full Width
  const handleSnapToFullWidth = (idx: number) => {
    const targetBox = boxes[idx];
    if (!targetBox || !onUpdateBox) return;
    onUpdateBox(idx, {
      ...targetBox,
      x: 0,
      width: totalWidth,
    });
  };

  // Merge with Next Box Below
  const handleMergeWithNext = (idx: number) => {
    if (idx >= boxes.length - 1 || !onUpdateBox || !onDeletePanel) return;
    const curr = boxes[idx];
    const next = boxes[idx + 1];
    const topY = Math.min(curr.y ?? 0, next.y ?? 0);
    const bottomY = Math.max(
      (curr.y ?? 0) + (curr.height ?? 0),
      (next.y ?? 0) + (next.height ?? 0)
    );
    const leftX = Math.min(curr.x ?? 0, next.x ?? 0);
    const rightX = Math.max(
      (curr.x ?? 0) + (curr.width ?? totalWidth),
      (next.x ?? 0) + (next.width ?? totalWidth)
    );

    onUpdateBox(idx, {
      ...curr,
      x: leftX,
      y: topY,
      width: rightX - leftX,
      height: bottomY - topY,
    });
    onDeletePanel(idx + 1);
  };

  // Auto Equalize Vertical Gutters
  const handleAutoEqualizeGutters = () => {
    if (boxes.length <= 1 || !onUpdateBox) return;
    const sortedIndices = boxes
      .map((_, i) => i)
      .sort((a, b) => (boxes[a].y ?? 0) - (boxes[b].y ?? 0));
    const totalBoxHeight = boxes.reduce(
      (acc, b) => acc + (b.height ?? 200),
      0
    );
    const remainingSpace = Math.max(0, totalHeight - totalBoxHeight);
    const gutterGap = Math.round(
      remainingSpace / Math.max(1, boxes.length + 1)
    );

    let currentY = gutterGap;
    sortedIndices.forEach((boxIdx) => {
      const b = boxes[boxIdx];
      onUpdateBox(boxIdx, {
        ...b,
        y: currentY,
      });
      currentY += (b.height ?? 200) + gutterGap;
    });
  };

  // Canvas root cursor calculation
  const getCanvasCursorClass = () => {
    if (dragAction !== null) {
      if (dragAction.type === "move-box") return "!cursor-grabbing";
      if (dragAction.type === "draw-box") return "!cursor-crosshair";
      if (dragAction.type === "resize-box") {
        if (dragAction.handle === "n" || dragAction.handle === "s")
          return "!cursor-ns-resize";
        if (dragAction.handle === "e" || dragAction.handle === "w")
          return "!cursor-ew-resize";
        if (dragAction.handle === "nw" || dragAction.handle === "se")
          return "!cursor-nwse-resize";
        if (dragAction.handle === "ne" || dragAction.handle === "sw")
          return "!cursor-nesw-resize";
      }
      return "!cursor-crosshair";
    }
    if (toolMode === "box") return "!cursor-crosshair";
    return "!cursor-default";
  };

  const setAllCustomizations = (state: boolean) => {
    setShowPanelBoxes(state);
    setShowEdgeHandles(state);
    setShowCornerHandles(state);
    setShowMoveBadges(state);
    setShowDimensionTags(state);
    setShowPanelBadges(state);
    setShowQuickToolbar(state);
    setShowMagnifierLoupe(state);
  };

  const applyPreset = (preset: "default" | "focus" | "clean") => {
    if (preset === "default") {
      setThemeColor("emerald");
      setBorderStyle("solid");
      setBoxFillOpacity(15);
      setShowRuleOfThirds(false);
      setDimInactivePanels(false);
      setSnapToGrid(false);
      setLoupeZoomPower(2.2);
      setAllCustomizations(true);
    } else if (preset === "focus") {
      setThemeColor("cyan");
      setBorderStyle("solid");
      setBoxFillOpacity(25);
      setShowRuleOfThirds(true);
      setDimInactivePanels(true);
      setSnapToGrid(true);
      setLoupeZoomPower(2.5);
      setAllCustomizations(true);
    } else if (preset === "clean") {
      setThemeColor("violet");
      setBorderStyle("dashed");
      setBoxFillOpacity(0);
      setShowRuleOfThirds(false);
      setDimInactivePanels(false);
      setSnapToGrid(false);
      setLoupeZoomPower(1.5);
      setAllCustomizations(true);
    }
  };

  // Precision Magnifier Loupe Focus Point Calculation
  const getLoupeCoordinates = () => {
    if (!dragAction) return null;
    let focusX = 0;
    let focusY = 0;

    if (dragAction.type === "draw-box") {
      focusX = dragAction.currentPointerX;
      focusY = dragAction.currentPointerY;
    } else if (dragAction.type === "resize-box") {
      if (dragAction.handle === "n") {
        focusX = dragAction.currentX + dragAction.currentW / 2;
        focusY = dragAction.currentY;
      } else if (dragAction.handle === "s") {
        focusX = dragAction.currentX + dragAction.currentW / 2;
        focusY = dragAction.currentY + dragAction.currentH;
      } else if (dragAction.handle === "w") {
        focusX = dragAction.currentX;
        focusY = dragAction.currentY + dragAction.currentH / 2;
      } else if (dragAction.handle === "e") {
        focusX = dragAction.currentX + dragAction.currentW;
        focusY = dragAction.currentY + dragAction.currentH / 2;
      } else if (dragAction.handle === "nw") {
        focusX = dragAction.currentX;
        focusY = dragAction.currentY;
      } else if (dragAction.handle === "ne") {
        focusX = dragAction.currentX + dragAction.currentW;
        focusY = dragAction.currentY;
      } else if (dragAction.handle === "sw") {
        focusX = dragAction.currentX;
        focusY = dragAction.currentY + dragAction.currentH;
      } else if (dragAction.handle === "se") {
        focusX = dragAction.currentX + dragAction.currentW;
        focusY = dragAction.currentY + dragAction.currentH;
      }
    } else if (dragAction.type === "move-box") {
      focusX = dragAction.currentX + dragAction.origW / 2;
      focusY = dragAction.currentY;
    }

    return { focusX, focusY };
  };

  const loupeCoords = getLoupeCoordinates();

  return (
    <div className="w-full h-full flex flex-row min-h-0 flex-1 relative overflow-hidden gap-2">
      {/* ── LEFT MAIN WORKSPACE: TOP TOOLBAR + SCROLLABLE CANVAS ── */}
      <div className="flex-1 min-w-0 h-full flex flex-col min-h-0">
        {/* ── UNIFIED FIXED TOP STUDIO TOOLBAR ── */}
        <InteractiveCutToolbar
          toolMode={toolMode}
          setToolMode={setToolMode}
          boxes={boxes}
          selectedPanelIndex={selectedPanelIndex}
          onSelectPanel={onSelectPanel}
          onSelectPrevPanel={handleSelectPrevPanel}
          onSelectNextPanel={handleSelectNextPanel}
          onQuickAddBoxAtEnd={onAddBox ? handleQuickAddBoxAtEnd : undefined}
          onApplyCrop={onApplyCrop}
          isReCropping={isReCropping}
          showCutLines={showCutLines}
          onToggleCutLines={onToggleCutLines}
          showMinimap={showMinimap}
          onToggleMinimap={() => setShowMinimap(!showMinimap)}
          showSettingsMenu={showSettingsMenu}
          onToggleSettingsMenu={() => setShowSettingsMenu(!showSettingsMenu)}
          zoomScale={zoomScale}
          setZoomScale={setZoomScale}
          onAutoEqualizeGutters={
            onUpdateBox ? handleAutoEqualizeGutters : undefined
          }
          onOpenShortcutsModal={() => setShowShortcutsModal(true)}
          onOpenBigScreen={onOpenBigScreen}
          activeTheme={activeTheme}
        />

        {/* ── SETTINGS / CUSTOMIZER MODAL ── */}
        <InteractiveCutSettingsMenu
          isOpen={showSettingsMenu}
          onClose={() => setShowSettingsMenu(false)}
          themeColor={themeColor}
          setThemeColor={setThemeColor}
          activeTheme={activeTheme}
          borderStyle={borderStyle}
          setBorderStyle={setBorderStyle}
          boxFillOpacity={boxFillOpacity}
          setBoxFillOpacity={setBoxFillOpacity}
          showRuleOfThirds={showRuleOfThirds}
          setShowRuleOfThirds={setShowRuleOfThirds}
          dimInactivePanels={dimInactivePanels}
          setDimInactivePanels={setDimInactivePanels}
          snapToGrid={snapToGrid}
          setSnapToGrid={setSnapToGrid}
          showMagnifierLoupe={showMagnifierLoupe}
          setShowMagnifierLoupe={setShowMagnifierLoupe}
          loupeZoomPower={loupeZoomPower}
          setLoupeZoomPower={setLoupeZoomPower}
          showPanelBoxes={showPanelBoxes}
          setShowPanelBoxes={setShowPanelBoxes}
          showEdgeHandles={showEdgeHandles}
          setShowEdgeHandles={setShowEdgeHandles}
          showCornerHandles={showCornerHandles}
          setShowCornerHandles={setShowCornerHandles}
          showMoveBadges={showMoveBadges}
          setShowMoveBadges={setShowMoveBadges}
          showDimensionTags={showDimensionTags}
          setShowDimensionTags={setShowDimensionTags}
          showPanelBadges={showPanelBadges}
          setShowPanelBadges={setShowPanelBadges}
          showQuickToolbar={showQuickToolbar}
          setShowQuickToolbar={setShowQuickToolbar}
          applyPreset={applyPreset}
          setAllCustomizations={setAllCustomizations}
        />

        {/* ── DEDICATED SCROLLABLE IMAGE CANVAS VIEWPORT ── */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden rounded-2xl border border-neutral-800/80 bg-neutral-950/90 shadow-inner">
          <div
            ref={scrollViewportRef}
            onScroll={handleViewportScroll}
            className="w-full h-full overflow-y-auto overflow-x-hidden scroll-auto overscroll-contain scrollbar-thin p-2 sm:p-4"
          >
            <div className="mx-auto w-full max-w-xl md:max-w-2xl pb-16 pt-2 flex flex-col items-center">
              {/* ── MAIN INTERACTIVE IMAGE CANVAS ── */}
              <div
                ref={containerRef}
                onMouseDown={handleCanvasPointerDown}
                onTouchStart={handleCanvasPointerDown}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                style={{
                  transform: `scale(${zoomScale})`,
                  transformOrigin: "top center",
                  transition: "transform 0.15s cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                className={`relative select-none touch-none shadow-2xl rounded-xl overflow-hidden border border-neutral-800/80 bg-neutral-900 ${getCanvasCursorClass()}`}
              >
                {/* Comic Strip Image */}
                <img
                  ref={imgRef}
                  src={getProxiedImageUrl(imageUrl)}
                  alt="Auto-Crop Canvas"
                  draggable={false}
                  onLoad={(e) => {
                    setNaturalWidth(e.currentTarget.naturalWidth);
                    setNaturalHeight(e.currentTarget.naturalHeight);
                  }}
                  className="w-full h-auto block select-none pointer-events-none"
                />

                {/* Dim Inactive Panels Layer */}
                {dimInactivePanels &&
                  selectedPanelIndex !== null &&
                  boxes[selectedPanelIndex] && (
                    <div className="absolute inset-0 bg-black/60 pointer-events-none transition-opacity duration-200 z-10" />
                  )}

                {/* ── ALL BOUNDING BOXES ── */}
                {showCutLines &&
                  boxes.map((box, idx) => (
                    <InteractiveCutBoxItem
                      key={box.id ?? idx}
                      box={box}
                      idx={idx}
                      totalWidth={totalWidth}
                      totalHeight={totalHeight}
                      selectedPanelIndex={selectedPanelIndex}
                      dragAction={dragAction}
                      activeTheme={activeTheme}
                      borderStyle={borderStyle}
                      boxFillOpacity={boxFillOpacity}
                      showPanelBoxes={showPanelBoxes}
                      showRuleOfThirds={showRuleOfThirds}
                      showQuickToolbar={showQuickToolbar}
                      showPanelBadges={showPanelBadges}
                      showMoveBadges={showMoveBadges}
                      showDimensionTags={showDimensionTags}
                      showEdgeHandles={showEdgeHandles}
                      showCornerHandles={showCornerHandles}
                      lastDragEndTimeRef={lastDragEndTimeRef}
                      onSelectPanel={onSelectPanel}
                      handleBoxMoveStart={handleBoxMoveStart}
                      handleBoxResizeStart={handleBoxResizeStart}
                      onNudgePanel={onNudgePanel}
                      onDuplicatePanel={
                        onAddBox ? handleDuplicatePanel : undefined
                      }
                      onSnapToFullWidth={
                        onUpdateBox ? handleSnapToFullWidth : undefined
                      }
                      onMergeWithNext={
                        onUpdateBox && onDeletePanel
                          ? handleMergeWithNext
                          : undefined
                      }
                      onSplitPanel={onSplitPanel}
                      onDeletePanel={onDeletePanel}
                      boxesCount={boxes.length}
                    />
                  ))}

                {/* ── MAGNIFIER LOUPE LENS ── */}
                {showMagnifierLoupe &&
                  dragAction !== null &&
                  loupeCoords &&
                  (() => {
                    const loupeSize = 136;
                    const loupeRadius = loupeSize / 2;

                    const baseCanvasWidth =
                      imgRef.current?.clientWidth ||
                      containerRef.current?.clientWidth ||
                      600;

                    const magnifiedWidth = baseCanvasWidth * loupeZoomPower;
                    const magnifiedHeight =
                      totalWidth > 0
                        ? magnifiedWidth * (totalHeight / totalWidth)
                        : magnifiedWidth;

                    const focusRatioX = Math.max(
                      0,
                      Math.min(1, loupeCoords.focusX / totalWidth)
                    );
                    const focusRatioY = Math.max(
                      0,
                      Math.min(1, loupeCoords.focusY / totalHeight)
                    );

                    const focusPixelX = focusRatioX * magnifiedWidth;
                    const focusPixelY = focusRatioY * magnifiedHeight;

                    const imageTranslateX = Math.round(
                      loupeRadius - focusPixelX
                    );
                    const imageTranslateY = Math.round(
                      loupeRadius - focusPixelY
                    );
                    const isNearTop =
                      (loupeCoords.focusY / totalHeight) * 100 < 18;

                    return (
                      <div
                        style={{
                          left: `${(loupeCoords.focusX / totalWidth) * 100}%`,
                          top: `${Math.max(
                            4,
                            Math.min(96, (loupeCoords.focusY / totalHeight) * 100)
                          )}%`,
                          transform: `translate(-50%, ${
                            isNearTop ? "30px" : "-150px"
                          })`,
                        }}
                        className="absolute z-50 pointer-events-none flex flex-col items-center animate-in zoom-in-90 duration-100 select-none"
                      >
                        {isNearTop && (
                          <div
                            style={{ borderBottomColor: activeTheme.hex }}
                            className="w-0 h-0 border-x-8 border-x-transparent border-b-8 mb-1 shadow-sm"
                          />
                        )}

                        <div
                          style={{
                            boxShadow: activeTheme.glowShadow,
                            width: `${loupeSize}px`,
                            height: `${loupeSize}px`,
                          }}
                          className={`relative rounded-full border-2 ${activeTheme.borderActive} bg-neutral-950 overflow-hidden ring-4 ${activeTheme.ring}/40 backdrop-blur-md`}
                        >
                          <img
                            src={getProxiedImageUrl(imageUrl)}
                            alt="Magnifier Loupe View"
                            style={{
                              width: `${magnifiedWidth}px`,
                              height: `${magnifiedHeight}px`,
                              maxWidth: "none",
                              maxHeight: "none",
                              transform: `translate(${imageTranslateX}px, ${imageTranslateY}px)`,
                            }}
                            className="absolute block select-none pointer-events-none"
                          />

                          {/* Center Precision Crosshair */}
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div
                              style={{ backgroundColor: activeTheme.hex }}
                              className="w-full h-[1.5px] opacity-90"
                            />
                            <div
                              style={{ backgroundColor: activeTheme.hex }}
                              className="h-full w-[1.5px] opacity-90 absolute"
                            />
                            <div
                              style={{ borderColor: activeTheme.hex }}
                              className="w-4 h-4 rounded-full border border-white/90 absolute shadow-sm"
                            />
                          </div>

                          {/* Top Lens Header Badge */}
                          <div className="absolute top-1.5 inset-x-0 flex justify-center pointer-events-none">
                            <span
                              className={`px-2 py-0.5 rounded-full bg-black/90 ${activeTheme.text} text-[9px] font-mono font-bold border ${activeTheme.borderInactive} shadow-md`}
                            >
                              {loupeZoomPower}× · X:
                              {Math.round(loupeCoords.focusX)} Y:
                              {Math.round(loupeCoords.focusY)}
                            </span>
                          </div>
                        </div>

                        {!isNearTop && (
                          <div
                            style={{ borderTopColor: activeTheme.hex }}
                            className="w-0 h-0 border-x-8 border-x-transparent border-t-8 mt-1 shadow-sm"
                          />
                        )}
                      </div>
                    );
                  })()}

                {/* Live Draw Box Preview */}
                {dragAction?.type === "draw-box" && (
                  <div
                    style={{
                      left: `${(Math.min(
                        dragAction.startPointerX,
                        dragAction.currentPointerX
                      ) /
                        totalWidth) *
                        100}%`,
                      top: `${(Math.min(
                        dragAction.startPointerY,
                        dragAction.currentPointerY
                      ) /
                        totalHeight) *
                        100}%`,
                      width: `${(Math.abs(
                        dragAction.currentPointerX - dragAction.startPointerX
                      ) /
                        totalWidth) *
                        100}%`,
                      height: `${(Math.abs(
                        dragAction.currentPointerY - dragAction.startPointerY
                      ) /
                        totalHeight) *
                        100}%`,
                    }}
                    className={`absolute border-2 ${activeTheme.borderActive} ${activeTheme.badgeBg} ring-4 ${activeTheme.ring}/40 z-50 pointer-events-none flex items-center justify-center`}
                  >
                    <div
                      className={`px-2.5 py-1 rounded-full bg-neutral-950/95 ${activeTheme.text} text-[10px] font-mono font-bold border ${activeTheme.borderActive} shadow-2xl`}
                    >
                      {Math.round(
                        Math.abs(
                          dragAction.currentPointerX - dragAction.startPointerX
                        )
                      )}
                      ×
                      {Math.round(
                        Math.abs(
                          dragAction.currentPointerY - dragAction.startPointerY
                        )
                      )}
                      px
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── FULL-HEIGHT RIGHT-SIDE MINIMAP RADAR PANEL DOCK ── */}
      {showMinimap && boxes.length > 0 && totalHeight > 0 ? (
        <AutoCropMinimapRadar
          imageUrl={imageUrl}
          boxes={boxes}
          totalWidth={totalWidth}
          totalHeight={totalHeight}
          selectedPanelIndex={selectedPanelIndex}
          onSelectPanel={onSelectPanel}
          scrollProgress={scrollProgress}
          scrollViewportRef={scrollViewportRef}
          onNudgePanel={onNudgePanel}
          activeTheme={activeTheme}
          isExpanded={isMinimapExpanded}
          onToggleExpanded={() => setIsMinimapExpanded(!isMinimapExpanded)}
          onClose={() => setShowMinimap(false)}
          className="h-full rounded-2xl border border-neutral-800/90"
        />
      ) : (
        /* Floating Re-Open Edge Tab when closed */
        boxes.length > 0 &&
        totalHeight > 0 && (
          <button
            type="button"
            onClick={() => setShowMinimap(true)}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 flex items-center gap-1 px-1.5 py-3 bg-neutral-950/95 hover:bg-neutral-900 text-neutral-400 hover:text-emerald-400 border-l border-y border-neutral-800 hover:border-emerald-500/50 rounded-l-xl shadow-2xl backdrop-blur-xl transition-all duration-150 group !cursor-pointer"
            title="Open Minimap Radar Panel (M)"
          >
            <ChevronLeft className="h-4 w-4 text-emerald-400 group-hover:-translate-x-0.5 transition-transform" />
            <span className="text-[9px] font-mono font-bold tracking-wider [writing-mode:vertical-lr] rotate-180 uppercase text-neutral-400 group-hover:text-emerald-300">
              Radar
            </span>
          </button>
        )
      )}

      {/* ── KEYBOARD SHORTCUTS CHEATSHEET MODAL ── */}
      <InteractiveCutShortcutsModal
        isOpen={showShortcutsModal}
        onClose={() => setShowShortcutsModal(false)}
      />
    </div>
  );
}

export default InteractiveCutOverlay;
