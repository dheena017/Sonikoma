import React, { useEffect, useState } from "react";
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
      className="pointer-events-none bg-neutral-900/95 backdrop-blur-md border border-neutral-700/70 text-neutral-200 text-xs font-medium px-2.5 py-1 rounded-md whitespace-nowrap z-[9999] shadow-xl shadow-black/40 animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {text}
    </div>
  );

  return ReactDOM.createPortal(node, document.body);
};

export default TooltipPortal;
