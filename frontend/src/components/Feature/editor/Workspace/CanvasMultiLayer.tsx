import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";
import { PanelLayers, PanelSyncMap, GeneratedPanel } from "@/types";
import { useDialogueSync } from "@/hooks/useDialogueSync";

interface CanvasMultiLayerProps {
  layers: PanelLayers;
  syncMap?: PanelSyncMap;
  isActive: boolean;
  panelId: number;
  setPanels: React.Dispatch<React.SetStateAction<GeneratedPanel[]>>;
}

export default function CanvasMultiLayer({
  layers,
  syncMap,
  isActive,
  panelId,
  setPanels,
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
      // Scale to match background dimensions initially or restore saved coordinates
      const hasSavedChar = layers.char_x !== undefined && layers.char_y !== undefined;
      const charScaleX = hasSavedChar ? layers.char_scale_x! : (canvasWidth / fabChar.width!);
      const charScaleY = hasSavedChar ? layers.char_scale_y! : (canvasHeight / fabChar.height!);
      fabChar.set({
        left: hasSavedChar ? layers.char_x! : 0,
        top: hasSavedChar ? layers.char_y! : 0,
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
      // Scale to match background dimensions initially or restore saved coordinates
      const hasSavedText = layers.text_x !== undefined && layers.text_y !== undefined;
      const textScaleX = hasSavedText ? layers.text_scale_x! : (canvasWidth / fabText.width!);
      const textScaleY = hasSavedText ? layers.text_scale_y! : (canvasHeight / fabText.height!);
      fabText.set({
        left: hasSavedText ? layers.text_x! : 0,
        top: hasSavedText ? layers.text_y! : 0,
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

      // Persist modifications back to parent panel state
      fCanvas.on("object:modified", (opt) => {
        const obj = opt.target;
        if (!obj) return;

        const isChar = obj === fabChar;
        const isText = obj === fabText;

        if (isChar || isText) {
          const prefix = isChar ? "char" : "text";
          setPanels((prev) =>
            prev.map((p) =>
              p.id === panelId
                ? {
                    ...p,
                    layers: {
                      ...p.layers!,
                      [`${prefix}_x`]: obj.left,
                      [`${prefix}_y`]: obj.top,
                      [`${prefix}_scale_x`]: obj.scaleX,
                      [`${prefix}_scale_y`]: obj.scaleY,
                    },
                  }
                : p
            )
          );
        }
      });

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
