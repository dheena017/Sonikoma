import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";

interface CanvasFabricLayerProps {
  imgUrl: string;
  isActive: boolean;
  brushSize: number;
  brushAction: "paint" | "erase";
  fillColor: string;
}

export default function CanvasFabricLayer({
  imgUrl,
  isActive,
  brushSize,
  brushAction,
  fillColor,
}: CanvasFabricLayerProps) {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!isActive || !canvasEl.current || !containerRef.current) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!canvasEl.current || !containerRef.current) return;

      canvasEl.current.width = img.width;
      canvasEl.current.height = img.height;
      containerRef.current.style.aspectRatio = `${img.width / img.height}`;

      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
      }

      const fCanvas = new fabric.Canvas(canvasEl.current, {
        isDrawingMode: true,
        width: img.width,
        height: img.height,
        backgroundColor: "transparent",
      });

      fabric.Image.fromURL(imgUrl, { crossOrigin: "anonymous" }).then((fabImg) => {
        fCanvas.backgroundImage = fabImg;
        fCanvas.renderAll();
      });

      fabricCanvas.current = fCanvas;

      fCanvas.freeDrawingBrush = new fabric.PencilBrush(fCanvas);
      fCanvas.freeDrawingBrush.width = brushSize;
      fCanvas.freeDrawingBrush.color = brushAction === "erase" ? "rgba(255,255,255,1)" : fillColor;

      if (brushAction === "erase") {
        (fCanvas.freeDrawingBrush as any).color = "white"; 
      }
    };
    img.src = imgUrl;

    return () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.dispose();
        fabricCanvas.current = null;
      }
    };
  }, [isActive, imgUrl]);

  useEffect(() => {
    if (fabricCanvas.current && isActive) {
      fabricCanvas.current.freeDrawingBrush.width = brushSize;
      if (brushAction === "erase") {
         fabricCanvas.current.freeDrawingBrush.color = "white";
      } else {
         fabricCanvas.current.freeDrawingBrush.color = fillColor;
      }
    }
  }, [brushSize, brushAction, fillColor, isActive]);

  useEffect(() => {
    const handleSaveRequest = () => {
      if (fabricCanvas.current) {
        const dataUrl = fabricCanvas.current.toDataURL({
          format: "jpeg",
          quality: 1,
          multiplier: 1,
        });
        window.dispatchEvent(
          new CustomEvent("FABRIC_SAVE_COMPLETE", { detail: { dataUrl } })
        );
      }
    };
    
    const handleClearRequest = () => {
      if (fabricCanvas.current) {
        fabricCanvas.current.clear();
        fabric.Image.fromURL(imgUrl, { crossOrigin: "anonymous" }).then((fabImg) => {
          if (fabricCanvas.current) {
            fabricCanvas.current.backgroundImage = fabImg;
            fabricCanvas.current.renderAll();
          }
        });
      }
    };

    window.addEventListener("FABRIC_SAVE_REQUEST", handleSaveRequest);
    window.addEventListener("FABRIC_CLEAR_REQUEST", handleClearRequest);
    return () => {
      window.removeEventListener("FABRIC_SAVE_REQUEST", handleSaveRequest);
      window.removeEventListener("FABRIC_CLEAR_REQUEST", handleClearRequest);
    };
  }, [imgUrl]);

  if (!isActive) return null;

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-40 pointer-events-auto"
      style={{ width: "100%", height: "100%" }}
    >
      <canvas ref={canvasEl} style={{ width: "100%", height: "100%" }} />
    </div>
  );
}
