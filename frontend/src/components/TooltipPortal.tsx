import React from "react";
import ReactDOM from "react-dom";

interface TooltipPortalProps {
  text: string;
  visible: boolean;
  anchorRect: DOMRect | null;
}

const TooltipPortal: React.FC<TooltipPortalProps> = ({
  text,
  visible,
  anchorRect,
}) => {
  // Avoid extra state updates that can contribute to render loops.
  if (typeof document === "undefined") return null;
  if (!visible || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.right + 12,
    top: anchorRect.top + anchorRect.height / 2,
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 9999,
  };

  return ReactDOM.createPortal(
    <div
      style={style}
      className="pointer-events-none transition-opacity bg-neutral-900 border border-neutral-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl font-mono"
    >
      {text}
    </div>,
    document.body
  );
};

export default TooltipPortal;

