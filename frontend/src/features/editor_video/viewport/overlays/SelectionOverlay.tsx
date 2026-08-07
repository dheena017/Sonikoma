import React from "react";

interface SelectionOverlayProps {
  bounds?: { x: number; y: number; width: number; height: number };
}

export const SelectionOverlay: React.FC<SelectionOverlayProps> = ({ bounds }) => {
  if (!bounds) return null;
  return (
    <div
      className="absolute border-2 border-purple-500 bg-purple-500/10 pointer-events-none z-30"
      style={{
        left: bounds.x,
        top: bounds.y,
        width: bounds.width,
        height: bounds.height,
      }}
    >
      <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-purple-400 border border-white rounded-full" />
      <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-purple-400 border border-white rounded-full" />
      <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-purple-400 border border-white rounded-full" />
      <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-purple-400 border border-white rounded-full" />
    </div>
  );
};

export default React.memo(SelectionOverlay);
