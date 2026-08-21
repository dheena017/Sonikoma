import React, { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Move,
  Type,
  Image as ImageIcon,
  Lock,
  Unlock,
  Minus,
  Plus,
  RefreshCcw,
  Film,
} from "lucide-react";
import { GeneratedPanel } from "@/types";

interface BlankViewportProps {
  panels?: GeneratedPanel[];
  currentPanelIndex?: number;
  zoomLevel?: number;
  onZoomLevelChange?: (zoom: number) => void;
}

type LayerType = "background" | "character" | "text";

const BlankViewport: React.FC<BlankViewportProps> = ({
  panels = [],
  currentPanelIndex = 0,
  zoomLevel,
  onZoomLevelChange,
}) => {
  const activePanel = panels[currentPanelIndex] || panels[0] || null;

  // Selected layer
  const [selectedLayer, setSelectedLayer] = useState<LayerType>("background");

  // Layer visibility
  const [layerVisibility, setLayerVisibility] = useState({
    background: true,
    character: true,
    text: true,
  });

  // Layer lock
  const [layerLock, setLayerLock] = useState({
    background: false,
    character: false,
    text: false,
  });

  // Layer drag state
  const [isDraggingBackground, setIsDraggingBackground] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );

  // Transforms per layer
  const [layerTransforms, setLayerTransforms] = useState<{
    [key in LayerType]: {
      x: number;
      y: number;
      scale: number;
      rotation: number;
      opacity: number;
    };
  }>({
    background: { x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 },
    character: { x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 },
    text: { x: 0, y: 0, scale: 100, rotation: 0, opacity: 100 },
  });

  const [backgroundZoom, setBackgroundZoom] = useState(100);

  const actualZoom = zoomLevel ?? backgroundZoom;

  useEffect(() => {
    if (zoomLevel !== undefined) {
      setBackgroundZoom(zoomLevel);
      setLayerTransforms((prev) => ({
        ...prev,
        background: {
          ...prev.background,
          scale: zoomLevel,
        },
      }));
    }
  }, [zoomLevel]);

  // Image URLs
  const bgUrl =
    activePanel?.layers?.background_url ||
    activePanel?.image_url ||
    (activePanel as any)?.imageUrl ||
    (activePanel as any)?.img_url ||
    (activePanel as any)?.src ||
    null;

  const charUrl = activePanel?.layers?.character_url || null;
  const textUrl = activePanel?.layers?.text_url || null;
  const dialogueText =
    activePanel?.speech_text ||
    activePanel?.narrative ||
    activePanel?.prompt ||
    "Double-click or edit dialogue overlay text in Inspector";

  const toggleVisibility = (key: LayerType) => {
    setLayerVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleLock = (key: LayerType) => {
    setLayerLock((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleBackgroundPointerDown = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (layerLock.background) return;
    setSelectedLayer("background");
    setIsDraggingBackground(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleBackgroundPointerMove = (
    e: React.PointerEvent<HTMLDivElement>
  ) => {
    if (!isDraggingBackground || !dragStart) return;
    e.preventDefault();
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    setDragStart({ x: e.clientX, y: e.clientY });
    setLayerTransforms((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        x: prev.background.x + dx,
        y: prev.background.y + dy,
      },
    }));
  };

  const handleBackgroundPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingBackground(false);
    setDragStart(null);
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  };

  const updateBackgroundZoom = (nextZoom: number) => {
    const clamped = Math.min(300, Math.max(20, nextZoom));
    if (onZoomLevelChange) {
      onZoomLevelChange(clamped);
      return;
    }

    setBackgroundZoom(clamped);
    setLayerTransforms((prev) => ({
      ...prev,
      background: {
        ...prev.background,
        scale: clamped,
      },
    }));
  };

  const handleBackgroundWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    updateBackgroundZoom(layerTransforms.background.scale * factor);
  };

  const renderZoomToolbar = () => (
    <div className="absolute top-4 right-4 z-40 flex items-center gap-2 rounded-full bg-black/65 border border-white/10 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
      <button
        type="button"
        onClick={() => updateBackgroundZoom(backgroundZoom - 10)}
        title="Zoom out"
        className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="min-w-[52px] text-[11px] font-semibold text-white text-center tracking-[0.04em]">
        {Math.round(backgroundZoom)}%
      </span>
      <button
        type="button"
        onClick={() => updateBackgroundZoom(backgroundZoom + 10)}
        title="Zoom in"
        className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
      >
        <Plus className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={() => updateBackgroundZoom(100)}
        title="Reset zoom"
        className="h-9 w-9 flex items-center justify-center rounded-full border border-neutral-800 bg-neutral-900/90 text-neutral-300 hover:bg-neutral-800 hover:text-white transition-all"
      >
        <RefreshCcw className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-transparent overflow-hidden relative select-none font-sans">
      {/* ── Canvas Stage Workspace ─────────────────────────────────────── */}
      <div className="flex-1 h-full flex items-center justify-center relative overflow-hidden bg-black/40 backdrop-blur-md p-4">
        {/* Professional Canvas Editor Dot Grid Pattern */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#a855f7_1px,transparent_1px)] [background-size:18px_18px]" />

        {/* Canvas Frame — Slate container with distinct purple border & shadow */}
        <div className="relative w-full h-full overflow-hidden bg-gradient-to-br from-[#0e0a20]/80 via-[#070510]/80 to-[#040308]/80 backdrop-blur-xl border border-purple-500/35 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex items-center justify-center">
          {/* Layer 1: Background Plate */}
          {layerVisibility.background && (
            <div
              onClick={() => setSelectedLayer("background")}
              onPointerDown={handleBackgroundPointerDown}
              onPointerMove={handleBackgroundPointerMove}
              onPointerUp={handleBackgroundPointerUp}
              onPointerLeave={() =>
                isDraggingBackground && setIsDraggingBackground(false)
              }
              onWheel={handleBackgroundWheel}
              className={`absolute inset-0 w-full h-full cursor-grab transition-all ${selectedLayer === "background"
                  ? "ring-2 ring-inset ring-indigo-500 z-10"
                  : "z-0"
                } ${isDraggingBackground ? "cursor-grabbing" : ""}`}
              style={{
                transform: `translate(${layerTransforms.background.x}px, ${layerTransforms.background.y
                  }px) scale(${actualZoom / 100}) rotate(${layerTransforms.background.rotation
                  }deg)`,
                opacity: layerTransforms.background.opacity / 100,
              }}
            >
              {bgUrl ? (
                <img
                  src={bgUrl}
                  alt="Background Layer"
                  className="w-full h-full object-contain object-center pointer-events-none"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-950/40 via-neutral-950/30 to-indigo-950/40 flex flex-col items-center justify-center gap-2 text-neutral-400 font-mono text-xs select-none p-6 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.2)]">
                    <Film className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-neutral-300 tracking-wider">
                    Video Viewport Canvas
                  </span>
                  <span className="text-[10px] text-neutral-500">
                    Select a storyboard panel or import media to start playback
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Layer 2: Character Subject (only if charUrl exists) */}
          {layerVisibility.character && charUrl && (
            <div
              onClick={() => setSelectedLayer("character")}
              className={`absolute max-w-[85%] max-h-[85%] cursor-pointer transition-all z-20 ${selectedLayer === "character"
                  ? "ring-2 ring-purple-400 border border-purple-500/60 shadow-[0_0_25px_rgba(168,85,247,0.5)]"
                  : ""
                }`}
              style={{
                transform: `translate(${layerTransforms.character.x}px, ${layerTransforms.character.y
                  }px) scale(${layerTransforms.character.scale / 100}) rotate(${layerTransforms.character.rotation
                  }deg)`,
                opacity: layerTransforms.character.opacity / 100,
              }}
            >
              <img
                src={charUrl}
                alt="Character Subject"
                className="w-auto h-auto max-w-full max-h-full object-contain"
              />

              {selectedLayer === "character" && (
                <>
                  <div className="absolute -top-2 -left-2 h-3.5 w-3.5 bg-purple-400 border-2 border-black rounded-full shadow-md" />
                  <div className="absolute -top-2 -right-2 h-3.5 w-3.5 bg-purple-400 border-2 border-black rounded-full shadow-md" />
                  <div className="absolute -bottom-2 -left-2 h-3.5 w-3.5 bg-purple-400 border-2 border-black rounded-full shadow-md" />
                  <div className="absolute -bottom-2 -right-2 h-3.5 w-3.5 bg-purple-400 border-2 border-black rounded-full shadow-md" />
                  <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-2 py-0.5 rounded text-[8px] font-mono font-bold uppercase tracking-widest pointer-events-none shadow-lg border border-purple-400/40 flex items-center gap-1">
                    <Move className="h-2.5 w-2.5" /> Character Layer
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BlankViewport;
