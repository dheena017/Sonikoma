import React from "react";

interface CanvasBrushLayerProps {
  canvasMaskRef?: React.RefObject<HTMLCanvasElement | null>;
  handleCanvasMouseDown: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseMove: (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => void;
  handleCanvasMouseUp: () => void;
}

export default function CanvasBrushLayer({
  canvasMaskRef,
  handleCanvasMouseDown,
  handleCanvasMouseMove,
  handleCanvasMouseUp,
}: CanvasBrushLayerProps) {
  return (
    <canvas
      ref={canvasMaskRef}
      className="absolute inset-0 z-40 cursor-crosshair pointer-events-auto w-full h-full"
      style={{ touchAction: "none" }}
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleCanvasMouseMove}
      onMouseUp={handleCanvasMouseUp}
      onMouseLeave={handleCanvasMouseUp}
      onTouchStart={handleCanvasMouseDown}
      onTouchMove={handleCanvasMouseMove}
      onTouchEnd={handleCanvasMouseUp}
    />
  );
}
