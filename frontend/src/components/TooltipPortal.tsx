import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

interface TooltipPortalProps {
  text: string;
  visible: boolean;
  anchorRect: DOMRect | null;
}

const TooltipPortal: React.FC<TooltipPortalProps> = ({ text, visible, anchorRect }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted || !visible || !anchorRect) return null;

  const style: React.CSSProperties = {
    position: "fixed",
    left: anchorRect.right + 12,
    top: anchorRect.top + anchorRect.height / 2,
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
