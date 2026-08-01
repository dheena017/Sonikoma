import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";

interface CanvasFabricLayerProps {
  imgUrl: string;
  isActive: boolean;
  brushSize: number;
  brushAction: string;
  fillColor: string;
  textBgColor?: string;
  opacity?: number;
  fontFamily?: string;
  textStrokeColor?: string;
  textAlign?: "left" | "center" | "right";
  isFilled?: boolean;
}

export default function CanvasFabricLayer({
  imgUrl,
  isActive,
  brushSize,
  brushAction,
  fillColor,
  textBgColor,
  opacity = 100,
  fontFamily = "Comic Sans MS",
  textStrokeColor = "#000000",
  textAlign = "center",
  isFilled = false,
}: CanvasFabricLayerProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  const activeShapeRef = useRef<fabric.Object | null>(null);
  const startPointerRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isMouseDownRef = useRef<boolean>(false);

  const brushActionRef = useRef(brushAction);
  const brushSizeRef = useRef(brushSize);
  const fillColorRef = useRef(fillColor);
  const textBgColorRef = useRef(textBgColor);
  const opacityRef = useRef(opacity);
  const fontFamilyRef = useRef(fontFamily);
  const textStrokeColorRef = useRef(textStrokeColor);
  const textAlignRef = useRef(textAlign);
  const isFilledRef = useRef(isFilled);

  useEffect(() => {
    brushActionRef.current = brushAction;
    brushSizeRef.current = brushSize;
    fillColorRef.current = fillColor;
    textBgColorRef.current = textBgColor;
    opacityRef.current = opacity;
    fontFamilyRef.current = fontFamily;
    textStrokeColorRef.current = textStrokeColor;
    textAlignRef.current = textAlign;
    isFilledRef.current = isFilled;
  }, [brushAction, brushSize, fillColor, textBgColor, opacity, fontFamily, textStrokeColor, textAlign, isFilled]);

  useEffect(() => {
    if (!isActive) {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
      return;
    }

    if (!canvasEl.current || !containerRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!canvasEl.current || !containerRef.current || !isActive) return;

      canvasEl.current.width = img.width;
      canvasEl.current.height = img.height;

      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }

      const isFreeDrawMode = ["paint", "highlighter", "spray", "blur", "erase"].includes(brushActionRef.current);

      const fCanvas = new fabric.Canvas(canvasEl.current, {
        isDrawingMode: isFreeDrawMode,
        width: img.width,
        height: img.height,
        backgroundColor: "transparent",
        enableRetinaScaling: true,
      });

      fCanvas.setDimensions({ width: "100%", height: "100%" }, { cssOnly: true });
      fabricCanvas.current = fCanvas;

      // Setup initial brush
      if (brushActionRef.current === "spray") {
        const spray = new fabric.CircleBrush(fCanvas);
        spray.width = brushSizeRef.current * 2;
        spray.color = fillColorRef.current;
        fCanvas.freeDrawingBrush = spray;
      } else {
        const pencil = new fabric.PencilBrush(fCanvas);
        pencil.width = brushSizeRef.current;
        if (brushActionRef.current === "erase") {
          (pencil as any).globalCompositeOperation = "destination-out";
          pencil.color = "rgba(0,0,0,1)";
        } else if (brushActionRef.current === "highlighter") {
          (pencil as any).globalCompositeOperation = "source-over";
          pencil.color = fillColorRef.current.startsWith("#")
            ? `${fillColorRef.current}80`
            : fillColorRef.current;
        } else if (brushActionRef.current === "blur") {
          (pencil as any).globalCompositeOperation = "source-over";
          pencil.color = "rgba(30,30,36,0.85)";
          pencil.width = brushSizeRef.current * 1.5;
        } else {
          (pencil as any).globalCompositeOperation = "source-over";
          pencil.color = fillColorRef.current;
        }
        fCanvas.freeDrawingBrush = pencil;
      }

      fCanvas.calcOffset();

      fCanvas.on("mouse:down", (options) => {
        if (fCanvas.isDrawingMode) return;
        const pointer = fCanvas.getScenePoint(options.e);
        startPointerRef.current = pointer;
        isMouseDownRef.current = true;

        const currentAction = brushActionRef.current;
        const currentSize = brushSizeRef.current;
        const currentFill = fillColorRef.current;
        const currentTextBg = textBgColorRef.current;
        const currentFont = fontFamilyRef.current;
        const currentStroke = textStrokeColorRef.current;
        const currentAlign = textAlignRef.current;
        const currentOpacity = opacityRef.current;
        const currentFilled = isFilledRef.current;

        if (currentAction === "text") {
          if (options.target && options.target.type === "textbox") return;
          const text = new fabric.Textbox("Type here", {
            left: pointer.x,
            top: pointer.y,
            fontSize: currentSize,
            fontFamily: currentFont || "Comic Sans MS",
            fill: currentFill,
            stroke: currentStroke || undefined,
            strokeWidth: currentStroke ? 1 : 0,
            backgroundColor: currentTextBg || "transparent",
            textAlign: currentAlign || "center",
            opacity: currentOpacity / 100,
            editable: true,
            padding: 6,
            cornerStyle: "circle",
            transparentCorners: false,
          });
          fCanvas.add(text);
          fCanvas.setActiveObject(text);
          text.enterEditing();
          text.selectAll();
          return;
        }

        if (currentAction === "line") {
          const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: currentFill,
            strokeWidth: currentSize,
            opacity: currentOpacity / 100,
          });
          activeShapeRef.current = line;
          fCanvas.add(line);
        } else if (currentAction === "rect") {
          const rect = new fabric.Rect({
            left: pointer.x,
            top: pointer.y,
            width: 0,
            height: 0,
            fill: currentFilled ? currentFill : "transparent",
            stroke: currentFill,
            strokeWidth: currentSize,
            opacity: currentOpacity / 100,
          });
          activeShapeRef.current = rect;
          fCanvas.add(rect);
        } else if (currentAction === "circle") {
          const circle = new fabric.Ellipse({
            left: pointer.x,
            top: pointer.y,
            rx: 0,
            ry: 0,
            fill: currentFilled ? currentFill : "transparent",
            stroke: currentFill,
            strokeWidth: currentSize,
            opacity: currentOpacity / 100,
          });
          activeShapeRef.current = circle;
          fCanvas.add(circle);
        } else if (currentAction === "arrow") {
          const line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            stroke: currentFill,
            strokeWidth: currentSize,
            opacity: currentOpacity / 100,
          });
          activeShapeRef.current = line;
          fCanvas.add(line);
        }
      });

      fCanvas.on("mouse:move", (options) => {
        if (!isMouseDownRef.current || !activeShapeRef.current) return;
        const p = fCanvas.getScenePoint(options.e);

        if (activeShapeRef.current.type === "line") {
          (activeShapeRef.current as fabric.Line).set({ x2: p.x, y2: p.y });
        } else if (activeShapeRef.current.type === "rect") {
          const left = Math.min(startPointerRef.current.x, p.x);
          const top = Math.min(startPointerRef.current.y, p.y);
          const width = Math.abs(p.x - startPointerRef.current.x);
          const height = Math.abs(p.y - startPointerRef.current.y);
          (activeShapeRef.current as fabric.Rect).set({ left, top, width, height });
        } else if (activeShapeRef.current.type === "ellipse") {
          const rx = Math.abs(p.x - startPointerRef.current.x) / 2;
          const ry = Math.abs(p.y - startPointerRef.current.y) / 2;
          const left = Math.min(startPointerRef.current.x, p.x);
          const top = Math.min(startPointerRef.current.y, p.y);
          (activeShapeRef.current as fabric.Ellipse).set({ left, top, rx, ry });
        }
        fCanvas.renderAll();
      });

      fCanvas.on("mouse:up", () => {
        isMouseDownRef.current = false;
        activeShapeRef.current = null;
      });
    };
    img.src = imgUrl;

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [isActive, imgUrl]);

  // Recalibrate offsets dynamically on window/container resize
  useEffect(() => {
    if (!isActive) return;

    const updateOffset = () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.calcOffset();
      }
    };

    window.addEventListener("resize", updateOffset);
    window.addEventListener("scroll", updateOffset, true);

    const observer = new ResizeObserver(() => {
      updateOffset();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener("resize", updateOffset);
      window.removeEventListener("scroll", updateOffset, true);
      observer.disconnect();
    };
  }, [isActive]);

  useEffect(() => {
    if (fabricCanvas.current && isActive) {
      const isFreeDraw = ["paint", "highlighter", "spray", "blur", "erase"].includes(brushAction);
      fabricCanvas.current.isDrawingMode = isFreeDraw;

      if (isFreeDraw && fabricCanvas.current.freeDrawingBrush) {
        const brush = fabricCanvas.current.freeDrawingBrush as any;
        brush.width = brushSize;
        if (brushAction === "erase") {
          brush.globalCompositeOperation = "destination-out";
          brush.color = "rgba(0,0,0,1)";
        } else if (brushAction === "highlighter") {
          brush.globalCompositeOperation = "source-over";
          brush.color = fillColor.startsWith("#") ? `${fillColor}80` : fillColor;
        } else if (brushAction === "blur") {
          brush.globalCompositeOperation = "source-over";
          brush.color = "rgba(30,30,36,0.85)";
        } else {
          brush.globalCompositeOperation = "source-over";
          brush.color = fillColor;
        }
      }

      // Update selected textbox if active
      const activeObj = fabricCanvas.current.getActiveObject();
      if (activeObj && activeObj.type === "textbox") {
        (activeObj as fabric.Textbox).set({
          fontSize: brushSize,
          fontFamily,
          fill: fillColor,
          backgroundColor: textBgColor || "transparent",
          stroke: textStrokeColor || undefined,
          strokeWidth: textStrokeColor ? 1 : 0,
          textAlign,
        });
        fabricCanvas.current.renderAll();
      }
    }
  }, [brushSize, brushAction, fillColor, textBgColor, opacity, fontFamily, textStrokeColor, textAlign, isFilled, isActive]);

  useEffect(() => {
    if (!isActive) return;

    const handleSaveRequest = async () => {
      if (fabricCanvas.current) {
        try {
          const srcToLoad = (imgUrl.startsWith("http://") || imgUrl.startsWith("https://"))
            ? `/api/proxy-image?url=${encodeURIComponent(imgUrl)}`
            : imgUrl;

          const fabImg = await fabric.Image.fromURL(srcToLoad, { crossOrigin: "anonymous" });
          if (fabImg && fabricCanvas.current) {
            const canvasWidth = fabricCanvas.current.width || 1;
            const canvasHeight = fabricCanvas.current.height || 1;
            fabImg.set({
              scaleX: canvasWidth / (fabImg.width || 1),
              scaleY: canvasHeight / (fabImg.height || 1),
              left: 0,
              top: 0,
              originX: "left",
              originY: "top",
            });

            fabricCanvas.current.backgroundImage = fabImg;
            fabricCanvas.current.renderAll();

            const dataUrl = fabricCanvas.current.toDataURL({
              format: "png",
              quality: 0.92,
              multiplier: 1,
            });

            fabricCanvas.current.backgroundImage = null;
            fabricCanvas.current.renderAll();

            window.dispatchEvent(
              new CustomEvent("FABRIC_SAVE_COMPLETE", { detail: { dataUrl } })
            );
          }
        } catch (err) {
          console.error("[Fabric Layer] Error exporting saved drawing:", err);
        }
      }
    };

    const handleClearRequest = () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.clear();
        fabricCanvas.current.backgroundImage = null;
        fabricCanvas.current.renderAll();
      }
    };

    window.addEventListener("FABRIC_SAVE_REQUEST", handleSaveRequest);
    window.addEventListener("FABRIC_CLEAR_REQUEST", handleClearRequest);
    return () => {
      window.removeEventListener("FABRIC_SAVE_REQUEST", handleSaveRequest);
      window.removeEventListener("FABRIC_CLEAR_REQUEST", handleClearRequest);
    };
  }, [imgUrl, isActive]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 pointer-events-auto overflow-hidden"
      style={{ width: "100%", height: "100%", touchAction: "none" }}
    >
      <style>{`
        .canvas-container {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
        .lower-canvas, .upper-canvas {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
        }
      `}</style>
      <canvas ref={canvasEl} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
