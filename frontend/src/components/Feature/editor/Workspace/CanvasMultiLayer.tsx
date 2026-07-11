import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { PanelLayers, PanelSyncMap } from "@/types";
import { useDialogueSync } from "@/hooks/useDialogueSync";

interface CanvasMultiLayerProps {
  layers: PanelLayers;
  syncMap?: PanelSyncMap;
  isActive: boolean;
}

export default function CanvasMultiLayer({
  layers,
  syncMap,
  isActive,
}: CanvasMultiLayerProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  // Keep references to fabric objects to update visibility and use inside dialogue sync hook
  const bgImgRef = useRef<fabric.Image | null>(null);
  const charImgRef = useRef<fabric.Image | null>(null);
  const textImgRef = useRef<fabric.Image | null>(null);

  // Initialize Dialogue Sync Hook
  useDialogueSync({
    fabricTextObjectRef: textImgRef,
    canvasRef: fabricCanvas,
    syncMap,
    textVisible: layers.text_visible !== false,
  });

  useEffect(() => {
    if (!isActive || !canvasEl.current || !containerRef.current) return;

    // Load background image first to extract dimensions and initialize canvas
    const bgImgElement = new Image();
    bgImgElement.crossOrigin = "anonymous";
    bgImgElement.onload = async () => {
      if (!canvasEl.current || !containerRef.current) return;

      const canvasWidth = bgImgElement.naturalWidth || bgImgElement.width || 800;
      const canvasHeight = bgImgElement.naturalHeight || bgImgElement.height || 600;

      // Set native pixel resolution of the canvas to match original asset dimensions
      canvasEl.current.width = canvasWidth;
      canvasEl.current.height = canvasHeight;
      containerRef.current.style.aspectRatio = `${canvasWidth / canvasHeight}`;

      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }

      const fCanvas = new fabric.Canvas(canvasEl.current, {
        width: canvasWidth,
        height: canvasHeight,
        backgroundColor: "transparent",
      });
      fabricCanvas.current = fCanvas;

      // Create Background layer (locked)
      const fabBg = await fabric.Image.fromURL(layers.background_url, { crossOrigin: "anonymous" });
      fabBg.set({
        left: 0,
        top: 0,
        selectable: false,
        evented: false,
        visible: layers.bg_visible !== false,
      });
      fCanvas.add(fabBg);
      bgImgRef.current = fabBg;

      // Create Character layer (draggable & resizable)
      const fabChar = await fabric.Image.fromURL(layers.character_url, { crossOrigin: "anonymous" });
      // Scale to match background dimensions initially
      const charScaleX = canvasWidth / fabChar.width!;
      const charScaleY = canvasHeight / fabChar.height!;
      fabChar.set({
        left: 0,
        top: 0,
        scaleX: charScaleX,
        scaleY: charScaleY,
        selectable: true,
        evented: true,
        visible: layers.char_visible !== false,
        cornerStyle: "circle",
        transparentCorners: false,
        cornerColor: "#8b5cf6",
        cornerSize: 10,
        borderColor: "#a78bfa",
      });
      fCanvas.add(fabChar);
      charImgRef.current = fabChar;

      // Create Text layer (draggable & resizable)
      const fabText = await fabric.Image.fromURL(layers.text_url, { crossOrigin: "anonymous" });
      // Scale to match background dimensions initially
      const textScaleX = canvasWidth / fabText.width!;
      const textScaleY = canvasHeight / fabText.height!;
      fabText.set({
        left: 0,
        top: 0,
        scaleX: textScaleX,
        scaleY: textScaleY,
        selectable: true,
        evented: true,
        visible: layers.text_visible !== false,
        cornerStyle: "circle",
        transparentCorners: false,
        cornerColor: "#10b981",
        cornerSize: 10,
        borderColor: "#34d399",
      });
      fCanvas.add(fabText);
      textImgRef.current = fabText;

      fCanvas.renderAll();
    };

    bgImgElement.src = layers.background_url;

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      bgImgRef.current = null;
      charImgRef.current = null;
      textImgRef.current = null;
    };
  }, [isActive, layers.background_url, layers.character_url, layers.text_url]);

  // React to visibility toggles from state
  useEffect(() => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    let needsRender = false;

    if (bgImgRef.current) {
      const isVisible = layers.bg_visible !== false;
      if (bgImgRef.current.visible !== isVisible) {
        bgImgRef.current.set({ visible: isVisible });
        needsRender = true;
      }
    }

    if (charImgRef.current) {
      const isVisible = layers.char_visible !== false;
      if (charImgRef.current.visible !== isVisible) {
        charImgRef.current.set({ visible: isVisible });
        needsRender = true;
      }
    }

    if (textImgRef.current) {
      const isVisible = layers.text_visible !== false;
      if (textImgRef.current.visible !== isVisible) {
        textImgRef.current.set({ visible: isVisible });
        needsRender = true;
      }
    }

    if (needsRender) {
      canvas.renderAll();
    }
  }, [layers.bg_visible, layers.char_visible, layers.text_visible]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 pointer-events-auto max-w-full max-h-full object-contain"
      style={{ width: "100%", height: "100%" }}
    >
      <canvas ref={canvasEl} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
