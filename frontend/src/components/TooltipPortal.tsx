import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface TooltipPortalProps {
  text: string;
  visible: boolean;
  anchorRect?: DOMRect | null;
  top?: number;                
  left?: number;               
  width?: number;              
  height?: number;             
}

const TooltipPortal: React.FC<TooltipPortalProps> = ({
  text,
  visible,
  anchorRect,
  top = 0,
  left = 0,
  width = 0,
  height = 0
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !visible) return null;
  if (!anchorRect && width === 0 && height === 0) return null;

  const finalTop = anchorRect ? anchorRect.top : top;
  const finalLeft = anchorRect ? anchorRect.left : left;
  const finalWidth = anchorRect ? anchorRect.width : width;
  const finalHeight = anchorRect ? anchorRect.height : height;

  const style: React.CSSProperties = {
    position: "fixed",
    left: finalLeft + finalWidth + 12,
    top: finalTop + (finalHeight / 2),
    transform: "translateY(-50%)",
    pointerEvents: "none",
    zIndex: 9999,
  };

  const node = (
    <div
      style={style}
      className="pointer-events-none transition-opacity bg-neutral-900 border border-neutral-800 text-white text-xs px-2.5 py-1.5 rounded-lg whitespace-nowrap z-50 shadow-2xl font-mono"
    >
      {text}
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
};

export default TooltipPortal;
