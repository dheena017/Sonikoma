import React, { useEffect, useRef } from "react";
import * as fabric from "fabric";

interface CanvasFabricLayerProps {
  imgUrl: string;
  isActive: boolean;
  brushSize: number;
  brushAction: "paint" | "erase" | "text";
  fillColor: string;
  textBgColor?: string;
}

export default function CanvasFabricLayer({
  imgUrl,
  isActive,
  brushSize,
  brushAction,
  fillColor,
  textBgColor,
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
        isDrawingMode: brushAction !== "text",
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
      
      fCanvas.on("mouse:down", (options) => {
        if (fCanvas.isDrawingMode) return;
        // Text mode
        if (options.target && options.target.type === "textbox") return; // clicked on existing text
        
        const pointer = fCanvas.getScenePoint(options.e);
        const text = new fabric.Textbox("Type here", {
          left: pointer.x,
          top: pointer.y,
          fontSize: brushSize,
          fill: fillColor,
          backgroundColor: textBgColor || "#ffffff",
          editable: true,
          padding: 8,
          cornerStyle: "circle",
          transparentCorners: false,
        });
        fCanvas.add(text);
        fCanvas.setActiveObject(text);
        text.enterEditing();
        text.selectAll();
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

  useEffect(() => {
    if (fabricCanvas.current && isActive) {
      fabricCanvas.current.isDrawingMode = brushAction !== "text";
      fabricCanvas.current.freeDrawingBrush.width = brushSize;
      if (brushAction === "erase") {
         fabricCanvas.current.freeDrawingBrush.color = "white";
      } else if (brushAction === "paint") {
         fabricCanvas.current.freeDrawingBrush.color = fillColor;
      }
      
      // Update selected textbox if active
      const activeObj = fabricCanvas.current.getActiveObject();
      if (activeObj && activeObj.type === "textbox") {
         (activeObj as fabric.Textbox).set("fontSize", brushSize);
         (activeObj as fabric.Textbox).set("fill", fillColor);
         (activeObj as fabric.Textbox).set("backgroundColor", textBgColor);
         fabricCanvas.current.renderAll();
      }
    }
  }, [brushSize, brushAction, fillColor, textBgColor, isActive]);

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
